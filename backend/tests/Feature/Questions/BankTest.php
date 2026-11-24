<?php

use App\Models\AttemptItem;
use App\Models\Competence;
use App\Models\Pool;
use App\Models\Question;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// C-004 · the Examiner's own bank (D-041, D-059, Q-054–Q-057).

/** Signs in as a new Examiner; returns them. */
function bankExaminer(): User
{
    $examiner = User::factory()->examiner()->create();
    test()->withToken($examiner->createToken('spa')->plainTextToken);

    return $examiner;
}

/** A Ready short answer with every field, in this Examiner's bank. */
function readyQuestion(User $examiner, array $attributes = []): Question
{
    return Question::factory()->ready()->for($examiner, 'examiner')->create(array_merge([
        'answer_key' => ['kind' => 'number', 'value' => '42'],
    ], $attributes));
}

it('creates a Draft from a code, a subject and a type', function () {
    $examiner = bankExaminer();

    $this->postJson('/api/questions', ['code' => 'M6-UG-001', 'section' => 'subject_1', 'type' => 'single_choice'])
        ->assertCreated()
        ->assertJsonPath('question.code', 'M6-UG-001')
        ->assertJsonPath('question.status', 'draft')
        ->assertJsonPath('question.type', 'single_choice')
        ->assertJsonPath('question.problems.0.code', 'required');

    expect($examiner->questions()->count())->toBe(1);
});

it('refuses a missing, taken or malformed code and a type that does not fit the subject', function () {
    bankExaminer();
    Question::factory()->create(['code' => 'M6-UG-001']);

    $this->postJson('/api/questions', [])->assertUnprocessable()
        ->assertJsonPath('errors.code.0', 'required')
        ->assertJsonPath('errors.section.0', 'required')
        ->assertJsonPath('errors.type.0', 'required');
    $this->postJson('/api/questions', ['code' => 'M6-UG-001', 'section' => 'subject_1', 'type' => 'short_answer'])
        ->assertJsonPath('errors.code.0', 'taken');
    $this->postJson('/api/questions', ['code' => 'M6 UG/1', 'section' => 'subject_1', 'type' => 'short_answer'])
        ->assertJsonPath('errors.code.0', 'invalid');
    $this->postJson('/api/questions', ['code' => 'M6-UG-002', 'section' => 'subject_2', 'type' => 'short_answer'])
        ->assertJsonPath('errors.type.0', 'invalid');
});

it('lists only the Examiner\'s own questions, not library entries, with competence, topic and pools', function () {
    $examiner = bankExaminer();
    $mine = readyQuestion($examiner, ['code' => 'M6-UG-001']);
    $pool = Pool::factory()->for($examiner, 'examiner')->create(['name' => 'Unghiuri – ușor']);
    $pool->questions()->attach($mine);
    Question::factory()->ready()->inLibrary()->for($examiner, 'examiner')->create(['competence_id' => $mine->competence_id, 'topic_id' => $mine->topic_id]);
    readyQuestion(User::factory()->examiner()->create());

    $this->getJson('/api/questions')->assertOk()
        ->assertJsonCount(1, 'questions')
        ->assertJsonPath('questions.0.code', 'M6-UG-001')
        ->assertJsonPath('questions.0.competence.code', $mine->competence->code)
        ->assertJsonPath('questions.0.topic.name', $mine->topic->name)
        ->assertJsonPath('questions.0.pools.0.name', 'Unghiuri – ușor');
});

it('filters the bank', function () {
    $examiner = bankExaminer();
    $a = readyQuestion($examiner, ['code' => 'M6-UG-001', 'statement' => 'Unghiurile opuse la vârf …', 'difficulty' => 'easy', 'grade_level' => 6]);
    $b = readyQuestion($examiner, ['code' => 'M7-RP-002', 'statement' => 'Proporții …', 'difficulty' => 'hard', 'grade_level' => 7]);
    $draft = Question::factory()->for($examiner, 'examiner')->create(['code' => 'M6-TR-003', 'type' => 'single_choice']);
    $pool = Pool::factory()->for($examiner, 'examiner')->create();
    $pool->questions()->attach($b);

    $codes = fn (string $query) => collect($this->getJson('/api/questions?'.$query)->assertOk()->json('questions'))->pluck('code')->all();

    expect($codes('search=ug-001'))->toBe(['M6-UG-001'])
        ->and($codes('search=proporții'))->toBe(['M7-RP-002'])
        ->and($codes('difficulty=easy'))->toBe(['M6-UG-001'])
        ->and($codes('grade_level=7'))->toBe(['M7-RP-002'])
        ->and($codes('status=draft'))->toBe(['M6-TR-003'])
        ->and($codes('type=single_choice'))->toBe(['M6-TR-003'])
        ->and($codes('section=subject_2'))->toBe([])
        ->and($codes('pool_id='.$pool->id))->toBe(['M7-RP-002'])
        ->and($codes('competence_id='.$a->competence_id))->toBe(['M6-UG-001'])
        ->and($codes('topic_id='.$b->topic_id))->toBe(['M7-RP-002']);
});

it('shows a question with everything the editor needs and what Ready still needs', function () {
    $examiner = bankExaminer();
    $question = Question::factory()->subjectTwo()->withBarem()->for($examiner, 'examiner')->create(['points' => 20]);
    $question->baremSteps()->create(['position' => 1, 'description' => 'Triunghi isoscel', 'points' => 14]);

    $this->getJson("/api/questions/{$question->id}")->assertOk()
        ->assertJsonPath('question.uses_barem', true)
        ->assertJsonPath('question.barem.0.description', 'Triunghi isoscel')
        ->assertJsonPath('question.barem.0.points', 14)
        ->assertJsonFragment(['code' => 'barem_incomplete'])
        ->assertJsonFragment(['code' => 'required', 'field' => 'topic']);
});

it('saves the fields, the pools and the barem', function () {
    $examiner = bankExaminer();
    $question = Question::factory()->subjectTwo()->for($examiner, 'examiner')->create();
    $competence = Competence::factory()->for($examiner, 'examiner')->create();
    $topic = Topic::factory()->for($examiner, 'examiner')->create();
    $pool = Pool::factory()->for($examiner, 'examiner')->create();

    $this->patchJson("/api/questions/{$question->id}", [
        'statement' => 'În triunghiul ABC, AB = AC și ∢A = 40°.',
        'grade_level' => 6, 'difficulty' => 'medium', 'points' => 20,
        'competence_id' => $competence->id, 'topic_id' => $topic->id, 'pool_ids' => [$pool->id],
        'uses_barem' => true,
        'barem' => [['description' => 'Triunghi isoscel ⇒ ∢B = ∢C', 'points' => 8], ['description' => '∢B = 70°', 'points' => 12]],
        'explanation' => 'Suma unghiurilor este 180°.',
    ])->assertOk()
        ->assertJsonPath('question.statement', 'În triunghiul ABC, AB = AC și ∢A = 40°.')
        ->assertJsonPath('question.pools.0.id', $pool->id)
        ->assertJsonPath('question.barem.1.points', 12)
        ->assertJsonPath('question.problems', []);

    $this->postJson("/api/questions/{$question->id}/ready")->assertOk()->assertJsonPath('question.status', 'ready');
});

it('refuses another Examiner\'s competence, topic or pool, a barem on Subject I, and changing the code', function () {
    $examiner = bankExaminer();
    $question = Question::factory()->for($examiner, 'examiner')->create(['code' => 'M6-UG-001']);
    $other = User::factory()->examiner()->create();

    $this->patchJson("/api/questions/{$question->id}", [
        'competence_id' => Competence::factory()->for($other, 'examiner')->create()->id,
        'topic_id' => Topic::factory()->for($other, 'examiner')->create()->id,
        'pool_ids' => [Pool::factory()->for($other, 'examiner')->create()->id],
        'uses_barem' => true,
    ])->assertUnprocessable()
        ->assertJsonPath('errors.competence_id.0', 'invalid')
        ->assertJsonPath('errors.topic_id.0', 'invalid')
        ->assertJsonPath('errors.pool_ids.0', 'invalid')
        ->assertJsonPath('errors.uses_barem.0', 'invalid');

    $this->patchJson("/api/questions/{$question->id}", ['code' => 'M6-UG-999'])->assertOk();
    expect($question->fresh()->code)->toBe('M6-UG-001');
});

it('marks Ready only when complete, and refuses a save that would leave a Ready question incomplete (Q-057)', function () {
    $examiner = bankExaminer();
    $draft = Question::factory()->for($examiner, 'examiner')->create();
    $ready = readyQuestion($examiner);

    $this->postJson("/api/questions/{$draft->id}/ready")->assertUnprocessable()
        ->assertJsonPath('errors.status.0', 'not_ready')
        ->assertJsonFragment(['code' => 'required', 'field' => 'topic']);

    $this->patchJson("/api/questions/{$ready->id}", ['topic_id' => null])->assertUnprocessable()
        ->assertJsonPath('errors.status.0', 'not_ready');
    expect($ready->fresh()->topic_id)->not->toBeNull();

    $this->postJson("/api/questions/{$ready->id}/draft")->assertOk()->assertJsonPath('question.status', 'draft');
    $this->patchJson("/api/questions/{$ready->id}", ['topic_id' => null])->assertOk();
});

it('deletes a question no Attempt has drawn, and refuses one that was drawn (Q-056)', function () {
    $examiner = bankExaminer();
    $free = readyQuestion($examiner);
    $drawn = readyQuestion($examiner);

    $this->deleteJson("/api/questions/{$free->id}")->assertNoContent();
    expect(Question::find($free->id))->toBeNull();

    AttemptItem::factory()->create(['question_id' => $drawn->id]);

    $this->deleteJson("/api/questions/{$drawn->id}")->assertConflict()->assertJsonPath('code', 'question_drawn');
    expect(Question::find($drawn->id))->not->toBeNull();
});

it('keeps each bank private and the routes for Examiners', function () {
    $owner = User::factory()->examiner()->create();
    $question = readyQuestion($owner);
    bankExaminer();

    $this->getJson("/api/questions/{$question->id}")->assertNotFound();
    $this->patchJson("/api/questions/{$question->id}", ['statement' => 'x'])->assertNotFound();
    $this->deleteJson("/api/questions/{$question->id}")->assertNotFound();
    $this->postJson("/api/questions/{$question->id}/ready")->assertNotFound();

    $this->app['auth']->forgetGuards();
    $this->withToken(User::factory()->candidate()->create()->createToken('spa')->plainTextToken)
        ->getJson('/api/questions')->assertForbidden()->assertJsonPath('code', 'forbidden_role');
});

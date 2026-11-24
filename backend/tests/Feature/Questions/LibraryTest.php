<?php

use App\Models\Competence;
use App\Models\Question;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// C-004 · the shared library: frozen copies (D-040), copied into one's own bank (D-027, Q-054, Q-058).

function libraryAuthor(): array
{
    $author = User::factory()->examiner()->create(['first_name' => 'Ion', 'last_name' => 'Marin']);
    $competence = Competence::factory()->for($author, 'examiner')->create(['code' => 'C3', 'description' => 'Recunoaște unghiuri opuse la vârf']);
    $topic = Topic::factory()->for($author, 'examiner')->create(['name' => 'Unghiuri']);
    $question = Question::factory()->subjectTwo()->ready()->withBarem()->for($author, 'examiner')->create([
        'code' => 'M6-UG-012', 'statement' => 'Unghiurile AOB și BOC …', 'points' => 20,
        'competence_id' => $competence->id, 'topic_id' => $topic->id,
    ]);
    $question->baremSteps()->create(['position' => 1, 'description' => 'Tot', 'points' => 20]);

    return [$author, $question];
}

it('publishes a Ready question as a frozen copy, once', function () {
    [$author, $question] = libraryAuthor();
    $this->withToken($author->createToken('spa')->plainTextToken);

    $this->postJson("/api/questions/{$question->id}/publish")->assertCreated()
        ->assertJsonPath('entry.code', 'LIB-M6-UG-012')
        ->assertJsonPath('entry.author', 'Ion Marin');
    $this->postJson("/api/questions/{$question->id}/publish")->assertConflict()->assertJsonPath('code', 'already_published');

    $this->patchJson("/api/questions/{$question->id}", ['statement' => 'Alt enunț'])->assertOk();
    $this->getJson('/api/library')->assertOk()
        ->assertJsonPath('entries.0.statement', 'Unghiurile AOB și BOC …')
        ->assertJsonPath('entries.0.competence.code', 'C3')
        ->assertJsonPath('entries.0.topic.name', 'Unghiuri');
    $this->getJson("/api/questions/{$question->id}")->assertJsonPath('question.published', true);
    $this->getJson('/api/questions')->assertJsonCount(1, 'questions');
});

it('publishes only Ready questions', function () {
    $author = User::factory()->examiner()->create();
    $draft = Question::factory()->for($author, 'examiner')->create();
    $this->withToken($author->createToken('spa')->plainTextToken);

    $this->postJson("/api/questions/{$draft->id}/publish")->assertUnprocessable()->assertJsonPath('errors.status.0', 'not_ready');
});

it('copies an entry into another bank with a new code, bringing its competence and topic', function () {
    [$author, $question] = libraryAuthor();
    $this->withToken($author->createToken('spa')->plainTextToken);
    $entryId = $this->postJson("/api/questions/{$question->id}/publish")->json('entry.id');

    $copier = User::factory()->examiner()->create();
    Topic::factory()->for($copier, 'examiner')->create(['name' => 'unghiuri']);
    $this->app['auth']->forgetGuards();
    $this->withToken($copier->createToken('spa')->plainTextToken);

    $this->postJson("/api/library/{$entryId}/copy", ['code' => 'M6-UG-012'])->assertUnprocessable()->assertJsonPath('errors.code.0', 'taken');
    $copy = $this->postJson("/api/library/{$entryId}/copy", ['code' => 'M6-TR-011'])->assertCreated()
        ->assertJsonPath('question.code', 'M6-TR-011')
        ->assertJsonPath('question.status', 'ready')
        ->assertJsonPath('question.copied_from.code', 'LIB-M6-UG-012')
        ->assertJsonPath('question.competence.code', 'C3')
        ->assertJsonPath('question.topic.name', 'unghiuri')
        ->assertJsonPath('question.barem.0.points', 20)
        ->json('question');

    expect($copier->competences()->pluck('code')->all())->toBe(['C3'])
        ->and($copier->topics()->count())->toBe(1)
        ->and(Question::find($copy['id'])->examiner_id)->toBe($copier->id);
    $this->getJson('/api/library')->assertJsonPath('entries.0.copied_as', 'M6-TR-011');
});

it('copies only library entries', function () {
    [$author, $question] = libraryAuthor();
    $this->withToken(User::factory()->examiner()->create()->createToken('spa')->plainTextToken);

    $this->postJson("/api/library/{$question->id}/copy", ['code' => 'X-1'])->assertNotFound();
});

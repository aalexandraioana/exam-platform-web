<?php

use App\Models\Competence;
use App\Models\Exam;
use App\Models\Pool;
use App\Models\Question;
use App\Models\SchoolClass;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// C-005 · the Examiner's exams: settings, Items, checks, publishing (D-005, D-012, D-015, D-057, Q-059–Q-063).

/** An Examiner signed in, with a class, a pool, a competence and a topic, and `$n` Ready questions per Subject. */
function examSetup(int $subjectOne = 6, int $subjectTwo = 3): array
{
    $examiner = User::factory()->examiner()->create();
    test()->withToken($examiner->createToken('spa')->plainTextToken);
    $class = SchoolClass::factory()->for($examiner, 'examiner')->create(['join_code' => strtoupper(fake()->unique()->bothify('??####'))]);
    $pool = Pool::factory()->for($examiner, 'examiner')->create(['name' => 'Unghiuri']);
    $competence = Competence::factory()->for($examiner, 'examiner')->create(['code' => 'C3']);
    $topic = Topic::factory()->for($examiner, 'examiner')->create();
    foreach (range(1, $subjectOne) as $i) {
        poolQuestion($examiner, $pool, ['competence_id' => $competence->id, 'topic_id' => $topic->id]);
    }
    foreach (range(1, $subjectTwo) as $i) {
        $q = Question::factory()->subjectTwo()->ready()->for($examiner, 'examiner')->create([
            'competence_id' => $competence->id, 'topic_id' => $topic->id, 'difficulty' => 'medium', 'grade_level' => 6, 'points' => 20,
        ]);
        $pool->questions()->attach($q);
    }

    return compact('examiner', 'class', 'pool', 'competence', 'topic');
}

/** Six 5-point Subject I Items and `$subjectTwo` 20-point Subject II Items on the setup's pool (D-062: 3 to publish). */
function fullBlueprint(array $s, Exam $exam, int $subjectTwo = 3): void
{
    foreach (range(1, 6) as $i) {
        test()->postJson("/api/exams/{$exam->id}/items", ['section' => 'subject_1', 'points' => 5, 'pool_id' => $s['pool']->id, 'competence_id' => $s['competence']->id, 'difficulty' => 'easy'])->assertCreated();
    }
    foreach (range(1, $subjectTwo) as $i) {
        test()->postJson("/api/exams/{$exam->id}/items", ['section' => 'subject_2', 'points' => 20, 'pool_id' => $s['pool']->id, 'competence_id' => $s['competence']->id, 'difficulty' => 'medium', 'type' => 'structured_problem'])->assertCreated();
    }
}

it('creates a draft and lists the Examiner\'s exams', function () {
    $s = examSetup(0, 0);
    Exam::factory()->create(['title' => 'Altcuiva']);

    $id = $this->postJson('/api/exams', ['title' => 'Evaluare Unitatea 3'])->assertCreated()
        ->assertJsonPath('exam.title', 'Evaluare Unitatea 3')
        ->assertJsonPath('exam.status', 'draft')
        ->assertJsonPath('exam.max_attempts', 1)
        ->assertJsonPath('exam.score_policy', 'highest')
        ->json('exam.id');

    $this->getJson('/api/exams')->assertOk()
        ->assertJsonCount(1, 'exams')
        ->assertJsonPath('exams.0.id', $id)
        ->assertJsonPath('exams.0.item_count', 0);
    $this->postJson('/api/exams', ['title' => ''])->assertUnprocessable()->assertJsonPath('errors.title.0', 'required');
});

it('saves the settings and the classes, refusing another Examiner\'s class', function () {
    $s = examSetup(0, 0);
    $exam = Exam::factory()->for($s['examiner'], 'examiner')->create(['grade_level' => null, 'duration_minutes' => null]);

    $this->patchJson("/api/exams/{$exam->id}", [
        'grade_level' => 6, 'duration_minutes' => 50, 'max_attempts' => 2, 'score_policy' => 'latest',
        'available_from' => '2026-11-30T08:00:00+02:00', 'available_until' => '2026-11-30T14:00:00+02:00',
        'class_ids' => [$s['class']->id],
    ])->assertOk()
        ->assertJsonPath('exam.duration_minutes', 50)
        ->assertJsonPath('exam.score_policy', 'latest')
        ->assertJsonPath('exam.class_ids', [$s['class']->id]);

    $other = SchoolClass::factory()->create(['join_code' => 'OTHER1']);
    $this->patchJson("/api/exams/{$exam->id}", ['class_ids' => [$other->id], 'grade_level' => 4, 'available_until' => '2026-11-29T08:00:00+02:00'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.class_ids.0', 'invalid')
        ->assertJsonPath('errors.grade_level.0', 'invalid')
        ->assertJsonPath('errors.available_until.0', 'invalid');
});

it('adds, edits, reorders and deletes Items, each with the number of questions it may draw', function () {
    $s = examSetup(3, 0);
    $exam = Exam::factory()->for($s['examiner'], 'examiner')->create();

    $this->postJson("/api/exams/{$exam->id}/items", ['section' => 'subject_1', 'points' => 5, 'pool_id' => $s['pool']->id, 'competence_id' => $s['competence']->id, 'difficulty' => 'easy'])
        ->assertCreated()->assertJsonPath('exam.items.0.eligible', 3)->assertJsonPath('exam.items.0.type', null);
    $second = $this->postJson("/api/exams/{$exam->id}/items", ['section' => 'subject_1', 'points' => 5, 'pool_id' => $s['pool']->id])
        ->assertJsonPath('exam.items.1.eligible', 0)->json('exam.items.1.id');
    $first = $exam->items()->first()->id;

    $this->patchJson("/api/exams/{$exam->id}/items/{$second}", ['competence_id' => $s['competence']->id, 'difficulty' => 'easy', 'type' => 'single_choice', 'topic_id' => $s['topic']->id])
        ->assertOk()->assertJsonPath('exam.items.1.type', 'single_choice')->assertJsonPath('exam.items.1.eligible', 0);

    $this->putJson("/api/exams/{$exam->id}/items/order", ['item_ids' => [$second, $first]])->assertOk()
        ->assertJsonPath('exam.items.0.id', $second)->assertJsonPath('exam.items.0.position', 1);
    $this->putJson("/api/exams/{$exam->id}/items/order", ['item_ids' => [$second]])->assertUnprocessable()->assertJsonPath('errors.item_ids.0', 'invalid');

    $this->deleteJson("/api/exams/{$exam->id}/items/{$second}")->assertOk()->assertJsonCount(1, 'exam.items');
});

it('refuses Item criteria that are not the Examiner\'s or a type that doesn\'t fit the Subject', function () {
    $s = examSetup(0, 0);
    $exam = Exam::factory()->for($s['examiner'], 'examiner')->create();
    $other = User::factory()->examiner()->create();

    $this->postJson("/api/exams/{$exam->id}/items", [
        'section' => 'subject_2', 'type' => 'single_choice',
        'pool_id' => Pool::factory()->for($other, 'examiner')->create()->id,
        'competence_id' => Competence::factory()->for($other, 'examiner')->create()->id,
        'topic_id' => Topic::factory()->for($other, 'examiner')->create()->id,
    ])->assertUnprocessable()
        ->assertJsonPath('errors.type.0', 'invalid')
        ->assertJsonPath('errors.pool_id.0', 'invalid')
        ->assertJsonPath('errors.competence_id.0', 'invalid')
        ->assertJsonPath('errors.topic_id.0', 'invalid');
});

it('counts the questions unsaved Item criteria would match', function () {
    $s = examSetup(4, 0);
    $exam = Exam::factory()->for($s['examiner'], 'examiner')->create();

    $this->postJson("/api/exams/{$exam->id}/match", ['section' => 'subject_1', 'pool_id' => $s['pool']->id, 'competence_id' => $s['competence']->id, 'difficulty' => 'easy'])
        ->assertOk()->assertJsonPath('count', 4);
    $this->postJson("/api/exams/{$exam->id}/match", ['section' => 'subject_1', 'pool_id' => $s['pool']->id, 'competence_id' => $s['competence']->id, 'difficulty' => 'hard'])
        ->assertOk()->assertJsonPath('count', 0);
});

it('lists what blocks publishing, and the competences without an Item as warnings', function () {
    $s = examSetup(1, 0);
    $exam = Exam::factory()->for($s['examiner'], 'examiner')->create(['duration_minutes' => null]);
    $this->postJson("/api/exams/{$exam->id}/items", ['section' => 'subject_1', 'points' => 5, 'pool_id' => $s['pool']->id, 'competence_id' => $s['competence']->id, 'difficulty' => 'easy']);
    $this->postJson("/api/exams/{$exam->id}/items", ['section' => 'subject_1', 'points' => 5, 'pool_id' => $s['pool']->id, 'competence_id' => $s['competence']->id, 'difficulty' => 'easy']);
    $this->postJson("/api/exams/{$exam->id}/items", ['section' => 'subject_2', 'pool_id' => $s['pool']->id]);
    $lonely = Competence::factory()->for($s['examiner'], 'examiner')->create(['code' => 'C9']);
    poolQuestion($s['examiner'], $s['pool'], ['competence_id' => $lonely->id, 'topic_id' => $s['topic']->id]);
    Competence::factory()->for($s['examiner'], 'examiner')->create(['code' => 'C8']); // no Ready question: no warning

    $checks = $this->getJson("/api/exams/{$exam->id}")->assertOk()->json('exam.checks');

    expect($checks['totals'])->toBe(['subject_1' => 10, 'subject_2' => 0])
        ->and($checks['problems'])->toContain(['code' => 'required', 'field' => 'duration_minutes'])
        ->and($checks['problems'])->toContain(['code' => 'required', 'field' => 'classes'])
        ->and($checks['problems'])->toContain(['code' => 'subject_total', 'section' => 'subject_1', 'sum' => 10, 'expected' => 30])
        ->and($checks['problems'])->toContain(['code' => 'subject_total', 'section' => 'subject_2', 'sum' => 0, 'expected' => 60])
        ->and($checks['problems'])->toContain(['code' => 'item_incomplete', 'item' => 3, 'field' => 'points'])
        ->and($checks['problems'])->toContain(['code' => 'item_incomplete', 'item' => 3, 'field' => 'competence'])
        ->and($checks['problems'])->toContain(['code' => 'no_distinct_draw', 'items' => [2, 3]])
        ->and($checks['warnings'])->toBe([['code' => 'competence_missing', 'competence' => ['id' => $lonely->id, 'code' => 'C9', 'description' => $lonely->description]]]);

    $this->postJson("/api/exams/{$exam->id}/publish")->assertUnprocessable()
        ->assertJsonPath('errors.status.0', 'not_publishable')
        ->assertJsonFragment(['code' => 'required', 'field' => 'classes']);
});

it('publishes a complete exam, then only lets the title, description and end change (Q-060)', function () {
    $s = examSetup();
    $exam = Exam::factory()->for($s['examiner'], 'examiner')->create(['available_from' => '2026-11-30 08:00', 'available_until' => '2026-11-30 14:00']);
    $this->patchJson("/api/exams/{$exam->id}", ['class_ids' => [$s['class']->id]]);
    fullBlueprint($s, $exam);

    $this->getJson("/api/exams/{$exam->id}")->assertJsonPath('exam.checks.problems', []);
    $this->postJson("/api/exams/{$exam->id}/publish")->assertOk()->assertJsonPath('exam.status', 'published');
    $this->postJson("/api/exams/{$exam->id}/publish")->assertConflict()->assertJsonPath('code', 'exam_published');

    $this->patchJson("/api/exams/{$exam->id}", ['title' => 'Evaluare finală', 'description' => 'Recapitulare', 'available_until' => '2026-11-30T16:00:00+00:00'])
        ->assertOk()->assertJsonPath('exam.title', 'Evaluare finală');
    foreach ([['duration_minutes' => 40], ['max_attempts' => 3], ['class_ids' => []], ['grade_level' => 7]] as $change) {
        $this->patchJson("/api/exams/{$exam->id}", $change)->assertConflict()->assertJsonPath('code', 'exam_published');
    }
    $item = $exam->items()->first()->id;
    $this->postJson("/api/exams/{$exam->id}/items", ['section' => 'subject_1'])->assertConflict();
    $this->patchJson("/api/exams/{$exam->id}/items/{$item}", ['points' => 6])->assertConflict();
    $this->deleteJson("/api/exams/{$exam->id}/items/{$item}")->assertConflict();
    $this->putJson("/api/exams/{$exam->id}/items/order", ['item_ids' => $exam->items()->pluck('id')->reverse()->values()->all()])->assertConflict();
});

it('deletes a draft and keeps a published exam (Q-061)', function () {
    $s = examSetup(0, 0);
    $draft = Exam::factory()->for($s['examiner'], 'examiner')->create();
    $draft->classes()->attach($s['class']);
    $published = Exam::factory()->published()->for($s['examiner'], 'examiner')->create();

    $this->deleteJson("/api/exams/{$draft->id}")->assertNoContent();
    expect(Exam::find($draft->id))->toBeNull()->and($s['class']->fresh())->not->toBeNull();
    $this->deleteJson("/api/exams/{$published->id}")->assertConflict()->assertJsonPath('code', 'exam_published');
});

it('previews a draw: every Item its own question, values filled, expected answer', function () {
    $s = examSetup();
    $values = Question::factory()->ready()->for($s['examiner'], 'examiner')->create([
        'competence_id' => $s['competence']->id, 'topic_id' => $s['topic']->id, 'difficulty' => 'hard', 'grade_level' => 6,
        'statement' => 'Cât face {a} + {b}?', 'answer_key' => ['kind' => 'number'],
        'parameters' => ['values' => ['a' => ['random' => ['min' => 1, 'max' => 9]], 'b' => ['fixed' => 10]], 'answer' => 'a + b'],
    ]);
    $s['pool']->questions()->attach($values);
    $exam = Exam::factory()->for($s['examiner'], 'examiner')->create();
    fullBlueprint($s, $exam, 2);
    $this->postJson("/api/exams/{$exam->id}/items", ['section' => 'subject_1', 'points' => 5, 'pool_id' => $s['pool']->id, 'competence_id' => $s['competence']->id, 'difficulty' => 'hard']);

    $items = $this->getJson("/api/exams/{$exam->id}/preview")->assertOk()->json('items');

    expect($items)->toHaveCount(9)
        ->and(collect($items)->pluck('question_id')->unique())->toHaveCount(9);
    $drawn = collect($items)->firstWhere('question_id', $values->id);
    expect($drawn['statement'])->toBe("Cât face {$drawn['values']['a']} + 10?")
        ->and($drawn['answer'])->toBe($drawn['values']['a'] + 10)
        ->and($drawn['eligible'])->toBe(1);
});

it('refuses a preview that can\'t be drawn, and keeps exams private', function () {
    $s = examSetup(1, 0);
    $exam = Exam::factory()->for($s['examiner'], 'examiner')->create();
    $this->postJson("/api/exams/{$exam->id}/items", ['section' => 'subject_1', 'points' => 5, 'pool_id' => $s['pool']->id, 'competence_id' => $s['competence']->id, 'difficulty' => 'easy']);
    $this->postJson("/api/exams/{$exam->id}/items", ['section' => 'subject_1', 'points' => 5, 'pool_id' => $s['pool']->id, 'competence_id' => $s['competence']->id, 'difficulty' => 'easy']);

    $this->getJson("/api/exams/{$exam->id}/preview")->assertUnprocessable()->assertJsonPath('errors.status.0', 'not_publishable');

    $theirs = Exam::factory()->create();
    foreach (['getJson' => '', 'patchJson' => '', 'deleteJson' => '', 'postJson' => '/publish'] as $method => $suffix) {
        $this->{$method}("/api/exams/{$theirs->id}{$suffix}")->assertNotFound();
    }
});

it('keeps a Subject II Item at 20 points and publishes only with exactly 3 of them (D-062)', function () {
    $s = examSetup(6, 4);
    $exam = Exam::factory()->for($s['examiner'], 'examiner')->create();
    $exam->classes()->attach($s['class']);
    $item = ['section' => 'subject_2', 'pool_id' => $s['pool']->id, 'competence_id' => $s['competence']->id, 'difficulty' => 'medium', 'type' => 'structured_problem'];

    $this->postJson("/api/exams/{$exam->id}/items", [...$item, 'points' => 30])->assertUnprocessable()->assertJsonPath('errors.points.0', 'invalid');
    $id = $this->postJson("/api/exams/{$exam->id}/items", [...$item, 'points' => 20])->assertCreated()->json('exam.items.0.id');
    $this->patchJson("/api/exams/{$exam->id}/items/{$id}", ['points' => 10])->assertUnprocessable()->assertJsonPath('errors.points.0', 'invalid');

    fullBlueprint($s, $exam, 1);
    $this->getJson("/api/exams/{$exam->id}")->assertJsonFragment(['code' => 'subject_two_items', 'count' => 2, 'expected' => 3]);

    $this->postJson("/api/exams/{$exam->id}/items", [...$item, 'points' => 20])->assertCreated();
    $this->getJson("/api/exams/{$exam->id}")->assertJsonPath('exam.checks.problems', []);

    $this->postJson("/api/exams/{$exam->id}/items", [...$item, 'points' => null])->assertCreated();
    $this->getJson("/api/exams/{$exam->id}")->assertJsonFragment(['code' => 'subject_two_items', 'count' => 4, 'expected' => 3]);
});

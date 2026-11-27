<?php

use App\Enums\AttemptStatus;
use App\Enums\MembershipStatus;
use App\Models\AnswerKeyCorrection;
use App\Models\Attempt;
use App\Models\AttemptItem;
use App\Models\ClassMembership;
use App\Models\ExamItem;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// P8c · D-046: correcting a Subject I answer key after Attempts were submitted re-grades that question
// in every Attempt of an exam whose results aren't published, from each Attempt's own snapshot, and
// logs the change (Q-087). Attempts keep the options as shown (Q-088); adding, removing or reordering
// options, or changing a formula, is refused once drawn (Q-088, Q-089). Items of attemptSetup() plus
// 4 multiple choice (originals 2 and 3 correct) and 5 a text short answer, 5 points each.

function keySetup(): array
{
    $s = attemptSetup();
    $pool = $s['exam']->items()->first()->pool;
    $common = ['competence_id' => $s['questions']['single']->competence_id, 'topic_id' => $s['questions']['single']->topic_id];
    $s['questions']['multi'] = poolQuestion($s['examiner'], $pool, [...$common, 'type' => 'multiple_choice', 'statement' => 'Care numere sunt prime?',
        'answer_key' => ['options' => ['1', '2', '3', '4'], 'correct' => [2, 3]]]);
    $s['questions']['text'] = poolQuestion($s['examiner'], $pool, [...$common, 'type' => 'short_answer', 'statement' => 'Diagonalele paralelogramului …',
        'answer_key' => ['kind' => 'text', 'accepted' => ['sunt congruente']]]);
    foreach ([4 => 'multiple_choice', 5 => 'short_answer'] as $position => $type) {
        ExamItem::factory()->create([
            'exam_id' => $s['exam']->id, 'position' => $position, 'section' => 'subject_1', 'points' => 5,
            'pool_id' => $pool->id, 'competence_id' => $common['competence_id'], 'difficulty' => 'easy', 'type' => $type,
        ]);
    }
    // Item 2 (values) and item 5 (text) are both short answers: keep each on its own question.
    ExamItem::where('exam_id', $s['exam']->id)->where('position', 5)->update(['topic_id' => $topic = Topic::factory()->for($s['examiner'], 'examiner')->create()->id]);
    $s['questions']['text']->forceFill(['topic_id' => $topic])->save();

    return $s;
}

function keyItem(int $attemptId, int $position): AttemptItem
{
    return AttemptItem::where('attempt_id', $attemptId)->where('position', $position)->sole();
}

/** The shown position of an original option position in this Attempt. */
function keyShown(int $attemptId, int $position, int $original): int
{
    return array_search($original, keyItem($attemptId, $position)->expected_answer['option_order'], true) + 1;
}

/** Starts an Attempt as $candidate and answers: single "12" (wrong), dual false (wrong), multi {2} (wrong), text "se injumatatesc" (wrong). */
function keyAttempt(array $s, ?User $candidate = null, bool $submit = true): int
{
    signInAs($candidate ?? $s['candidate']);
    $id = test()->postJson("/api/candidate/exams/{$s['exam']->id}/attempts")->assertCreated()->json('attempt.id');
    foreach ([1 => keyShown($id, 1, 1), 3 => false, 4 => [keyShown($id, 4, 2)], 5 => 'se injumatatesc'] as $position => $value) {
        test()->putJson("/api/attempts/{$id}/items/{$position}/answer", ['answer' => $value, 'version' => 1])->assertOk();
    }
    if ($submit) {
        test()->postJson("/api/attempts/{$id}/submit")->assertOk();
    }

    return $id;
}

function keyPatch(array $s, string $question, array $answerKey)
{
    signInAs($s['examiner']);

    return test()->patchJson("/api/questions/{$s['questions'][$question]->id}", ['answer_key' => $answerKey]);
}

function keyPoints(int $attemptId, int $position): float
{
    return (float) keyItem($attemptId, $position)->answer->awarded_points;
}

it('re-grades a corrected single choice in a submitted Attempt, from its own shown order (D-046, D-045)', function () {
    $s = keySetup();
    $id = keyAttempt($s);
    $before = keyItem($id, 1);
    expect(keyPoints($id, 1))->toBe(0.0)->and((float) Attempt::find($id)->subject_1_score)->toBe(0.0);

    keyPatch($s, 'single', ['options' => ['12', '36', '32', '64'], 'correct' => 1])->assertOk()->assertJsonPath('regraded', ['answers' => 1, 'flagged' => 0]);

    $after = keyItem($id, 1);
    expect(keyPoints($id, 1))->toBe(5.0)
        ->and((float) Attempt::find($id)->subject_1_score)->toBe(5.0)
        ->and($after->expected_answer['answer_key']['correct'])->toBe(1)
        ->and($after->expected_answer['option_order'])->toBe($before->expected_answer['option_order'])
        ->and($after->question_snapshot['options'])->toBe($before->question_snapshot['options']);
});

it('corrects multiple choice, true/false and accepted short answers (D-046)', function (string $question, array $key, int $position) {
    $s = keySetup();
    $id = keyAttempt($s);
    expect(keyPoints($id, $position))->toBe(0.0);

    keyPatch($s, $question, $key)->assertOk()->assertJsonPath('regraded.answers', 1);

    expect(keyPoints($id, $position))->toBe(5.0)->and((float) Attempt::find($id)->subject_1_score)->toBe(5.0);
})->with([
    'multiple choice' => ['multi', ['options' => ['1', '2', '3', '4'], 'correct' => [2]], 4],
    'true/false' => ['dual', ['correct' => false], 3],
    'accepted answers' => ['text', ['kind' => 'text', 'accepted' => ['sunt congruente', 'se înjumătățesc']], 5],
]);

it('updates the total of a graded Attempt', function () {
    $s = keySetup();
    $id = keyAttempt($s);
    Attempt::find($id)->forceFill(['status' => AttemptStatus::Graded, 'subject_2_score' => 40, 'total_score' => 50])->save();

    keyPatch($s, 'single', ['options' => ['12', '36', '32', '64'], 'correct' => 1])->assertOk();

    expect(Attempt::find($id)->total_score)->toBe('55.00'); // 10 + 5 + 40
});

it('gives a running Attempt the corrected key, used when it is submitted', function () {
    $s = keySetup();
    $id = keyAttempt($s, submit: false);

    keyPatch($s, 'single', ['options' => ['12', '36', '32', '64'], 'correct' => 1])->assertOk()->assertJsonPath('regraded.answers', 0);
    expect(keyItem($id, 1)->expected_answer['answer_key']['correct'])->toBe(1);

    signInAs($s['candidate']);
    $this->postJson("/api/attempts/{$id}/submit")->assertOk();
    expect(keyPoints($id, 1))->toBe(5.0);
});

it('keeps what the Candidate saw when an option text is fixed, without re-grading or logging (Q-088)', function () {
    $s = keySetup();
    $id = keyAttempt($s);
    $shown = keyItem($id, 1)->question_snapshot['options'];

    $response = keyPatch($s, 'single', ['options' => ['12', '36', '32', '46'], 'correct' => 2])->assertOk();

    expect($response->json())->not->toHaveKey('regraded')
        ->and($s['questions']['single']->fresh()->answer_key['options'])->toBe(['12', '36', '32', '46'])
        ->and(keyItem($id, 1)->question_snapshot['options'])->toBe($shown)
        ->and(keyItem($id, 1)->expected_answer['answer_key']['options'])->toBe(['12', '36', '32', '64'])
        ->and(AnswerKeyCorrection::count())->toBe(0);
});

it('refuses adding, removing or reordering options, and changing a formula, once drawn (Q-088, Q-089)', function (string $question, array $patch, string $field, string $code) {
    $s = keySetup();
    keyAttempt($s);
    signInAs($s['examiner']);

    $this->patchJson("/api/questions/{$s['questions'][$question]->id}", $patch)
        ->assertUnprocessable()->assertJsonPath("errors.{$field}.0", $code);
})->with([
    'an option added' => ['single', ['answer_key' => ['options' => ['12', '36', '32', '64', '48'], 'correct' => 2]], 'answer_key', 'options_locked'],
    'an option removed' => ['single', ['answer_key' => ['options' => ['12', '36', '32'], 'correct' => 2]], 'answer_key', 'options_locked'],
    'options reordered' => ['single', ['answer_key' => ['options' => ['36', '12', '32', '64'], 'correct' => 1]], 'answer_key', 'options_locked'],
    'a formula changed' => ['values', ['parameters' => ['values' => ['a' => ['random' => ['min' => 1, 'max' => 9]], 'b' => ['fixed' => 10]], 'answer' => 'a + b + 1']], 'parameters', 'parameters_locked'],
]);

it('logs each correction with who, when, the key before and after, and the count, shown on the question (Q-087)', function () {
    $s = keySetup();
    $classmate = User::factory()->candidate()->create();
    $membership = new ClassMembership;
    $membership->class_id = $s['class']->id;
    $membership->candidate_id = $classmate->id;
    $membership->status = MembershipStatus::Accepted;
    $membership->save();
    keyAttempt($s);
    keyAttempt($s, $classmate);

    keyPatch($s, 'single', ['options' => ['12', '36', '32', '64'], 'correct' => 1])->assertOk()->assertJsonPath('regraded.answers', 2);

    $log = AnswerKeyCorrection::sole();
    expect($log->question_id)->toBe($s['questions']['single']->id)
        ->and($log->examiner_id)->toBe($s['examiner']->id)
        ->and($log->before['correct'])->toBe(2)
        ->and($log->after['correct'])->toBe(1)
        ->and($log->answers)->toBe(2);
    $this->getJson("/api/questions/{$s['questions']['single']->id}")->assertOk()
        ->assertJsonPath('question.key_corrections.0.examiner', $s['examiner']->name)
        ->assertJsonPath('question.key_corrections.0.answers', 2)
        ->assertJsonPath('question.key_corrections.0.corrected_at', $log->created_at->toIso8601String());
});

it('does not re-grade or log when the question was never drawn, or the same key is saved', function () {
    $s = keySetup();
    signInAs($s['examiner']);
    $this->patchJson("/api/questions/{$s['questions']['single']->id}", ['answer_key' => ['options' => ['12', '36', '32', '64'], 'correct' => 1]])
        ->assertOk()->assertJsonMissingPath('regraded');

    keyAttempt($s);
    keyPatch($s, 'single', ['options' => ['12', '36', '32', '64'], 'correct' => 1])->assertOk()->assertJsonMissingPath('regraded');

    expect(AnswerKeyCorrection::count())->toBe(0);
});

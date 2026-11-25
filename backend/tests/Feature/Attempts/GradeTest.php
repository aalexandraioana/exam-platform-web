<?php

use App\Models\Answer;
use App\Models\Attempt;
use App\Models\AttemptItem;
use App\Models\Question;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// P6c · Subject I graded when the Attempt becomes submitted, from its own snapshot: shown positions
// mapped through option_order, the drawn answer for values, full points or 0 (D-005, D-006, D-017,
// D-045). Nothing of it is shown before publication (D-019). Items of attemptSetup(), 5 points
// each: 1 single choice ("36" correct, original position 2), 2 short answer {a} + 10, 3 true/false.

function itemOf(int $attemptId, int $position): AttemptItem
{
    return AttemptItem::where('attempt_id', $attemptId)->where('position', $position)->sole();
}

/** The shown position of an original option position in this Attempt. */
function shownOf(int $attemptId, int $position, int $original): int
{
    return array_search($original, itemOf($attemptId, $position)->expected_answer['option_order'], true) + 1;
}

function answerAndSubmit(int $id, array $answers): Attempt
{
    foreach ($answers as $position => $value) {
        test()->putJson("/api/attempts/{$id}/items/{$position}/answer", ['answer' => $value, 'version' => 1])->assertOk();
    }
    test()->postJson("/api/attempts/{$id}/submit")->assertOk();

    return Attempt::findOrFail($id);
}

function pointsOf(int $attemptId, int $position): ?float
{
    $points = itemOf($attemptId, $position)->answer?->awarded_points;

    return $points === null ? null : (float) $points;
}

/** Replaces Item 2's question with a short answer of this key (the values question goes to Draft). */
function shortAnswerSetup(array $key): array
{
    $s = attemptSetup();
    $values = $s['questions']['values'];
    poolQuestion($s['examiner'], $s['exam']->items()->first()->pool, [
        'type' => 'short_answer', 'competence_id' => $values->competence_id, 'topic_id' => $values->topic_id,
        'statement' => 'Scrie rezultatul.', 'answer_key' => $key,
    ]);
    $values->forceFill(['status' => 'draft'])->save();

    return $s;
}

it('scores the single choice by the option shown, whatever the shuffle', function () {
    $s = attemptSetup(['max_attempts' => 30]);
    signInAs($s['candidate']);

    foreach (range(1, 12) as $round) {
        $id = $this->postJson("/api/candidate/exams/{$s['exam']->id}/attempts")->assertCreated()->json('attempt.id');
        $right = shownOf($id, 1, 2);
        $wrong = $right % 4 + 1;
        $round % 2
            ? answerAndSubmit($id, [1 => $right])
            : answerAndSubmit($id, [1 => $wrong]);

        expect(pointsOf($id, 1))->toBe($round % 2 ? 5.0 : 0.0)
            ->and(itemOf($id, 1)->question_snapshot['options'][($round % 2 ? $right : $wrong) - 1] === '36')->toBe((bool) ($round % 2));
    }
});

it('scores multiple choice only for exactly the correct set', function (array $chosenOriginal, float $points) {
    $s = attemptSetup();
    poolQuestion($s['examiner'], $s['exam']->items()->first()->pool, [
        'type' => 'multiple_choice', 'competence_id' => $s['exam']->items()->first()->competence_id,
        'topic_id' => $s['questions']['single']->topic_id, 'statement' => 'Care numere sunt divizibile cu 3?',
        'answer_key' => ['options' => ['12', '14', '21', '25', '30'], 'correct' => [1, 3, 5]],
    ]);
    $s['exam']->items()->where('position', 1)->update(['type' => 'multiple_choice']);
    $id = startAttempt($s);

    answerAndSubmit($id, [1 => array_map(fn ($o) => shownOf($id, 1, $o), $chosenOriginal)]);

    expect(pointsOf($id, 1))->toBe($points);
})->with([
    'exactly the set' => [[5, 1, 3], 5.0],
    'a subset' => [[1, 3], 0.0],
    'a superset' => [[1, 2, 3, 5], 0.0],
    'one wrong' => [[1, 3, 4], 0.0],
]);

it('scores choices filled from values by the correct text shown', function () {
    $s = attemptSetup(['max_attempts' => 30]);
    poolQuestion($s['examiner'], $s['exam']->items()->first()->pool, [
        'type' => 'single_choice', 'competence_id' => $s['exam']->items()->first()->competence_id,
        'topic_id' => $s['questions']['single']->topic_id, 'statement' => 'Cât face {a} + {b}?',
        'answer_key' => ['options' => ['{s}', '{d}', '{m}'], 'correct' => 1],
        'parameters' => ['values' => [
            'a' => ['random' => ['min' => 2, 'max' => 9]], 'b' => ['random' => ['min' => 1, 'max' => 9]],
            's' => ['calculated' => 'a + b'], 'd' => ['calculated' => 'a - b'], 'm' => ['calculated' => 'a · b'],
        ]],
    ]);
    $s['questions']['single']->forceFill(['status' => 'draft'])->save();
    signInAs($s['candidate']);

    foreach (range(1, 8) as $round) {
        $id = $this->postJson("/api/candidate/exams/{$s['exam']->id}/attempts")->json('attempt.id');
        $v = itemOf($id, 1)->drawn_values;
        $shown = array_search((string) ($v['a'] + $v['b']), itemOf($id, 1)->question_snapshot['options'], true) + 1;
        answerAndSubmit($id, [1 => $shown]);

        expect(pointsOf($id, 1))->toBe(5.0);
    }
});

it('checks a short answer with values against this Attempt\'s drawn answer', function () {
    $s = attemptSetup(['max_attempts' => 2]);
    signInAs($s['candidate']);

    $first = $this->postJson("/api/candidate/exams/{$s['exam']->id}/attempts")->json('attempt.id');
    $drawn = itemOf($first, 2)->expected_answer['answer'];
    answerAndSubmit($first, [2 => (string) $drawn]);
    expect(pointsOf($first, 2))->toBe(5.0);

    $second = $this->postJson("/api/candidate/exams/{$s['exam']->id}/attempts")->json('attempt.id');
    answerAndSubmit($second, [2 => (string) (itemOf($second, 2)->expected_answer['answer'] + 1)]);
    expect(pointsOf($second, 2))->toBe(0.0);
});

it('applies the matching rules to short answers (D-017)', function (array $key, string $given, float $points) {
    $id = startAttempt(shortAnswerSetup($key));

    answerAndSubmit($id, [2 => $given]);

    expect(pointsOf($id, 2))->toBe($points);
})->with([
    'decimal comma' => [['kind' => 'number', 'value' => '2.5'], '2,5', 5.0],
    'another number' => [['kind' => 'number', 'value' => '2.5'], '2,6', 0.0],
    'the expected fraction form' => [['kind' => 'fraction', 'value' => '3/4'], '3/4', 5.0],
    'an equal fraction in another form' => [['kind' => 'fraction', 'value' => '3/4'], '6/8', 0.0],
    'text without diacritics or case' => [['kind' => 'text', 'accepted' => ['se înjumătățesc']], ' SE  INJUMATATESC ', 5.0],
]);

it('scores true/false, gives 0 to unanswered and cleared items, and records them', function () {
    $id = startAttempt(attemptSetup());
    $this->putJson("/api/attempts/{$id}/items/2/answer", ['answer' => '11', 'version' => 1])->assertOk();
    $this->putJson("/api/attempts/{$id}/items/2/answer", ['answer' => null, 'version' => 2])->assertOk();
    answerAndSubmit($id, [3 => true]);

    expect(pointsOf($id, 3))->toBe(5.0)
        ->and(pointsOf($id, 2))->toBe(0.0)
        ->and(pointsOf($id, 1))->toBe(0.0);
    $unanswered = itemOf($id, 1)->answer;
    expect($unanswered->answer)->toBeNull()->and($unanswered->version)->toBe(0)
        ->and($unanswered->graded_at)->not->toBeNull()->and($unanswered->graded_by)->toBeNull();

    $id2 = startAttempt(attemptSetup());
    answerAndSubmit($id2, [3 => false]);
    expect(pointsOf($id2, 3))->toBe(0.0);
});

it('sums Subject I, leaves Subject II ungraded and the Attempt submitted without a total', function () {
    $id = startAttempt(attemptSetup());
    $problem = itemOf($id, 2);
    $problem->question_snapshot = [...$problem->question_snapshot, 'section' => 'subject_2', 'type' => 'structured_problem', 'options' => []];
    $problem->save();
    $this->putJson("/api/attempts/{$id}/items/2/answer", ['answer' => 'Pasul 1 …', 'version' => 1])->assertOk();

    $attempt = answerAndSubmit($id, [1 => shownOf($id, 1, 2), 3 => true]);

    expect((float) $attempt->subject_1_score)->toBe(10.0)
        ->and(pointsOf($id, 2))->toBeNull()
        ->and($attempt->status->value)->toBe('submitted')
        ->and($attempt->total_score)->toBeNull();
});

it('grades on every way an Attempt becomes submitted', function (string $route) {
    $this->freezeSecond();
    $s = attemptSetup();
    $id = startAttempt($s);
    $this->putJson("/api/attempts/{$id}/items/3/answer", ['answer' => true, 'version' => 1])->assertOk();
    $this->travelTo(Attempt::find($id)->expires_at->copy()->addSeconds($route === 'submit' ? 0 : 31));

    match ($route) {
        'submit', 'late submit' => $this->postJson("/api/attempts/{$id}/submit")->assertOk(),
        'save after the grace' => $this->putJson("/api/attempts/{$id}/items/2/answer", ['answer' => '1', 'version' => 1])->assertConflict(),
        'seal on read' => $this->getJson("/api/attempts/{$id}")->assertOk(),
        'cron command' => $this->artisan('attempts:seal-expired')->assertSuccessful(),
    };

    $attempt = Attempt::find($id);
    expect($attempt->status->value)->toBe('submitted')
        ->and((float) $attempt->subject_1_score)->toBe(5.0)
        ->and(Answer::whereIn('attempt_item_id', $attempt->items()->pluck('id'))->whereNotNull('graded_at')->count())->toBe(3);
})->with(['submit', 'late submit', 'save after the grace', 'seal on read', 'cron command']);

it('grades from the snapshot, not from the question as edited later', function () {
    $s = attemptSetup();
    $id = startAttempt($s);
    $right = shownOf($id, 1, 2);
    Question::whereKey($s['questions']['single']->id)->update(['answer_key' => json_encode(['options' => ['12', '36', '32', '64'], 'correct' => 1])]);

    answerAndSubmit($id, [1 => $right]);

    expect(pointsOf($id, 1))->toBe(5.0);
});

it('shows no score or correctness to the Candidate before publication (D-019)', function () {
    $s = attemptSetup();
    $id = startAttempt($s);
    answerAndSubmit($id, [3 => true]);

    foreach ([$this->getJson("/api/attempts/{$id}"), $this->getJson('/api/candidate/exams'), $this->postJson("/api/attempts/{$id}/submit")] as $response) {
        foreach (['score', 'awarded', 'points_awarded', 'correct', 'graded'] as $secret) {
            expect($response->getContent())->not->toContain($secret);
        }
    }
});

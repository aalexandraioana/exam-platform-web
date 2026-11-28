<?php

use App\Support\Analysis\ItemAnalysis;

// P10 (D-047, Q-095): difficulty, corrected item-total discrimination, flags and distractors.

it('computes p and the point-biserial r of a 0-or-full item', function () {
    // x = 5, 5, 0, 0 of 5; rest 30, 20, 10, 0: r = 100 / (5 · √500) = 0.8944, the point-biserial
    // (M1 − M0) / s · √(pq) = (25 − 5) / 11.1803 · 0.5.
    $m = ItemAnalysis::measure([5, 5, 0, 0], [30, 20, 10, 0], 5);

    expect($m)->toMatchArray(['n' => 4, 'p' => 0.5, 'r' => 0.8944, 'flags' => [], 'not_enough_data' => false]);
});

it('uses partial scores for a Subject II problem: p is the mean over the maximum', function () {
    expect(ItemAnalysis::measure([20, 10, 5, 5], [40, 30, 20, 10], 20)['p'])->toBe(0.5);
});

it('matches p and r computed independently on a reference set', function (string $case) {
    $data = json_decode(file_get_contents(__DIR__.'/../../fixtures/item-analysis-reference.json'), true)['cases'][$case];

    $m = ItemAnalysis::measure($data['scores'], $data['rests'], $data['max']);

    expect($m['p'])->toBe((float) $data['p'])->and($m['r'])->toBe((float) $data['r']);
})->with(['subject_1', 'subject_2']);

it('shows p and flags it too easy when everyone is correct; r is not enough data', function () {
    $m = ItemAnalysis::measure([5, 5, 5], [30, 20, 10], 5);

    expect($m)->toMatchArray(['n' => 3, 'p' => 1.0, 'r' => null, 'flags' => ['too_easy'], 'not_enough_data' => true]);
});

it('shows p and flags it too hard when everyone is wrong; r is not enough data', function () {
    $m = ItemAnalysis::measure([0, 0, 0], [30, 20, 10], 5);

    expect($m)->toMatchArray(['p' => 0.0, 'r' => null, 'flags' => ['too_hard'], 'not_enough_data' => true]);
});

it('gives no r when the rest of the score does not vary', function () {
    expect(ItemAnalysis::measure([5, 0, 5], [20, 20, 20], 5))->toMatchArray(['p' => 0.6667, 'r' => null]);
});

it('gives neither p nor r, and no flags, with one Attempt', function () {
    expect(ItemAnalysis::measure([5], [30], 5))->toMatchArray(['n' => 1, 'p' => null, 'r' => null, 'flags' => [], 'not_enough_data' => true])
        ->and(ItemAnalysis::measure([], [], 5))->toMatchArray(['n' => 0, 'p' => null, 'r' => null, 'flags' => []]);
});

it('computes r = ±1 with exactly two Attempts, as D-047 allows from 2', function () {
    expect(ItemAnalysis::measure([5, 0], [30, 10], 5)['r'])->toBe(1.0)
        ->and(ItemAnalysis::measure([0, 5], [30, 10], 5)['r'])->toBe(-1.0);
});

it('flags on the thresholds of D-047, from unrounded values', function (?float $p, ?float $r, array $flags) {
    expect(ItemAnalysis::flags($p, $r))->toBe($flags);
})->with([
    'p 0.20 is not too hard' => [0.20, 0.5, []],
    'p just under 0.20' => [0.1999, 0.5, ['too_hard']],
    'p 0.90 is not too easy' => [0.90, 0.5, []],
    'p just over 0.90' => [0.9001, 0.5, ['too_easy']],
    'r 0.20 is enough' => [0.5, 0.20, []],
    'r just under 0.20' => [0.5, 0.1999, ['low_discrimination']],
    'r 0 is low, not negative' => [0.5, 0.0, ['low_discrimination']],
    'negative r' => [0.5, -0.1, ['low_discrimination', 'negative_discrimination']],
    'no r' => [0.95, null, ['too_easy']],
    'no p, no r' => [null, null, []],
]);

it('maps the shown positions back to the original options through option_order (D-045)', function () {
    // Shown 1 is original 3, shown 2 is original 1.
    expect(ItemAnalysis::chosen('single_choice', 1, [3, 1, 2, 4]))->toBe([3])
        ->and(ItemAnalysis::chosen('multiple_choice', [1, 2], [3, 1, 2, 4]))->toBe([3, 1])
        ->and(ItemAnalysis::chosen('dual_choice', false, null))->toBe([false])
        ->and(ItemAnalysis::chosen('single_choice', null, [3, 1, 2, 4]))->toBe([])
        ->and(ItemAnalysis::chosen('short_answer', '12', null))->toBe([]);
});

it('counts each option and flags a wrong one chosen by fewer than 5% as unused; unanswered count in the denominator', function () {
    // 20 Candidates got the question: 17 chose 3 (correct), 1 chose 1 (5%: used), 0 chose 2 and 4, 2 left it unanswered.
    $choices = [...array_fill(0, 17, [3]), [1], [], []];

    $options = ItemAnalysis::distractors($choices, [1 => '12', 2 => '36', 3 => '32', 4 => '64'], [3]);

    expect($options)->toBe([
        ['option' => 1, 'label' => '12', 'correct' => false, 'count' => 1, 'share' => 0.05, 'unused' => false],
        ['option' => 2, 'label' => '36', 'correct' => false, 'count' => 0, 'share' => 0.0, 'unused' => true],
        ['option' => 3, 'label' => '32', 'correct' => true, 'count' => 17, 'share' => 0.85, 'unused' => false],
        ['option' => 4, 'label' => '64', 'correct' => false, 'count' => 0, 'share' => 0.0, 'unused' => true],
    ]);
});

it('counts every ticked option of a multiple choice answer', function () {
    $options = ItemAnalysis::distractors([[1, 2], [1], [2, 3]], [1 => 'a', 2 => 'b', 3 => 'c'], [1, 2]);

    expect(array_column($options, 'count'))->toBe([2, 2, 1])
        ->and(array_column($options, 'unused'))->toBe([false, false, false]);
});

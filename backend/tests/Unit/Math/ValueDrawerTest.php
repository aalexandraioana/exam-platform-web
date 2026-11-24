<?php

use App\Enums\QuestionType;
use App\Support\Math\NoValidDraw;
use App\Support\Math\ValueDrawer;

// D-057, D-006: seeded, reproducible draws; whole numbers only (Q-049); conditions; filled statement.

$proportion = [
    'values' => [
        'p' => ['random' => ['min' => 2, 'max' => 5]],
        'q' => ['random' => ['min' => 3, 'max' => 9, 'except' => [6]]],
        'k' => ['fixed' => 4],
        's' => ['calculated' => '(p + q) * k'],
    ],
    'conditions' => ['p < q'],
    'answer' => 'p * k',
];
$statement = 'Numerele a și b sunt direct proporționale cu {p} și {q}, iar a + b = {s}. Numărul a este egal cu …';

it('gives the same values, statement and answer for the same seed', function () use ($proportion, $statement) {
    $one = ValueDrawer::draw(QuestionType::ShortAnswer, $statement, $proportion, 424242);
    $two = ValueDrawer::draw(QuestionType::ShortAnswer, $statement, $proportion, 424242);

    expect($two)->toEqual($one)
        ->and($one->values['s'])->toBe(($one->values['p'] + $one->values['q']) * 4)
        ->and($one->answer)->toBe($one->values['p'] * 4)
        ->and($one->statement)->toBe("Numerele a și b sunt direct proporționale cu {$one->values['p']} și {$one->values['q']}, iar a + b = {$one->values['s']}. Numărul a este egal cu …");
});

it('does not depend on the order the values were written in', function () use ($proportion, $statement) {
    $reordered = $proportion;
    $reordered['values'] = array_reverse($proportion['values'], true);

    expect(ValueDrawer::draw(QuestionType::ShortAnswer, $statement, $reordered, 7)->values)
        ->toEqual(ValueDrawer::draw(QuestionType::ShortAnswer, $statement, $proportion, 7)->values);
});

it('varies between seeds, stays in range, skips excluded values and keeps the conditions', function () use ($proportion, $statement) {
    $seen = [];
    foreach (range(1, 300) as $seed) {
        $v = ValueDrawer::draw(QuestionType::ShortAnswer, $statement, $proportion, $seed)->values;
        expect($v['p'])->toBeGreaterThanOrEqual(2)->toBeLessThanOrEqual(5)
            ->and($v['q'])->toBeGreaterThanOrEqual(3)->toBeLessThanOrEqual(9)->not->toBe(6)
            ->and($v['p'])->toBeLessThan($v['q']);
        $seen[$v['p'].'-'.$v['q']] = true;
    }
    expect(count($seen))->toBeGreaterThan(10);
});

it('draws again until calculated values and the answer are whole (Q-049)', function () {
    $params = [
        'values' => ['a' => ['random' => ['min' => 1, 'max' => 20]], 'h' => ['calculated' => 'a : 2']],
        'answer' => 'h : 2',
    ];
    foreach (range(1, 100) as $seed) {
        $draw = ValueDrawer::draw(QuestionType::ShortAnswer, 'Jumătate din {a} este {h}.', $params, $seed);
        expect($draw->values['a'] % 4)->toBe(0)->and($draw->answer)->toBe(intdiv($draw->values['a'], 4));
    }
});

it('treats a division by zero as a bad draw and tries again', function () {
    $params = ['values' => ['a' => ['random' => ['min' => 0, 'max' => 3]], 'b' => ['calculated' => '12 : a']], 'answer' => 'b'];
    foreach (range(1, 50) as $seed) {
        expect(ValueDrawer::draw(QuestionType::ShortAnswer, '12 : {a}', $params, $seed)->values['a'])->not->toBe(0);
    }
});

it('reports a question whose values can never satisfy it', function () {
    $params = [
        'values' => ['p' => ['random' => ['min' => 5, 'max' => 9]], 'q' => ['random' => ['min' => 1, 'max' => 3]]],
        'conditions' => ['p ≤ q'],
        'answer' => 'p',
    ];
    ValueDrawer::draw(QuestionType::ShortAnswer, '{p}', $params, 1);
})->throws(NoValidDraw::class);

it('fills choice options and draws again when two options read the same (Q-050)', function () {
    $params = ['values' => [
        'a' => ['random' => ['min' => 1, 'max' => 3]],
        'b' => ['random' => ['min' => 1, 'max' => 3]],
        'c' => ['calculated' => 'a + b'],
    ]];
    foreach (range(1, 100) as $seed) {
        $draw = ValueDrawer::draw(QuestionType::SingleChoice, 'Cât face {a} + {b}?', $params, $seed, ['{a}', '{b}', '{c}']);
        expect(array_unique($draw->options))->toHaveCount(3)
            ->and($draw->options[2])->toBe((string) ($draw->values['a'] + $draw->values['b']))
            ->and($draw->answer)->toBeNull();
    }
});

it('fills a Subject II statement without an answer', function () {
    $params = ['values' => ['l' => ['random' => ['min' => 3, 'max' => 9]], 'L' => ['calculated' => 'l + 2']]];
    $draw = ValueDrawer::draw(QuestionType::StructuredProblem, 'Un dreptunghi are lățimea {l} cm și lungimea {L} cm.', $params, 11);

    expect($draw->statement)->toBe("Un dreptunghi are lățimea {$draw->values['l']} cm și lungimea {$draw->values['L']} cm.")
        ->and($draw->answer)->toBeNull();
});

it('writes negatives plainly and leaves other braces alone', function () {
    $params = ['values' => ['n' => ['fixed' => -3]], 'answer' => 'n'];
    $draw = ValueDrawer::draw(QuestionType::ShortAnswer, 'Mulțimea A = {1, 2, 3}; n = {n}; {x} rămâne.', $params, 1);

    expect($draw->statement)->toBe('Mulțimea A = {1, 2, 3}; n = -3; {x} rămâne.');
});

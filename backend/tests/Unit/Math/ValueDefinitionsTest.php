<?php

use App\Enums\QuestionType;
use App\Support\Math\ValueDefinitions;

// D-057, D-059: every {name} defined; ranges, exclusions, formulas and conditions checked; codes (PATTERN-005).

function params(array $values, array $conditions = [], ?string $answer = 'p'): array
{
    return array_filter(['values' => $values, 'conditions' => $conditions, 'answer' => $answer], fn ($v) => $v !== null);
}

function codes(array $problems): array
{
    return array_map(fn ($p) => $p['code'].(isset($p['name']) ? ':'.$p['name'] : ''), $problems);
}

$good = [
    'p' => ['random' => ['min' => 2, 'max' => 5]],
    'q' => ['random' => ['min' => 3, 'max' => 9, 'except' => [6]]],
    'k' => ['fixed' => 4],
    's' => ['calculated' => '(p + q) * k'],
];

it('accepts a complete definition', function () use ($good) {
    $statement = 'Numerele a și b sunt direct proporționale cu {p} și {q}, iar a + b = {s}.';
    expect(ValueDefinitions::problems(QuestionType::ShortAnswer, $statement, params($good, ['p < q'], 'p * k')))->toBe([]);
});

it('finds a name in the statement or the options that has no value', function () use ($good) {
    $problems = ValueDefinitions::problems(QuestionType::SingleChoice, 'Cât face {p} + {r}?', params($good, [], null), ['{s}', '{t}']);
    expect(codes($problems))->toBe(['undefined_value:r', 'undefined_value:t']);
});

it('checks each value', function (array $definition, string $code) {
    $problems = ValueDefinitions::problems(QuestionType::ShortAnswer, '{p}', params(['p' => $definition]));
    expect(codes($problems))->toBe([$code.':p']);
})->with([
    'no kind' => [[], 'invalid_value'],
    'two kinds' => [['fixed' => 1, 'random' => ['min' => 1, 'max' => 2]], 'invalid_value'],
    'decimal fixed' => [['fixed' => 2.5], 'invalid_value'],
    'decimal bound' => [['random' => ['min' => 1.5, 'max' => 3]], 'invalid_range'],
    'min above max' => [['random' => ['min' => 9, 'max' => 3]], 'invalid_range'],
    'all excluded' => [['random' => ['min' => 1, 'max' => 2, 'except' => [1, 2]]], 'all_excluded'],
    'bad formula' => [['calculated' => 'p ^ 2'], 'invalid_formula'],
]);

it('finds unknown names and loops in calculated values', function () {
    $values = [
        'a' => ['calculated' => 'b + 1'],
        'b' => ['calculated' => 'a - 1'],
        'c' => ['calculated' => 'z * 2'],
    ];
    expect(codes(ValueDefinitions::problems(QuestionType::ShortAnswer, '{a}', params($values, [], 'a'))))
        ->toBe(['unknown_name:c', 'cycle:a', 'cycle:b']);
});

it('checks conditions and the answer formula', function () use ($good) {
    $problems = ValueDefinitions::problems(QuestionType::ShortAnswer, '{p}', params($good, ['p < q', 'p', 'p < r', 'p << q'], 'p ^ 2'));
    expect(codes($problems))->toBe(['invalid_condition', 'unknown_name', 'invalid_condition', 'invalid_formula']);
});

it('needs an answer formula for a short answer, and refuses values on true/false', function () use ($good) {
    expect(codes(ValueDefinitions::problems(QuestionType::ShortAnswer, '{p}', params($good, [], null))))->toBe(['answer_required']);
    expect(codes(ValueDefinitions::problems(QuestionType::DualChoice, '{p} este par.', params($good, [], null))))->toBe(['values_not_allowed']);
});

it('lets a Subject II statement and choice options use values without an answer formula (Q-050)', function () use ($good) {
    expect(ValueDefinitions::problems(QuestionType::StructuredProblem, 'Un dreptunghi are laturile {p} cm și {q} cm.', params($good, [], null)))->toBe([]);
    expect(ValueDefinitions::problems(QuestionType::MultipleChoice, 'Care sunt mai mari decât {p}?', params($good, [], null), ['{q}', '{s}', '{k}']))->toBe([]);
});

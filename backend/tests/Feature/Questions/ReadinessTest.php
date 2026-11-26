<?php

use App\Models\Question;
use App\Support\Questions\Readiness;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// D-059: what a question still needs before it can be Ready, as codes (PATTERN-005).

/** Problem codes of a complete question changed by $attributes, as "code" or "code:field|name". */
function readinessOf(array $attributes, string $state = 'subjectOne'): array
{
    $factory = Question::factory()->ready();
    if ($state === 'subjectTwo') {
        $factory = $factory->subjectTwo();
    }
    $question = $factory->create(array_merge(['answer_key' => ['kind' => 'number', 'value' => '42']], $attributes));

    return array_map(
        fn ($p) => $p['code'].(isset($p['field']) ? ':'.$p['field'] : '').(isset($p['name']) ? ':'.$p['name'] : ''),
        Readiness::problems($question->fresh()),
    );
}

it('finds nothing missing in a complete question', function () {
    expect(readinessOf([]))->toBe([]);
});

it('needs 20 points for a Subject II question (D-062)', function () {
    expect(readinessOf(['points' => 10, 'status' => 'draft'], 'subjectTwo'))->toBe(['subject_two_points:points'])
        ->and(readinessOf(['points' => 20], 'subjectTwo'))->toBe([])
        ->and(readinessOf(['points' => null, 'status' => 'draft'], 'subjectTwo'))->toBe(['required:points']);
});

it('lists each missing field', function () {
    expect(readinessOf(['statement' => null, 'points' => null, 'competence_id' => null, 'topic_id' => null, 'grade_level' => null, 'difficulty' => null, 'status' => 'draft']))
        ->toBe(['required:statement', 'required:points', 'required:grade_level', 'required:difficulty', 'required:competence', 'required:topic']);
});

it('checks the answer key of each type', function (string $type, ?array $key, string $code) {
    expect(readinessOf(['type' => $type, 'answer_key' => $key, 'status' => 'draft']))->toBe([$code.':answer_key']);
})->with([
    'true/false without answer' => ['dual_choice', null, 'required'],
    'true/false not a boolean' => ['dual_choice', ['correct' => 'da'], 'invalid_answer_key'],
    'one option' => ['single_choice', ['options' => ['12'], 'correct' => 1], 'too_few_options'],
    'empty option' => ['single_choice', ['options' => ['12', ' '], 'correct' => 1], 'empty_option'],
    'same option twice' => ['single_choice', ['options' => ['12', '12 '], 'correct' => 1], 'duplicate_options'],
    'correct out of range' => ['single_choice', ['options' => ['12', '36'], 'correct' => 3], 'invalid_answer_key'],
    'multiple without correct' => ['multiple_choice', ['options' => ['12', '14'], 'correct' => []], 'invalid_answer_key'],
    'multiple out of range' => ['multiple_choice', ['options' => ['12', '14'], 'correct' => [1, 5]], 'invalid_answer_key'],
    'text without accepted' => ['short_answer', ['kind' => 'text', 'accepted' => []], 'invalid_answer_key'],
    'bad number' => ['short_answer', ['kind' => 'number', 'value' => '2,5,1'], 'invalid_answer_key'],
    'bad fraction' => ['short_answer', ['kind' => 'fraction', 'value' => '3/0'], 'invalid_answer_key'],
    'no kind' => ['short_answer', ['value' => '2'], 'invalid_answer_key'],
]);

it('accepts every valid answer key', function (string $type, array $key) {
    expect(readinessOf(['type' => $type, 'answer_key' => $key]))->toBe([]);
})->with([
    ['dual_choice', ['correct' => false]],
    ['single_choice', ['options' => ['12', '36', '32'], 'correct' => 2]],
    ['multiple_choice', ['options' => ['12', '14', '21'], 'correct' => [1, 3]]],
    ['short_answer', ['kind' => 'text', 'accepted' => ['se înjumătățește']]],
    ['short_answer', ['kind' => 'number', 'value' => '-2,5']],
    ['short_answer', ['kind' => 'fraction', 'value' => '3/4']],
]);

it('needs a barem that adds up to the points when one is used (D-031)', function () {
    $question = Question::factory()->subjectTwo()->ready()->withBarem()->create(['points' => 20]);
    $question->baremSteps()->create(['position' => 1, 'description' => 'Pasul 1', 'points' => 14]);

    expect(array_column(Readiness::problems($question->fresh()), 'code'))->toBe(['barem_incomplete']);

    $question->baremSteps()->create(['position' => 2, 'description' => 'Pasul 2', 'points' => 6]);
    expect(Readiness::problems($question->fresh()))->toBe([]);
    expect(readinessOf(['uses_barem' => false], 'subjectTwo'))->toBe([]);
});

it('checks named values with P4a and makes one test draw (D-057, D-059)', function () {
    $values = ['p' => ['random' => ['min' => 2, 'max' => 5]], 'q' => ['random' => ['min' => 1, 'max' => 2]]];

    expect(readinessOf(['statement' => 'Cât face {p} + {r}?', 'answer_key' => ['kind' => 'number'], 'parameters' => ['values' => $values, 'answer' => 'p + q'], 'status' => 'draft']))
        ->toBe(['undefined_value:parameters:r']);
    expect(readinessOf(['statement' => '{p} și {q}', 'answer_key' => ['kind' => 'number'], 'parameters' => ['values' => $values, 'conditions' => ['p < q'], 'answer' => 'p'], 'status' => 'draft']))
        ->toBe(['no_valid_draw:parameters']);
    expect(readinessOf(['statement' => '{p} și {q}', 'answer_key' => ['kind' => 'number'], 'parameters' => ['values' => $values, 'answer' => 'p + q']]))
        ->toBe([]);
});

it('refuses a fraction answer with values (Q-051)', function () {
    $values = ['p' => ['random' => ['min' => 2, 'max' => 5]]];
    expect(readinessOf(['statement' => '{p}', 'answer_key' => ['kind' => 'fraction', 'value' => '3/4'], 'parameters' => ['values' => $values, 'answer' => 'p'], 'status' => 'draft']))
        ->toBe(['fraction_with_values:answer_key']);
});

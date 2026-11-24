<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// C-004 · sample values and "Testează un răspuns" on the unsaved editor content (P4a engine).

beforeEach(function () {
    $this->withToken(User::factory()->examiner()->create()->createToken('spa')->plainTextToken);
});

it('previews three sample draws of the unsaved values', function () {
    $response = $this->postJson('/api/questions/preview', [
        'type' => 'short_answer',
        'statement' => 'Numerele a și b sunt direct proporționale cu {p} și {q}, iar a + b = {s}.',
        'parameters' => [
            'values' => [
                'p' => ['random' => ['min' => 2, 'max' => 5]],
                'q' => ['random' => ['min' => 3, 'max' => 9, 'except' => [6]]],
                'k' => ['fixed' => 4],
                's' => ['calculated' => '(p + q) · k'],
            ],
            'conditions' => ['p < q'],
            'answer' => 'p · k',
        ],
    ])->assertOk()->assertJsonPath('problems', [])->assertJsonCount(3, 'samples');

    foreach ($response->json('samples') as $sample) {
        $v = $sample['values'];
        expect($v['s'])->toBe(($v['p'] + $v['q']) * 4)
            ->and($sample['answer'])->toBe($v['p'] * 4)
            ->and($sample['statement'])->toContain("cu {$v['p']} și {$v['q']}");
    }
});

it('reports problems instead of samples', function () {
    $this->postJson('/api/questions/preview', [
        'type' => 'single_choice',
        'statement' => 'Cât face {a} + {b}?',
        'options' => ['{s}', '{t}'],
        'parameters' => ['values' => ['a' => ['fixed' => 2], 'b' => ['fixed' => 3], 's' => ['calculated' => 'a + b']]],
    ])->assertOk()
        ->assertJsonPath('problems', [['code' => 'undefined_value', 'name' => 't']])
        ->assertJsonPath('samples', []);

    $this->postJson('/api/questions/preview', [
        'type' => 'short_answer', 'statement' => '{p}',
        'parameters' => ['values' => ['p' => ['random' => ['min' => 1, 'max' => 2]]], 'conditions' => ['p > 5'], 'answer' => 'p'],
    ])->assertOk()->assertJsonPath('problems', [['code' => 'no_valid_draw']]);

    $this->postJson('/api/questions/preview', ['type' => 'nonsense', 'statement' => 'x'])
        ->assertUnprocessable()->assertJsonPath('errors.type.0', 'invalid');
});

it('tests a typed answer against the unsaved answer key', function (array $body, bool $accepted) {
    $this->postJson('/api/questions/check-answer', $body)->assertOk()->assertJsonPath('accepted', $accepted);
})->with([
    'text, no diacritics' => [['type' => 'short_answer', 'answer_key' => ['kind' => 'text', 'accepted' => ['se înjumătățesc']], 'given' => 'Se injumatatesc '], true],
    'text, wrong' => [['type' => 'short_answer', 'answer_key' => ['kind' => 'text', 'accepted' => ['se înjumătățesc']], 'given' => 'se dublează'], false],
    'number' => [['type' => 'short_answer', 'answer_key' => ['kind' => 'number', 'value' => '2,5'], 'given' => '2.5'], true],
    'fraction form' => [['type' => 'short_answer', 'answer_key' => ['kind' => 'fraction', 'value' => '3/4'], 'given' => '6/8'], false],
    'drawn answer' => [['type' => 'short_answer', 'answer_key' => ['kind' => 'number'], 'expected' => 12, 'given' => '12'], true],
    'choice' => [['type' => 'multiple_choice', 'answer_key' => ['options' => ['1', '2', '3'], 'correct' => [1, 3]], 'given' => [3, 1]], true],
]);

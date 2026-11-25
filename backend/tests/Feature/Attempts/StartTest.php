<?php

use App\Models\Attempt;
use App\Models\AttemptItem;
use App\Models\User;
use App\Support\Attempts\Starter;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// C-006 · starting an Attempt: a distinct question per Item, values drawn, options shuffled, all
// stored and rebuilt from the seed (D-057, D-006, D-045, D-021; the twist's reproducibility).

it('starts an Attempt with the full duration, whatever the window\'s end (D-021)', function () {
    $this->freezeTime();
    $s = attemptSetup(['available_until' => now()->addMinutes(10)]);
    signInAs($s['candidate']);

    $id = $this->postJson("/api/candidate/exams/{$s['exam']->id}/attempts")->assertCreated()
        ->assertJsonPath('attempt.status', 'started')
        ->assertJsonPath('attempt.attempt_number', 1)
        ->assertJsonPath('attempt.expires_at', now()->addMinutes(50)->toIso8601String())
        ->assertJsonCount(3, 'attempt.items')
        ->json('attempt.id');

    $attempt = Attempt::findOrFail($id);
    expect($attempt->seed)->toBeInt()
        ->and($attempt->items()->pluck('position')->all())->toBe([1, 2, 3])
        ->and($attempt->items()->pluck('question_id')->unique())->toHaveCount(3);
});

it('fills named values and stores them with the drawn answer (D-006)', function () {
    $s = attemptSetup();
    signInAs($s['candidate']);
    $id = $this->postJson("/api/candidate/exams/{$s['exam']->id}/attempts")->json('attempt.id');

    $item = AttemptItem::where('attempt_id', $id)->where('question_id', $s['questions']['values']->id)->sole();
    $a = $item->drawn_values['a'];
    expect($a)->toBeGreaterThanOrEqual(1)->toBeLessThanOrEqual(9)
        ->and($item->question_snapshot['statement'])->toBe("Cât face {$a} + 10?")
        ->and($item->expected_answer['answer'])->toBe($a + 10);
});

it('shuffles the options, stores their order and keeps the key in original positions (D-045)', function () {
    $s = attemptSetup();
    signInAs($s['candidate']);
    $id = $this->postJson("/api/candidate/exams/{$s['exam']->id}/attempts")->json('attempt.id');

    $item = AttemptItem::where('attempt_id', $id)->where('question_id', $s['questions']['single']->id)->sole();
    $order = $item->expected_answer['option_order'];
    expect($order)->toEqualCanonicalizing([1, 2, 3, 4])
        ->and($item->question_snapshot['options'])->toBe(array_map(fn ($p) => ['12', '36', '32', '64'][$p - 1], $order))
        ->and($item->expected_answer['answer_key'])->toEqual(['options' => ['12', '36', '32', '64'], 'correct' => 2]); // jsonb keeps its own key order

    $orders = collect(range(1, 40))->map(fn ($seed) => implode(',', collect(Starter::snapshot($s['exam']->fresh(), $seed))
        ->firstWhere('question_id', $s['questions']['single']->id)['expected_answer']['option_order']))->unique();
    expect($orders->count())->toBeGreaterThan(5);
});

it('rebuilds exactly the stored snapshot from the seed, as a contest needs', function () {
    $s = attemptSetup();
    signInAs($s['candidate']);
    $attempt = Attempt::findOrFail($this->postJson("/api/candidate/exams/{$s['exam']->id}/attempts")->json('attempt.id'));

    $rebuilt = Starter::snapshot($s['exam']->fresh(), $attempt->seed);
    $stored = $attempt->items()->get()->map(fn ($i) => [
        'exam_item_id' => $i->exam_item_id, 'question_id' => $i->question_id, 'position' => $i->position,
        'question_snapshot' => $i->question_snapshot, 'drawn_values' => $i->drawn_values, 'expected_answer' => $i->expected_answer,
    ])->all();

    expect($rebuilt)->toEqual($stored);
});

it('refuses to start outside the window, without attempts left, or while one is open', function () {
    $s = attemptSetup();
    signInAs($s['candidate']);
    $open = Attempt::factory()->create(['exam_id' => $s['exam']->id, 'candidate_id' => $s['candidate']->id]);

    $this->postJson("/api/candidate/exams/{$s['exam']->id}/attempts")->assertConflict()
        ->assertJsonPath('code', 'attempt_open')->assertJsonPath('attempt_id', $open->id);

    $open->status = 'submitted';
    $open->submitted_at = now();
    $open->save();
    $this->postJson("/api/candidate/exams/{$s['exam']->id}/attempts")->assertConflict()->assertJsonPath('code', 'no_attempts_left');

    foreach ([['available_from' => now()->addHour()], ['available_until' => now()->subMinute(), 'available_from' => now()->subHours(2)]] as $window) {
        $other = attemptSetup($window);
        signInAs($other['candidate']);
        $this->postJson("/api/candidate/exams/{$other['exam']->id}/attempts")->assertConflict()->assertJsonPath('code', 'not_available');
    }
});

it('hides exams of other classes and is for Candidates only', function () {
    $s = attemptSetup();
    signInAs(User::factory()->candidate()->create());
    $this->postJson("/api/candidate/exams/{$s['exam']->id}/attempts")->assertNotFound();

    signInAs($s['examiner']);
    $this->postJson("/api/candidate/exams/{$s['exam']->id}/attempts")->assertForbidden();
});

it('starts a second Attempt after the first is submitted, when allowed (D-012)', function () {
    $s = attemptSetup(['max_attempts' => 2]);
    Attempt::factory()->submitted()->create(['exam_id' => $s['exam']->id, 'candidate_id' => $s['candidate']->id]);
    signInAs($s['candidate']);

    $this->postJson("/api/candidate/exams/{$s['exam']->id}/attempts")->assertCreated()->assertJsonPath('attempt.attempt_number', 2);
});

// The mapping P6c grades with: shown position k is original position option_order[k-1]. Checked by
// option text, over many seeds, for every way a key can depend on the order.

/** The shown positions of the original positions in $original, through $order. */
function shownPositionsOf(array $order, array $original): array
{
    $shown = array_map(fn (int $p) => array_search($p, $order, true) + 1, $original);
    sort($shown);

    return $shown;
}

it('maps the single choice key to the option the Candidate sees, for every seed', function () {
    $s = attemptSetup();
    $single = $s['questions']['single'];

    foreach (range(1, 60) as $seed) {
        $row = collect(Starter::snapshot($s['exam']->fresh(), $seed))->firstWhere('question_id', $single->id);
        $order = $row['expected_answer']['option_order'];
        $key = $row['expected_answer']['answer_key'];
        [$shownCorrect] = shownPositionsOf($order, [$key['correct']]);

        expect($row['question_snapshot']['options'][$shownCorrect - 1])->toBe('36'); // the correct text
        foreach ($row['question_snapshot']['options'] as $k => $text) {
            expect($text)->toBe($key['options'][$order[$k] - 1]);
        }
    }
});

it('maps every correct option of a multiple choice question, for every seed', function () {
    $s = attemptSetup();
    $multiple = poolQuestion($s['examiner'], $s['exam']->items()->first()->pool, [
        'type' => 'multiple_choice', 'competence_id' => $s['exam']->items()->first()->competence_id,
        'topic_id' => $s['questions']['single']->topic_id, 'statement' => 'Care numere sunt divizibile cu 3?',
        'answer_key' => ['options' => ['12', '14', '21', '25', '30'], 'correct' => [1, 3, 5]],
    ]);
    $s['exam']->items()->where('position', 1)->update(['type' => 'multiple_choice']);

    foreach (range(1, 60) as $seed) {
        $row = collect(Starter::snapshot($s['exam']->fresh(), $seed))->firstWhere('question_id', $multiple->id);
        $order = $row['expected_answer']['option_order'];
        $shown = shownPositionsOf($order, $row['expected_answer']['answer_key']['correct']);
        $texts = array_map(fn ($k) => $row['question_snapshot']['options'][$k - 1], $shown);
        sort($texts);

        expect($texts)->toBe(['12', '21', '30']);
    }
});

it('fills options from values before shuffling, so the key still points at the right text', function () {
    $s = attemptSetup();
    $withValues = poolQuestion($s['examiner'], $s['exam']->items()->first()->pool, [
        'type' => 'single_choice', 'competence_id' => $s['exam']->items()->first()->competence_id,
        'topic_id' => $s['questions']['single']->topic_id, 'statement' => 'Cât face {a} + {b}?',
        'answer_key' => ['options' => ['{s}', '{d}', '{m}'], 'correct' => 1],
        'parameters' => ['values' => [
            'a' => ['random' => ['min' => 2, 'max' => 9]], 'b' => ['random' => ['min' => 1, 'max' => 9]],
            's' => ['calculated' => 'a + b'], 'd' => ['calculated' => 'a - b'], 'm' => ['calculated' => 'a · b'],
        ]],
    ]);
    $s['questions']['single']->forceFill(['status' => 'draft'])->save(); // leaves only this one for Item 1 (status isn't fillable)

    foreach (range(1, 60) as $seed) {
        $row = collect(Starter::snapshot($s['exam']->fresh(), $seed))->firstWhere('question_id', $withValues->id);
        $v = $row['drawn_values'];
        [$shownCorrect] = shownPositionsOf($row['expected_answer']['option_order'], [1]);

        expect($row['question_snapshot']['statement'])->toBe("Cât face {$v['a']} + {$v['b']}?")
            ->and($row['question_snapshot']['options'][$shownCorrect - 1])->toBe((string) ($v['a'] + $v['b']))
            ->and($row['question_snapshot']['options'])->toEqualCanonicalizing([(string) $v['s'], (string) $v['d'], (string) $v['m']]);
    }
});

it('computes the drawn answer from the drawn values, independent of any order, and leaves true/false as is', function () {
    $s = attemptSetup();

    foreach (range(1, 30) as $seed) {
        $rows = collect(Starter::snapshot($s['exam']->fresh(), $seed));
        $values = $rows->firstWhere('question_id', $s['questions']['values']->id);
        $dual = $rows->firstWhere('question_id', $s['questions']['dual']->id);

        expect($values['expected_answer']['answer'])->toBe($values['drawn_values']['a'] + 10)
            ->and($values['expected_answer']['option_order'])->toBeNull()
            ->and($dual['expected_answer'])->toEqual(['answer_key' => ['correct' => true], 'option_order' => null, 'answer' => null])
            ->and($dual['question_snapshot']['options'])->toBe([]);
    }
});

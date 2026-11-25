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

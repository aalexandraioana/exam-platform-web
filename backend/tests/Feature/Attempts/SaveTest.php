<?php

use App\Models\Attempt;
use App\Models\AttemptItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// C-006 · autosave: one version per answer, idempotent, out-of-order safe, refused after the
// deadline + Grace Period (D-004, D-021; the twist's server timer). Items of attemptSetup():
// 1 single choice (4 options), 2 short answer, 3 true/false.

function save(int $id, int $position, array $body)
{
    return test()->putJson("/api/attempts/{$id}/items/{$position}/answer", $body);
}

it('stores the first answer and moves the Attempt to in_progress (Q-068)', function () {
    $this->freezeTime();
    $id = startAttempt($s = attemptSetup());

    save($id, 2, ['answer' => '17', 'version' => 1])->assertOk()
        ->assertJsonPath('applied', true)
        ->assertJsonPath('status', 'in_progress')
        ->assertJsonPath('answer.value', '17')
        ->assertJsonPath('answer.version', 1)
        ->assertJsonPath('answer.marked_for_review', false)
        ->assertJsonPath('answer.saved_at', now()->toIso8601String());

    expect(Attempt::find($id)->status->value)->toBe('in_progress');
});

it('keeps the highest version: repeated and late saves change nothing', function () {
    $id = startAttempt(attemptSetup());

    save($id, 2, ['answer' => '3', 'version' => 3])->assertOk()->assertJsonPath('applied', true);
    save($id, 2, ['answer' => '3', 'version' => 3])->assertOk()->assertJsonPath('applied', false); // repeated
    save($id, 2, ['answer' => '2', 'version' => 2])->assertOk()->assertJsonPath('applied', false) // arrived late
        ->assertJsonPath('answer.value', '3')->assertJsonPath('answer.version', 3);
    save($id, 2, ['answer' => '4', 'version' => 4])->assertOk()->assertJsonPath('applied', true)->assertJsonPath('answer.value', '4');
});

it('checks the answer\'s shape for its type', function (int $position, mixed $answer, bool $valid) {
    $id = startAttempt(attemptSetup());

    $response = save($id, $position, ['answer' => $answer, 'version' => 1]);
    $valid ? $response->assertOk() : $response->assertUnprocessable()->assertJsonPath('code', 'invalid_answer');
})->with([
    'single: a shown position' => [1, 3, true],
    'single: out of range' => [1, 5, false],
    'single: zero' => [1, 0, false],
    'single: text' => [1, '3', false],
    'short: text' => [2, '2,5', true],
    'short: too long' => [2, str_repeat('1', 201), false],
    'short: a number' => [2, 17, false],
    'dual: boolean' => [3, false, true],
    'dual: text' => [3, 'true', false],
    'null clears any type' => [1, null, true],
]);

it('accepts distinct shown positions for multiple choice and step-by-step text for a Subject II problem', function () {
    $id = startAttempt(attemptSetup());
    $item = AttemptItem::where('attempt_id', $id)->where('position', 1)->sole();
    $item->question_snapshot = [...$item->question_snapshot, 'type' => 'multiple_choice'];
    $item->save();

    save($id, 1, ['answer' => [1, 3], 'version' => 1])->assertOk();
    save($id, 1, ['answer' => [1, 1], 'version' => 2])->assertUnprocessable();
    save($id, 1, ['answer' => [1, 9], 'version' => 3])->assertUnprocessable();

    $item->question_snapshot = [...$item->question_snapshot, 'type' => 'structured_problem', 'options' => []];
    $item->save();
    save($id, 1, ['answer' => "Pasul 1: …\nPasul 2: …", 'version' => 4])->assertOk();
    save($id, 1, ['answer' => str_repeat('a', 10001), 'version' => 5])->assertUnprocessable();
});

it('validates the request and saves the review mark', function () {
    $id = startAttempt(attemptSetup());

    save($id, 2, ['answer' => '1'])->assertUnprocessable()->assertJsonValidationErrors('version');
    save($id, 2, ['answer' => '1', 'version' => 0])->assertUnprocessable()->assertJsonValidationErrors('version');
    save($id, 2, ['answer' => '1', 'version' => 1, 'marked_for_review' => true])->assertOk()
        ->assertJsonPath('answer.marked_for_review', true);
});

it('accepts answers through the Grace Period and refuses them after it (D-004)', function () {
    $this->freezeTime();
    $id = startAttempt(attemptSetup());
    $deadline = Attempt::find($id)->expires_at;

    $this->travelTo($deadline->copy()->addSeconds(29));
    save($id, 2, ['answer' => '1', 'version' => 1])->assertOk();

    $this->travelTo($deadline->copy()->addSeconds(31));
    save($id, 2, ['answer' => '2', 'version' => 2])->assertConflict()->assertJsonPath('code', 'time_up');

    $attempt = Attempt::find($id);
    expect($attempt->status->value)->toBe('submitted')
        ->and($attempt->auto_submitted)->toBeTrue()
        ->and($attempt->submitted_at->equalTo($deadline))->toBeTrue()
        ->and($attempt->items()->where('position', 2)->sole()->answer->answer)->toBe(['value' => '1']);
});

it('takes the Grace Period from configuration', function () {
    config(['attempts.grace_seconds' => 5]);
    $this->freezeTime();
    $id = startAttempt(attemptSetup());

    $this->travelTo(Attempt::find($id)->expires_at->copy()->addSeconds(6));
    save($id, 2, ['answer' => '1', 'version' => 1])->assertConflict()->assertJsonPath('code', 'time_up');
});

it('refuses answers after submitting, to other Candidates and to unknown positions', function () {
    $id = startAttempt($s = attemptSetup());

    save($id, 9, ['answer' => '1', 'version' => 1])->assertNotFound();
    $this->postJson("/api/attempts/{$id}/submit")->assertOk();
    save($id, 2, ['answer' => '1', 'version' => 1])->assertConflict()->assertJsonPath('code', 'attempt_submitted');

    signInAs(User::factory()->candidate()->create());
    save($id, 2, ['answer' => '1', 'version' => 9])->assertNotFound();
});

it('loses nothing on a refresh: the read returns every saved answer', function () {
    $id = startAttempt(attemptSetup());
    save($id, 1, ['answer' => 2, 'version' => 1, 'marked_for_review' => true]);
    save($id, 3, ['answer' => true, 'version' => 4]);

    $this->getJson("/api/attempts/{$id}")->assertOk()
        ->assertJsonPath('attempt.status', 'in_progress')
        ->assertJsonPath('attempt.items.0.answer.value', 2)
        ->assertJsonPath('attempt.items.0.answer.marked_for_review', true)
        ->assertJsonPath('attempt.items.1.answer', null)
        ->assertJsonPath('attempt.items.2.answer.value', true)
        ->assertJsonPath('attempt.items.2.answer.version', 4);
});

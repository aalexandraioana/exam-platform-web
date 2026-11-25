<?php

use App\Models\Attempt;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// C-006 · submitting: idempotent; after the deadline + Grace Period the Attempt is sealed instead.

it('submits, and submitting again changes nothing', function () {
    $this->freezeTime();
    $id = startAttempt(attemptSetup());

    $this->postJson("/api/attempts/{$id}/submit")->assertOk()
        ->assertJsonPath('attempt.status', 'submitted')
        ->assertJsonPath('attempt.auto_submitted', false)
        ->assertJsonPath('attempt.submitted_at', now()->toIso8601String());

    $this->travel(2)->minutes();
    $this->postJson("/api/attempts/{$id}/submit")->assertOk()
        ->assertJsonPath('attempt.submitted_at', now()->subMinutes(2)->toIso8601String());
});

it('seals a late submit at the deadline, keeping the answers saved in time', function () {
    $this->freezeTime();
    $id = startAttempt(attemptSetup());
    $this->putJson("/api/attempts/{$id}/items/2/answer", ['answer' => '5', 'version' => 1])->assertOk();
    $deadline = Attempt::find($id)->expires_at;

    $this->travelTo($deadline->copy()->addMinutes(3));
    $this->postJson("/api/attempts/{$id}/submit")->assertOk()
        ->assertJsonPath('attempt.status', 'submitted')
        ->assertJsonPath('attempt.auto_submitted', true)
        ->assertJsonPath('attempt.submitted_at', $deadline->toIso8601String())
        ->assertJsonPath('attempt.items.1.answer.value', '5');
});

it('keeps submitting private to the Candidate', function () {
    $id = startAttempt(attemptSetup());
    signInAs(App\Models\User::factory()->candidate()->create());

    $this->postJson("/api/attempts/{$id}/submit")->assertNotFound();
});

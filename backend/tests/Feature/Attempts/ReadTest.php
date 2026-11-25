<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// C-006 · reading an Attempt: what the Candidate sees, never the key or a score (D-019).

it('shows the Candidate their Attempt as drawn, with the server time', function () {
    $this->freezeTime();
    $s = attemptSetup();
    signInAs($s['candidate']);
    $id = $this->postJson("/api/candidate/exams/{$s['exam']->id}/attempts")->json('attempt.id');

    $response = $this->getJson("/api/attempts/{$id}")->assertOk()
        ->assertJsonPath('attempt.exam.title', $s['exam']->title)
        ->assertJsonPath('attempt.server_time', now()->toIso8601String())
        ->assertJsonPath('attempt.items.0.position', 1)
        ->assertJsonPath('attempt.items.0.type', 'single_choice')
        ->assertJsonPath('attempt.items.0.points', 5)
        ->assertJsonCount(4, 'attempt.items.0.options')
        ->assertJsonPath('attempt.items.2.options', []);

    $body = $response->getContent();
    foreach (['answer_key', 'expected_answer', 'option_order', 'drawn_values', 'correct', 'seed', 'score'] as $secret) {
        expect($body)->not->toContain($secret);
    }
});

it('keeps each Attempt private to its Candidate', function () {
    $s = attemptSetup();
    signInAs($s['candidate']);
    $id = $this->postJson("/api/candidate/exams/{$s['exam']->id}/attempts")->json('attempt.id');

    signInAs(User::factory()->candidate()->create());
    $this->getJson("/api/attempts/{$id}")->assertNotFound();
});

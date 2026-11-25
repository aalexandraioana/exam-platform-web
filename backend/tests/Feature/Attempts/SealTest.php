<?php

use App\Models\Attempt;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// D-044 · expired Attempts are sealed on read, by the scheduled command and by the endpoint the
// external cron calls (Q-067). Correctness never depends on the job running on time.

/** An open Attempt whose deadline + grace passed `$minutesAgo` minutes ago (or is still ahead). */
function expiredAttempt(array $s, int $minutesAgo = 5): Attempt
{
    $attempt = Attempt::factory()->create([
        'exam_id' => $s['exam']->id, 'candidate_id' => $s['candidate']->id,
        'started_at' => now()->subMinutes(50 + $minutesAgo + 1), 'expires_at' => now()->subMinutes($minutesAgo + 1),
    ]);

    return $attempt;
}

it('seals an expired Attempt when the Candidate reads it or lists exams, and lets them start again', function () {
    $s = attemptSetup(['max_attempts' => 2]);
    $old = expiredAttempt($s);
    signInAs($s['candidate']);

    $this->getJson('/api/candidate/exams')->assertOk()
        ->assertJsonPath('exams.0.open_attempt_id', null)
        ->assertJsonPath('exams.0.can_start', true);
    $this->getJson("/api/attempts/{$old->id}")->assertOk()
        ->assertJsonPath('attempt.status', 'submitted')
        ->assertJsonPath('attempt.auto_submitted', true)
        ->assertJsonPath('attempt.submitted_at', $old->expires_at->toIso8601String());
    $this->postJson("/api/candidate/exams/{$s['exam']->id}/attempts")->assertCreated()->assertJsonPath('attempt.attempt_number', 2);
});

it('seals within the Grace Period only once it is over', function () {
    $s = attemptSetup();
    $attempt = Attempt::factory()->create([
        'exam_id' => $s['exam']->id, 'candidate_id' => $s['candidate']->id,
        'started_at' => now()->subMinutes(50), 'expires_at' => now()->subSeconds(10),
    ]);
    signInAs($s['candidate']);

    $this->getJson("/api/attempts/{$attempt->id}")->assertJsonPath('attempt.status', 'started');
    $this->travel(21)->seconds();
    $this->getJson("/api/attempts/{$attempt->id}")->assertJsonPath('attempt.status', 'submitted');
});

it('seals every expired open Attempt from the command, and nothing else', function () {
    $this->freezeSecond(); // the database keeps whole seconds
    $s = attemptSetup();
    $other = attemptSetup();
    $expired = [expiredAttempt($s), expiredAttempt($other)];
    $running = Attempt::factory()->create(['exam_id' => $s['exam']->id, 'candidate_id' => $s['candidate']->id, 'attempt_number' => 2]);
    $submitted = Attempt::factory()->submitted()->create(['exam_id' => $other['exam']->id, 'candidate_id' => $other['candidate']->id, 'attempt_number' => 2,
        'expires_at' => now()->subHour(), 'started_at' => now()->subHours(2), 'submitted_at' => now()->subHours(1)->subMinutes(10)]);

    $this->artisan('attempts:seal-expired')->expectsOutputToContain('2')->assertSuccessful();

    foreach ($expired as $a) {
        expect($a->fresh()->status->value)->toBe('submitted')->and($a->fresh()->auto_submitted)->toBeTrue();
    }
    expect($running->fresh()->status->value)->toBe('started')
        ->and($submitted->fresh()->auto_submitted)->toBeFalse()
        ->and($submitted->fresh()->submitted_at->equalTo(now()->subHours(1)->subMinutes(10)))->toBeTrue();
});

it('is scheduled every five minutes', function () {
    $event = collect(app(Schedule::class)->events())
        ->first(fn ($e) => str_contains($e->command, 'attempts:seal-expired'));

    expect($event)->not->toBeNull()->and($event->expression)->toBe('*/5 * * * *');
});

it('seals from the cron endpoint with the right secret only', function () {
    $s = attemptSetup();
    $attempt = expiredAttempt($s);

    config(['attempts.cron_secret' => null]);
    $this->postJson('/api/cron/seal-expired', [], ['X-Cron-Secret' => 'anything'])->assertNotFound();

    config(['attempts.cron_secret' => 'test-only-secret']);
    $this->postJson('/api/cron/seal-expired')->assertForbidden();
    $this->postJson('/api/cron/seal-expired', [], ['X-Cron-Secret' => 'wrong'])->assertForbidden();
    expect($attempt->fresh()->status->value)->toBe('started');

    $this->postJson('/api/cron/seal-expired', [], ['X-Cron-Secret' => 'test-only-secret'])->assertOk()->assertJsonPath('sealed', 1);
    expect($attempt->fresh()->status->value)->toBe('submitted');
});

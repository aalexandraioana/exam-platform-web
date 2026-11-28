<?php

use App\Enums\AttemptStatus;
use App\Models\Attempt;
use App\Models\Exam;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

// C-009 (P11): the Examiner's dashboard (DS-006): active exams, Attempts in progress, submissions
// awaiting grading, and the exams that need attention. Only the Examiner's own exams.

function dashboardExaminer(): User
{
    $examiner = User::factory()->examiner()->create();
    signInAs($examiner);

    return $examiner;
}

function dashboardExam(User $examiner, array $state = []): Exam
{
    return Exam::factory()->published()->for($examiner, 'examiner')->create($state);
}

/** An Attempt started `$minutesAgo` ago with a 50-minute deadline. */
function dashboardAttempt(Exam $exam, AttemptStatus $status, int $minutesAgo = 5): Attempt
{
    $started = now()->subMinutes($minutesAgo);

    return Attempt::factory()->create([
        'exam_id' => $exam->id, 'status' => $status, 'started_at' => $started, 'expires_at' => $started->copy()->addMinutes(50),
        'submitted_at' => in_array($status, [AttemptStatus::Submitted, AttemptStatus::Graded], true) ? now() : null,
    ]);
}

it('counts active exams: published with the window open now', function () {
    $examiner = dashboardExaminer();
    dashboardExam($examiner); // no window: open
    dashboardExam($examiner, ['available_from' => now()->subHour(), 'available_until' => now()->addHour()]);
    dashboardExam($examiner, ['available_from' => now()->addDay()]); // upcoming
    dashboardExam($examiner, ['available_until' => now()->subMinute()]); // closed
    Exam::factory()->for($examiner, 'examiner')->create(); // draft

    $this->getJson('/api/examiner/dashboard')
        ->assertOk()
        ->assertJsonPath('counts.active_exams', 2);
});

it('counts Attempts in progress until the deadline plus the grace period', function () {
    $examiner = dashboardExaminer();
    $exam = dashboardExam($examiner);
    dashboardAttempt($exam, AttemptStatus::Started);
    dashboardAttempt($exam, AttemptStatus::InProgress);
    $grace = (int) config('attempts.grace_seconds');
    // Deadline passed 10 s ago: still inside the grace period, so still in progress (D-004).
    Attempt::factory()->create(['exam_id' => $exam->id, 'status' => AttemptStatus::InProgress, 'started_at' => now()->subMinutes(50), 'expires_at' => now()->subSeconds(min(10, $grace - 1))]);
    // Past the deadline and the grace period, not sealed yet: not in progress (D-044).
    Attempt::factory()->create(['exam_id' => $exam->id, 'status' => AttemptStatus::InProgress, 'started_at' => now()->subMinutes(60), 'expires_at' => now()->subSeconds($grace + 60)]);
    dashboardAttempt($exam, AttemptStatus::Submitted);
    dashboardAttempt($exam, AttemptStatus::Graded);

    $this->getJson('/api/examiner/dashboard')
        ->assertOk()
        ->assertJsonPath('counts.attempts_in_progress', 3);
});

it('counts submissions awaiting grading: submitted, not graded', function () {
    $examiner = dashboardExaminer();
    $first = dashboardExam($examiner);
    $closed = dashboardExam($examiner, ['available_until' => now()->subDay()]);
    dashboardAttempt($first, AttemptStatus::Submitted);
    dashboardAttempt($closed, AttemptStatus::Submitted);
    dashboardAttempt($closed, AttemptStatus::Submitted);
    dashboardAttempt($closed, AttemptStatus::Graded);

    $this->getJson('/api/examiner/dashboard')
        ->assertOk()
        ->assertJsonPath('counts.awaiting_grading', 3);
});

it('lists the exams that need attention: open, or with submissions awaiting grading, open first', function () {
    $examiner = dashboardExaminer();
    $closedWaiting = dashboardExam($examiner, ['title' => 'Închis, de corectat', 'available_until' => now()->subDay()]);
    dashboardAttempt($closedWaiting, AttemptStatus::Submitted);
    dashboardAttempt($closedWaiting, AttemptStatus::Graded);
    $closedDone = dashboardExam($examiner, ['title' => 'Închis, corectat', 'available_until' => now()->subDay()]);
    dashboardAttempt($closedDone, AttemptStatus::Graded);
    $open = dashboardExam($examiner, ['title' => 'Deschis', 'available_until' => now()->addHour()]);
    dashboardAttempt($open, AttemptStatus::InProgress);
    dashboardAttempt($open, AttemptStatus::Submitted);
    dashboardExam($examiner, ['title' => 'Urmează', 'available_from' => now()->addDay()]);
    Exam::factory()->for($examiner, 'examiner')->create(['title' => 'Ciornă']);

    $exams = $this->getJson('/api/examiner/dashboard')->assertOk()->json('exams');

    expect(array_column($exams, 'title'))->toBe(['Deschis', 'Închis, de corectat'])
        ->and($exams[0])->toBe([
            'id' => $open->id, 'title' => 'Deschis', 'state' => 'open',
            'available_until' => $open->available_until->toIso8601String(),
            'in_progress' => 1, 'awaiting_grading' => 1, 'results_published' => false,
        ])
        ->and($exams[1])->toMatchArray(['state' => 'closed', 'in_progress' => 0, 'awaiting_grading' => 1]);
});

it('ignores another Examiner\'s exams and Attempts', function () {
    $other = User::factory()->examiner()->create();
    $theirs = dashboardExam($other);
    dashboardAttempt($theirs, AttemptStatus::InProgress);
    dashboardAttempt($theirs, AttemptStatus::Submitted);
    dashboardExaminer();

    $this->getJson('/api/examiner/dashboard')
        ->assertOk()
        ->assertExactJson(['counts' => ['active_exams' => 0, 'attempts_in_progress' => 0, 'awaiting_grading' => 0], 'exams' => []]);
});

it('is for Examiners only', function (string $role) {
    signInAs(User::factory()->{$role}()->create());

    $this->getJson('/api/examiner/dashboard')->assertForbidden();
})->with(['candidate', 'administrator']);

it('uses the same number of queries however many exams there are', function () {
    $examiner = dashboardExaminer();
    $count = function () {
        DB::flushQueryLog();
        DB::enableQueryLog();
        $this->getJson('/api/examiner/dashboard')->assertOk();

        return count(DB::getQueryLog());
    };
    $exam = dashboardExam($examiner);
    dashboardAttempt($exam, AttemptStatus::Submitted);
    $one = $count();
    foreach (range(1, 4) as $i) {
        dashboardAttempt(dashboardExam($examiner), AttemptStatus::Submitted);
    }

    expect($count())->toBe($one);
});

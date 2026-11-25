<?php

use App\Enums\MembershipStatus;
use App\Models\Attempt;
use App\Models\ClassMembership;
use App\Models\Exam;
use App\Models\SchoolClass;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// C-006 · the Candidate's exams (D-015, D-012, P6a).

it('lists only published exams of the classes where the Candidate is accepted', function () {
    $s = attemptSetup();
    $draft = Exam::factory()->for($s['examiner'], 'examiner')->create();
    $draft->classes()->attach($s['class']);
    Exam::factory()->published()->create(); // another class
    $pendingClass = SchoolClass::factory()->create(['join_code' => 'PEND01']);
    $pending = new ClassMembership;
    $pending->class_id = $pendingClass->id;
    $pending->candidate_id = $s['candidate']->id;
    $pending->status = MembershipStatus::Pending;
    $pending->save();
    Exam::factory()->published()->create()->classes()->attach($pendingClass);
    signInAs($s['candidate']);

    $this->getJson('/api/candidate/exams')->assertOk()
        ->assertJsonCount(1, 'exams')
        ->assertJsonPath('exams.0.id', $s['exam']->id)
        ->assertJsonPath('exams.0.state', 'open')
        ->assertJsonPath('exams.0.duration_minutes', 50)
        ->assertJsonPath('exams.0.max_attempts', 1)
        ->assertJsonPath('exams.0.attempts_used', 0)
        ->assertJsonPath('exams.0.open_attempt_id', null)
        ->assertJsonPath('exams.0.can_start', true)
        ->assertJsonPath('exams.0.results_published', false);
});

it('says whether an exam is upcoming, open or closed', function (array $window, string $state) {
    $s = attemptSetup($window);
    signInAs($s['candidate']);

    $this->getJson('/api/candidate/exams')->assertOk()
        ->assertJsonPath('exams.0.state', $state)
        ->assertJsonPath('exams.0.can_start', $state === 'open');
})->with([
    'upcoming' => [['available_from' => now()->addHour(), 'available_until' => now()->addHours(3)], 'upcoming'],
    'closed' => [['available_from' => now()->subHours(3), 'available_until' => now()->subMinute()], 'closed'],
    'no window' => [['available_from' => null, 'available_until' => null], 'open'],
]);

it('shows the open Attempt and the attempts used', function () {
    $s = attemptSetup(['max_attempts' => 2]);
    $open = Attempt::factory()->create(['exam_id' => $s['exam']->id, 'candidate_id' => $s['candidate']->id]);
    signInAs($s['candidate']);

    $this->getJson('/api/candidate/exams')->assertOk()
        ->assertJsonPath('exams.0.attempts_used', 1)
        ->assertJsonPath('exams.0.open_attempt_id', $open->id)
        ->assertJsonPath('exams.0.can_start', false);
});

it('is for Candidates only', function () {
    $s = attemptSetup();
    signInAs($s['examiner']);

    $this->getJson('/api/candidate/exams')->assertForbidden()->assertJsonPath('code', 'forbidden_role');
});

<?php

use App\Enums\MembershipStatus;
use App\Models\Attempt;
use App\Models\ClassMembership;
use App\Models\Exam;
use App\Models\SchoolClass;
use App\Models\Topic;
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

// P7a · what the dashboard cards need (Q-069, D-019).

it('lists the distinct topics of the exam\'s Items, none for "any"', function () {
    $s = attemptSetup();
    $angles = Topic::factory()->for($s['examiner'], 'examiner')->create(['name' => 'Unghiuri']);
    $ratios = Topic::factory()->for($s['examiner'], 'examiner')->create(['name' => 'Rapoarte']);
    $items = $s['exam']->items()->get();
    $items[0]->forceFill(['topic_id' => $ratios->id])->save();
    $items[1]->forceFill(['topic_id' => $angles->id])->save();
    $items[2]->forceFill(['topic_id' => $ratios->id])->save();
    signInAs($s['candidate']);

    $topics = $this->getJson('/api/candidate/exams')->assertOk()->json('exams.0.topics');
    expect($topics)->toEqualCanonicalizing(['Rapoarte', 'Unghiuri']);

    $other = attemptSetup(); // all Items "any"
    signInAs($other['candidate']);
    $this->getJson('/api/candidate/exams')->assertJsonPath('exams.0.topics', []);
});

it('counts the Items per Subject and gives the server time', function () {
    $this->freezeSecond();
    $s = attemptSetup();
    $s['exam']->items()->where('position', 3)->update(['section' => 'subject_2']);
    signInAs($s['candidate']);

    $this->getJson('/api/candidate/exams')->assertOk()
        ->assertJsonPath('server_time', now()->toIso8601String())
        ->assertJsonPath('exams.0.item_counts', ['subject_1' => 2, 'subject_2' => 1]);
});

it('gives the open Attempt\'s times and says when an Attempt was submitted', function () {
    $this->freezeSecond();
    $s = attemptSetup(['max_attempts' => 2]);
    signInAs($s['candidate']);
    $this->getJson('/api/candidate/exams')->assertJsonPath('exams.0.open_attempt', null)->assertJsonPath('exams.0.submitted', false);

    $id = $this->postJson("/api/candidate/exams/{$s['exam']->id}/attempts")->json('attempt.id');
    $this->getJson('/api/candidate/exams')
        ->assertJsonPath('exams.0.open_attempt.id', $id)
        ->assertJsonPath('exams.0.open_attempt.started_at', now()->toIso8601String())
        ->assertJsonPath('exams.0.open_attempt.expires_at', now()->addMinutes(50)->toIso8601String())
        ->assertJsonPath('exams.0.submitted', false);

    $this->postJson("/api/attempts/{$id}/submit")->assertOk();
    $this->getJson('/api/candidate/exams')
        ->assertJsonPath('exams.0.open_attempt', null)
        ->assertJsonPath('exams.0.submitted', true)
        ->assertJsonPath('exams.0.can_start', true);
});

it('counts a sealed Attempt as submitted', function () {
    $s = attemptSetup();
    Attempt::factory()->create([
        'exam_id' => $s['exam']->id, 'candidate_id' => $s['candidate']->id,
        'started_at' => now()->subHours(2), 'expires_at' => now()->subHour(),
    ]);
    signInAs($s['candidate']);

    $this->getJson('/api/candidate/exams')->assertJsonPath('exams.0.submitted', true)->assertJsonPath('exams.0.can_start', false);
});

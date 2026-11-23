<?php

use App\Enums\MembershipStatus;
use App\Models\ClassMembership;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function asCandidate(): User
{
    $candidate = User::factory()->candidate()->create();
    test()->withToken($candidate->createToken('spa')->plainTextToken);

    return $candidate;
}

it('sends a pending join request with a code in any case', function () {
    $class = SchoolClass::factory()->create(['name' => 'Clasa a VI-a A', 'join_code' => 'K7Q4MX']);
    $candidate = asCandidate();

    $this->postJson('/api/memberships', ['class_code' => 'k7q-4mx'])
        ->assertCreated()
        ->assertJsonPath('membership.status', 'pending')
        ->assertJsonPath('membership.class', ['id' => $class->id, 'name' => 'Clasa a VI-a A']);

    expect($candidate->memberships()->sole()->status)->toBe(MembershipStatus::Pending);
});

it('changes nothing when a request is already pending or accepted', function (MembershipStatus $status) {
    $class = SchoolClass::factory()->create(['join_code' => 'K7Q4MX']);
    $candidate = asCandidate();
    $membership = new ClassMembership;
    $membership->class_id = $class->id;
    $membership->candidate_id = $candidate->id;
    $membership->status = $status;
    $membership->save();

    $this->postJson('/api/memberships', ['class_code' => 'K7Q4MX'])
        ->assertOk()
        ->assertJsonPath('membership.id', $membership->id)
        ->assertJsonPath('membership.status', $status->value);

    expect(ClassMembership::count())->toBe(1)
        ->and($membership->fresh()->status)->toBe($status);
})->with([MembershipStatus::Pending, MembershipStatus::Accepted]);

it('refuses an unknown or missing code', function () {
    asCandidate();

    $this->postJson('/api/memberships', ['class_code' => 'ZZZ-ZZZ'])
        ->assertUnprocessable()->assertJsonPath('errors.class_code.0', 'not_found');
    $this->postJson('/api/memberships', ['class_code' => ''])
        ->assertJsonPath('errors.class_code.0', 'required');
});

it('refuses a new request after a decline, until Q-041 is answered', function () {
    $class = SchoolClass::factory()->create(['join_code' => 'K7Q4MX']);
    $candidate = asCandidate();
    $membership = new ClassMembership;
    $membership->class_id = $class->id;
    $membership->candidate_id = $candidate->id;
    $membership->status = MembershipStatus::Rejected;
    $membership->save();

    $this->postJson('/api/memberships', ['class_code' => 'K7Q4MX'])
        ->assertStatus(409)->assertJsonPath('code', 'already_decided');

    expect($membership->fresh()->status)->toBe(MembershipStatus::Rejected);
});

it('accepts or declines a pending request once', function (string $action, MembershipStatus $status) {
    $examiner = User::factory()->examiner()->create();
    $class = SchoolClass::factory()->for($examiner, 'examiner')->create(['join_code' => 'K7Q4MX']);
    $membership = new ClassMembership;
    $membership->class_id = $class->id;
    $membership->candidate_id = User::factory()->candidate()->create()->id;
    $membership->save();
    $this->withToken($examiner->createToken('spa')->plainTextToken);

    $this->postJson("/api/memberships/{$membership->id}/{$action}")
        ->assertOk()
        ->assertJsonPath('membership.status', $status->value);

    $fresh = $membership->fresh();
    expect($fresh->status)->toBe($status)->and($fresh->decided_at)->not->toBeNull();

    $this->postJson("/api/memberships/{$membership->id}/accept")
        ->assertStatus(409)->assertJsonPath('code', 'already_decided');
    $this->postJson("/api/memberships/{$membership->id}/decline")
        ->assertStatus(409);
    expect($membership->fresh()->status)->toBe($status);
})->with([
    ['accept', MembershipStatus::Accepted],
    ['decline', MembershipStatus::Rejected],
]);

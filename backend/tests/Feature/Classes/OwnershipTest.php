<?php

use App\Enums\MembershipStatus;
use App\Models\ClassMembership;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('answers 404 for another examiner\'s class, request and candidate', function () {
    $class = SchoolClass::factory()->create(['join_code' => 'K7Q4MX']);
    $candidate = User::factory()->candidate()->create();
    $membership = new ClassMembership;
    $membership->class_id = $class->id;
    $membership->candidate_id = $candidate->id;
    $membership->save();

    $other = User::factory()->examiner()->create();
    $this->withToken($other->createToken('spa')->plainTextToken);

    $this->getJson("/api/classes/{$class->id}")->assertNotFound();
    $this->patchJson("/api/classes/{$class->id}", ['name' => 'X'])->assertNotFound();
    $this->postJson("/api/classes/{$class->id}/join-code")->assertNotFound();
    $this->deleteJson("/api/classes/{$class->id}")->assertNotFound();
    $this->postJson("/api/memberships/{$membership->id}/accept")->assertNotFound();
    $this->postJson("/api/memberships/{$membership->id}/decline")->assertNotFound();

    $membership->status = MembershipStatus::Accepted;
    $membership->save();
    $this->putJson("/api/classes/{$class->id}/candidates/{$candidate->id}/password", ['password' => 'parola-noua-48'])->assertNotFound();

    expect($class->fresh()->name)->not->toBe('X')
        ->and($class->fresh()->join_code)->toBe('K7Q4MX');
});

it('keeps candidates, administrators and inactive examiners out of class routes', function (string $state, string $code) {
    $user = match ($state) {
        'candidate' => User::factory()->candidate()->create(),
        'administrator' => User::factory()->administrator()->create(),
        'inactive examiner' => User::factory()->examiner()->create(),
    };
    $token = $user->createToken('spa')->plainTextToken;
    if ($state === 'inactive examiner') {
        User::whereKey($user->id)->update(['is_active' => false]);
    }

    $this->withToken($token)->getJson('/api/classes')->assertForbidden()->assertJsonPath('code', $code);
})->with([
    ['candidate', 'forbidden_role'],
    ['administrator', 'forbidden_role'],
    ['inactive examiner', 'account_inactive'],
]);

it('lets only candidates send join requests', function () {
    SchoolClass::factory()->create(['join_code' => 'K7Q4MX']);
    $examiner = User::factory()->examiner()->create();

    $this->withToken($examiner->createToken('spa')->plainTextToken)
        ->postJson('/api/memberships', ['class_code' => 'K7Q4MX'])
        ->assertForbidden()->assertJsonPath('code', 'forbidden_role');
});

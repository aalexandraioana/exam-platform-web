<?php

use App\Enums\MembershipStatus;
use App\Models\ClassMembership;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

function classWith(User $examiner, User $candidate, MembershipStatus $status): SchoolClass
{
    $class = SchoolClass::factory()->for($examiner, 'examiner')->create(['join_code' => fake()->unique()->bothify('??????')]);
    $membership = new ClassMembership;
    $membership->class_id = $class->id;
    $membership->candidate_id = $candidate->id;
    $membership->status = $status;
    $membership->save();

    return $class;
}

it('sets a new password for an accepted candidate; the old password and tokens stop working', function () {
    $examiner = User::factory()->examiner()->create();
    $candidate = User::factory()->candidate()->create(['password' => 'parola-veche-48']);
    $candidateToken = $candidate->createToken('spa')->plainTextToken;
    $class = classWith($examiner, $candidate, MembershipStatus::Accepted);

    $this->withToken($examiner->createToken('spa')->plainTextToken)
        ->putJson("/api/classes/{$class->id}/candidates/{$candidate->id}/password", ['password' => 'lalea-verde-48'])
        ->assertNoContent();

    $candidate->refresh();
    expect(Hash::check('lalea-verde-48', $candidate->password))->toBeTrue()
        ->and(Hash::check('parola-veche-48', $candidate->password))->toBeFalse()
        ->and($candidate->tokens()->count())->toBe(0);

    $this->app['auth']->forgetGuards();
    $this->withToken($candidateToken)->getJson('/api/user')->assertUnauthorized();
});

it('refuses a missing or too short password', function () {
    $examiner = User::factory()->examiner()->create();
    $candidate = User::factory()->candidate()->create();
    $class = classWith($examiner, $candidate, MembershipStatus::Accepted);
    $this->withToken($examiner->createToken('spa')->plainTextToken);

    $this->putJson("/api/classes/{$class->id}/candidates/{$candidate->id}/password", ['password' => ''])
        ->assertUnprocessable()->assertJsonPath('errors.password.0', 'required');
    $this->putJson("/api/classes/{$class->id}/candidates/{$candidate->id}/password", ['password' => 'scurta'])
        ->assertJsonPath('errors.password.0', 'too_short');
});

it('answers 404 for a candidate who is only pending, declined, or in another class', function (MembershipStatus $status) {
    $examiner = User::factory()->examiner()->create();
    $candidate = User::factory()->candidate()->create(['password' => 'parola-veche-48']);
    $class = classWith($examiner, $candidate, $status);

    $this->withToken($examiner->createToken('spa')->plainTextToken)
        ->putJson("/api/classes/{$class->id}/candidates/{$candidate->id}/password", ['password' => 'lalea-verde-48'])
        ->assertNotFound();

    expect(Hash::check('parola-veche-48', $candidate->fresh()->password))->toBeTrue();
})->with([MembershipStatus::Pending, MembershipStatus::Rejected]);

it('answers 404 for an accepted candidate of the examiner\'s other class', function () {
    $examiner = User::factory()->examiner()->create();
    $candidate = User::factory()->candidate()->create();
    classWith($examiner, $candidate, MembershipStatus::Accepted);
    $empty = SchoolClass::factory()->for($examiner, 'examiner')->create(['join_code' => 'EMPTY2']);

    $this->withToken($examiner->createToken('spa')->plainTextToken)
        ->putJson("/api/classes/{$empty->id}/candidates/{$candidate->id}/password", ['password' => 'lalea-verde-48'])
        ->assertNotFound();
});

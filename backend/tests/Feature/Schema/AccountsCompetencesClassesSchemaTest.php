<?php

use App\Enums\MembershipStatus;
use App\Enums\Role;
use App\Models\ClassMembership;
use App\Models\Competence;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

/**
 * Runs a statement the database must refuse. The inner transaction becomes a savepoint, so the
 * test's own transaction stays usable after the expected error.
 */
function expectRefused(callable $statement): void
{
    expect(fn () => DB::transaction($statement))->toThrow(QueryException::class);
}

it('defaults a new user to an active candidate and refuses an unknown role', function () {
    $id = DB::table('users')->insertGetId([
        'name' => 'Ana Dumitru',
        'email' => 'ana@example.test',
        'password' => 'hashed',
    ]);

    $user = User::find($id);
    expect($user->role)->toBe(Role::Candidate)
        ->and($user->is_active)->toBeTrue();

    expectRefused(fn () => DB::table('users')->where('id', $id)->update(['role' => 'superuser']));
});

it('keeps competence codes unique per examiner only', function () {
    $examiner = User::factory()->examiner()->create();
    $other = User::factory()->examiner()->create();
    Competence::factory()->for($examiner, 'examiner')->create(['code' => 'C1']);

    Competence::factory()->for($other, 'examiner')->create(['code' => 'C1']);
    expect(Competence::where('code', 'C1')->count())->toBe(2);

    expectRefused(fn () => Competence::factory()->for($examiner, 'examiner')->create(['code' => 'C1']));
});

it('keeps join codes unique, one membership per candidate and class, and known statuses only', function () {
    $class = SchoolClass::factory()->create(['join_code' => 'K7Q-4MX']);
    $candidate = User::factory()->create();
    ClassMembership::factory()->for($class, 'schoolClass')->for($candidate, 'candidate')->create();

    expectRefused(fn () => SchoolClass::factory()->create(['join_code' => 'K7Q-4MX']));
    expectRefused(fn () => ClassMembership::factory()->for($class, 'schoolClass')->for($candidate, 'candidate')->create());
    expectRefused(fn () => ClassMembership::factory()->for($class, 'schoolClass')->create(['status' => 'invited']));

    expect(ClassMembership::first()->status)->toBe(MembershipStatus::Pending);
});

it('deletes memberships with their class and refuses to delete a user who owns a class or a competence', function () {
    $class = SchoolClass::factory()->create();
    ClassMembership::factory()->count(2)->for($class, 'schoolClass')->create();

    $class->delete();
    expect(ClassMembership::count())->toBe(0);

    $classOwner = SchoolClass::factory()->create()->examiner;
    expectRefused(fn () => $classOwner->delete());

    $competenceOwner = Competence::factory()->create()->examiner;
    expectRefused(fn () => $competenceOwner->delete());
});

it('navigates examiner, classes, memberships, candidates and competences', function () {
    $examiner = User::factory()->examiner()->create();
    $class = SchoolClass::factory()->for($examiner, 'examiner')->create();
    $candidate = User::factory()->create();
    ClassMembership::factory()->for($class, 'schoolClass')->for($candidate, 'candidate')
        ->create(['status' => MembershipStatus::Accepted]);
    $competence = Competence::factory()->for($examiner, 'examiner')->create();

    expect($examiner->classes->pluck('id')->all())->toBe([$class->id])
        ->and($examiner->competences->pluck('id')->all())->toBe([$competence->id])
        ->and($class->candidates->pluck('id')->all())->toBe([$candidate->id])
        ->and($class->memberships->first()->status)->toBe(MembershipStatus::Accepted)
        ->and($candidate->memberships->first()->schoolClass->is($class))->toBeTrue()
        ->and($competence->examiner->is($examiner))->toBeTrue();
});

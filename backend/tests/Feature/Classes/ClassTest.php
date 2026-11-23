<?php

use App\Enums\MembershipStatus;
use App\Models\ClassMembership;
use App\Models\Exam;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function asExaminer(?User $examiner = null): User
{
    $examiner ??= User::factory()->examiner()->create();
    test()->withToken($examiner->createToken('spa')->plainTextToken);

    return $examiner;
}

function membership(SchoolClass $class, MembershipStatus $status, ?User $candidate = null): ClassMembership
{
    $membership = new ClassMembership;
    $membership->class_id = $class->id;
    $membership->candidate_id = ($candidate ?? User::factory()->candidate()->create())->id;
    $membership->status = $status;
    $membership->decided_at = $status === MembershipStatus::Pending ? null : now();
    $membership->save();

    return $membership;
}

it('lists only the examiner\'s own classes, by name, with their counts', function () {
    $examiner = asExaminer();
    $b = SchoolClass::factory()->for($examiner, 'examiner')->create(['name' => 'Clasa a VI-a B', 'join_code' => 'BBBBBB']);
    $a = SchoolClass::factory()->for($examiner, 'examiner')->create(['name' => 'Clasa a VI-a A', 'join_code' => 'K7Q4MX']);
    SchoolClass::factory()->create(['name' => 'Alt examinator']);
    membership($a, MembershipStatus::Pending);
    membership($a, MembershipStatus::Accepted);
    membership($a, MembershipStatus::Accepted);
    membership($a, MembershipStatus::Rejected);
    $a->exams()->attach(Exam::factory()->for($examiner, 'examiner')->published()->create());
    $a->exams()->attach(Exam::factory()->for($examiner, 'examiner')->create());

    $this->getJson('/api/classes')
        ->assertOk()
        ->assertJsonCount(2, 'classes')
        ->assertJsonPath('classes.0', [
            'id' => $a->id, 'name' => 'Clasa a VI-a A', 'join_code' => 'K7Q-4MX',
            'pending_count' => 1, 'candidate_count' => 2, 'published_exam_count' => 1,
        ])
        ->assertJsonPath('classes.1.id', $b->id);
});

it('creates a class with a server code, ignoring a code in the request', function () {
    $examiner = asExaminer();

    $response = $this->postJson('/api/classes', ['name' => 'Clasa a VII-a A', 'join_code' => 'AAAAAA']);

    $response->assertCreated()->assertJsonPath('class.name', 'Clasa a VII-a A');
    $class = SchoolClass::sole();
    expect($class->examiner_id)->toBe($examiner->id)
        ->and($class->join_code)->not->toBe('AAAAAA')
        ->and($class->join_code)->toMatch('/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/')
        ->and($response->json('class.join_code'))->toBe(substr($class->join_code, 0, 3).'-'.substr($class->join_code, 3));
});

it('refuses a class without a name or with a too long name', function () {
    asExaminer();

    $this->postJson('/api/classes', ['name' => ''])->assertUnprocessable()->assertJsonPath('errors.name.0', 'required');
    $this->postJson('/api/classes', ['name' => str_repeat('a', 256)])->assertJsonPath('errors.name.0', 'invalid');
});

it('shows a class with its pending requests oldest first and its candidates by name', function () {
    $examiner = asExaminer();
    $class = SchoolClass::factory()->for($examiner, 'examiner')->create(['join_code' => 'K7Q4MX']);
    $late = membership($class, MembershipStatus::Pending, User::factory()->candidate()->create(['first_name' => 'Matei', 'last_name' => 'Radu']));
    $late->requested_at = now();
    $late->save();
    $early = membership($class, MembershipStatus::Pending, User::factory()->candidate()->create(['first_name' => 'Ioana', 'last_name' => 'G']));
    $early->requested_at = now()->subDay();
    $early->save();
    membership($class, MembershipStatus::Accepted, User::factory()->candidate()->create(['first_name' => 'Bogdan', 'last_name' => 'Ilie']));
    membership($class, MembershipStatus::Accepted, User::factory()->candidate()->create(['first_name' => 'Ana', 'last_name' => 'Dumitru']));
    membership($class, MembershipStatus::Rejected);

    $this->getJson("/api/classes/{$class->id}")
        ->assertOk()
        ->assertJsonPath('class.id', $class->id)
        ->assertJsonPath('requests.0.id', $early->id)
        ->assertJsonPath('requests.0.candidate.name', 'Ioana G')
        ->assertJsonPath('requests.1.id', $late->id)
        ->assertJsonCount(2, 'requests')
        ->assertJsonPath('candidates.0.name', 'Ana Dumitru')
        ->assertJsonPath('candidates.1.name', 'Bogdan Ilie')
        ->assertJsonCount(2, 'candidates')
        ->assertJsonStructure(['candidates' => [['id', 'name', 'email', 'joined_at']], 'requests' => [['id', 'candidate' => ['id', 'name', 'email'], 'requested_at']]]);
});

it('renames a class', function () {
    $examiner = asExaminer();
    $class = SchoolClass::factory()->for($examiner, 'examiner')->create(['join_code' => 'K7Q4MX']);

    $this->patchJson("/api/classes/{$class->id}", ['name' => 'Clasa a VI-a C'])
        ->assertOk()->assertJsonPath('class.name', 'Clasa a VI-a C');
    expect($class->fresh()->name)->toBe('Clasa a VI-a C');
});

it('replaces the join code, so the old one fails and existing requests stay', function () {
    $examiner = asExaminer();
    $class = SchoolClass::factory()->for($examiner, 'examiner')->create(['join_code' => 'K7Q4MX']);
    $request = membership($class, MembershipStatus::Pending);

    $this->postJson("/api/classes/{$class->id}/join-code")->assertOk();

    expect($class->fresh()->join_code)->not->toBe('K7Q4MX')
        ->and($request->fresh())->not->toBeNull();

    $candidate = User::factory()->candidate()->create();
    $this->app['auth']->forgetGuards();
    $this->withToken($candidate->createToken('spa')->plainTextToken)
        ->postJson('/api/memberships', ['class_code' => 'K7Q-4MX'])
        ->assertUnprocessable()->assertJsonPath('errors.class_code.0', 'not_found');
});

it('deletes a class after unlinking its draft exams', function () {
    $examiner = asExaminer();
    $class = SchoolClass::factory()->for($examiner, 'examiner')->create(['join_code' => 'K7Q4MX']);
    $draft = Exam::factory()->for($examiner, 'examiner')->create();
    $class->exams()->attach($draft);
    membership($class, MembershipStatus::Accepted);

    $this->deleteJson("/api/classes/{$class->id}")->assertNoContent();

    expect(SchoolClass::count())->toBe(0)
        ->and($draft->fresh())->not->toBeNull()
        ->and(ClassMembership::count())->toBe(0);
});

it('refuses to delete a class linked to a published exam (D-049)', function () {
    $examiner = asExaminer();
    $class = SchoolClass::factory()->for($examiner, 'examiner')->create(['join_code' => 'K7Q4MX']);
    $class->exams()->attach(Exam::factory()->for($examiner, 'examiner')->create());
    $class->exams()->attach(Exam::factory()->for($examiner, 'examiner')->published()->create());

    $this->deleteJson("/api/classes/{$class->id}")
        ->assertStatus(409)
        ->assertJsonPath('code', 'class_has_published_exam');

    expect($class->fresh())->not->toBeNull()
        ->and($class->exams()->count())->toBe(2);
});

it('sorts the roster and the requests by last name, then first name', function () {
    $examiner = asExaminer();
    $class = SchoolClass::factory()->for($examiner, 'examiner')->create(['join_code' => 'K7Q4MX']);
    foreach ([['Ana', 'Popescu'], ['Zoe', 'Albu'], ['bogdan', 'popescu']] as [$first, $last]) {
        membership($class, MembershipStatus::Accepted, User::factory()->candidate()->create(['first_name' => $first, 'last_name' => $last]));
    }

    $this->getJson("/api/classes/{$class->id}")
        ->assertOk()
        ->assertJsonPath('candidates.0.name', 'Zoe Albu')
        ->assertJsonPath('candidates.1.name', 'Ana Popescu')
        ->assertJsonPath('candidates.2.name', 'bogdan popescu')
        ->assertJsonPath('candidates.0.first_name', 'Zoe')
        ->assertJsonPath('candidates.0.last_name', 'Albu');
});


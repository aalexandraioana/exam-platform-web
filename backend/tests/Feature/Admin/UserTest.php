<?php

use App\Enums\MembershipStatus;
use App\Enums\Role;
use App\Models\ClassMembership;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

function adminToken(?User $admin = null): string
{
    return ($admin ?? User::factory()->administrator()->create())->createToken('spa')->plainTextToken;
}

// C-003 · GET /api/admin/users

it('lists every user, sorted by last name, with role, status and the temporary-password flag', function () {
    $admin = User::factory()->administrator()->create(['first_name' => 'Radu', 'last_name' => 'Ionescu']);
    User::factory()->candidate()->create(['first_name' => 'Ana', 'last_name' => 'Dumitru']);
    User::factory()->examiner()->create(['first_name' => 'Maria', 'last_name' => 'Popa', 'is_active' => false]);

    $this->withToken(adminToken($admin))->getJson('/api/admin/users')
        ->assertOk()
        ->assertJsonPath('users.*.name', ['Ana Dumitru', 'Radu Ionescu', 'Maria Popa'])
        ->assertJsonPath('users.*.role', ['candidate', 'administrator', 'examiner'])
        ->assertJsonPath('users.*.is_active', [true, true, false])
        ->assertJsonPath('users.*.must_change_password', [false, false, false]);
});

it('keeps the admin routes for administrators', function (string $method, string $uri) {
    foreach ([User::factory()->examiner()->create(), User::factory()->candidate()->create()] as $user) {
        $this->app['auth']->forgetGuards();
        $this->withToken($user->createToken('spa')->plainTextToken)->json($method, $uri, [])
            ->assertForbidden()->assertJsonPath('code', 'forbidden_role');
    }
})->with([
    ['GET', '/api/admin/users'],
    ['PUT', '/api/admin/users/1/password'],
    ['POST', '/api/admin/examiners'],
    ['PATCH', '/api/admin/users/1'],
]);

// C-003 · PUT /api/admin/users/{id}/password (D-054)

it('sets a temporary password: the user must change it, and their old password and tokens stop working', function (string $role) {
    $user = User::factory()->state(['role' => $role])->create(['password' => 'parola-veche-48']);
    $userToken = $user->createToken('spa')->plainTextToken;

    $this->withToken(adminToken())
        ->putJson("/api/admin/users/{$user->id}/password", ['password' => 'lalea-verde-48'])
        ->assertNoContent();

    $user->refresh();
    expect(Hash::check('lalea-verde-48', $user->password))->toBeTrue()
        ->and($user->must_change_password)->toBeTrue()
        ->and($user->tokens()->count())->toBe(0);

    $this->app['auth']->forgetGuards();
    $this->withToken($userToken)->getJson('/api/user')->assertUnauthorized();
})->with(['candidate', 'examiner', 'administrator']);

it('refuses a missing or too short temporary password', function () {
    $user = User::factory()->candidate()->create();
    $this->withToken(adminToken());

    $this->putJson("/api/admin/users/{$user->id}/password", ['password' => ''])
        ->assertUnprocessable()->assertJsonPath('errors.password.0', 'required');
    $this->putJson("/api/admin/users/{$user->id}/password", ['password' => 'scurta'])
        ->assertJsonPath('errors.password.0', 'too_short');
    expect($user->fresh()->must_change_password)->toBeFalse();
});

it('answers 404 for an unknown user', function () {
    $this->withToken(adminToken())
        ->putJson('/api/admin/users/999999/password', ['password' => 'lalea-verde-48'])
        ->assertNotFound();
});

it('refuses setting the administrator\'s own password and a deactivated user\'s', function () {
    $admin = User::factory()->administrator()->create(['password' => 'parola-mea-48']);
    $gone = User::factory()->candidate()->create(['is_active' => false, 'password' => 'parola-veche-48']);
    $this->withToken(adminToken($admin));

    $this->putJson("/api/admin/users/{$admin->id}/password", ['password' => 'lalea-verde-48'])
        ->assertForbidden()->assertJsonPath('code', 'forbidden_target');
    $this->putJson("/api/admin/users/{$gone->id}/password", ['password' => 'lalea-verde-48'])
        ->assertConflict()->assertJsonPath('code', 'already_deactivated');

    expect(Hash::check('parola-mea-48', $admin->fresh()->password))->toBeTrue()
        ->and(Hash::check('parola-veche-48', $gone->fresh()->password))->toBeTrue();
});

it('no longer lets an examiner set a candidate\'s password (D-054)', function () {
    $examiner = User::factory()->examiner()->create();
    $candidate = User::factory()->candidate()->create(['password' => 'parola-veche-48']);
    $class = SchoolClass::factory()->for($examiner, 'examiner')->create(['join_code' => 'K7Q4MX']);
    $membership = new ClassMembership;
    $membership->class_id = $class->id;
    $membership->candidate_id = $candidate->id;
    $membership->status = MembershipStatus::Accepted;
    $membership->save();

    $response = $this->withToken($examiner->createToken('spa')->plainTextToken)
        ->putJson("/api/classes/{$class->id}/candidates/{$candidate->id}/password", ['password' => 'lalea-verde-48']);

    expect($response->status())->toBeIn([404, 405])
        ->and(Hash::check('parola-veche-48', $candidate->fresh()->password))->toBeTrue();
});

// C-003 · POST /api/admin/examiners (D-054, D-055)

it('creates an examiner with a temporary password', function () {
    $this->withToken(adminToken())
        ->postJson('/api/admin/examiners', [
            'first_name' => ' Maria ', 'last_name' => 'Popa', 'email' => 'Maria.Popa@exemplu.ro',
            'password' => 'tei-inflorit-21', 'role' => 'administrator', 'is_active' => false,
        ])
        ->assertCreated()
        ->assertJsonPath('user.name', 'Maria Popa')
        ->assertJsonPath('user.email', 'maria.popa@exemplu.ro')
        ->assertJsonPath('user.role', 'examiner')
        ->assertJsonPath('user.is_active', true)
        ->assertJsonPath('user.must_change_password', true);

    $user = User::where('email', 'maria.popa@exemplu.ro')->sole();
    expect($user->role)->toBe(Role::Examiner)
        ->and(Hash::check('tei-inflorit-21', $user->password))->toBeTrue()
        ->and($user->tokens()->count())->toBe(0);
});

it('refuses a new examiner with missing fields, a bad or taken email, or a short password', function () {
    User::factory()->create(['email' => 'maria.popa@exemplu.ro']);
    $this->withToken(adminToken());

    $this->postJson('/api/admin/examiners', [])
        ->assertUnprocessable()
        ->assertJsonPath('errors.first_name.0', 'required')
        ->assertJsonPath('errors.last_name.0', 'required')
        ->assertJsonPath('errors.email.0', 'required')
        ->assertJsonPath('errors.password.0', 'required');
    $this->postJson('/api/admin/examiners', ['first_name' => 'M', 'last_name' => 'P', 'email' => 'maria@', 'password' => 'scurta'])
        ->assertJsonPath('errors.email.0', 'invalid')
        ->assertJsonPath('errors.password.0', 'too_short');
    $this->postJson('/api/admin/examiners', ['first_name' => 'M', 'last_name' => 'P', 'email' => 'MARIA.POPA@exemplu.ro', 'password' => 'tei-inflorit-21'])
        ->assertJsonPath('errors.email.0', 'taken');

    expect(User::count())->toBe(2);
});

// C-003 · PATCH /api/admin/users/{id} (D-056)

it('deactivates a candidate or an examiner: signed out and refused at login', function (string $role) {
    $user = User::factory()->state(['role' => $role])->create(['email' => 'ana@exemplu.ro', 'password' => 'parola-mea-48']);
    $user->createToken('spa');

    $this->withToken(adminToken())
        ->patchJson("/api/admin/users/{$user->id}", ['is_active' => false])
        ->assertOk()
        ->assertJsonPath('user.id', $user->id)
        ->assertJsonPath('user.is_active', false);

    expect($user->fresh()->is_active)->toBeFalse()->and($user->tokens()->count())->toBe(0);

    $this->app['auth']->forgetGuards();
    $this->postJson('/api/login', ['email' => 'ana@exemplu.ro', 'password' => 'parola-mea-48'])
        ->assertForbidden()->assertJsonPath('code', 'account_inactive');
})->with(['candidate', 'examiner']);

it('never deactivates an administrator, including oneself', function () {
    $admin = User::factory()->administrator()->create();
    $other = User::factory()->administrator()->create();
    $this->withToken(adminToken($admin));

    foreach ([$admin, $other] as $target) {
        $this->patchJson("/api/admin/users/{$target->id}", ['is_active' => false])
            ->assertForbidden()->assertJsonPath('code', 'forbidden_target');
        expect($target->fresh()->is_active)->toBeTrue();
    }
});

it('never reactivates a user', function () {
    $gone = User::factory()->candidate()->create(['is_active' => false]);
    $this->withToken(adminToken());

    $this->patchJson("/api/admin/users/{$gone->id}", ['is_active' => true])
        ->assertUnprocessable()->assertJsonPath('errors.is_active.0', 'invalid');
    $this->patchJson("/api/admin/users/{$gone->id}", [])
        ->assertUnprocessable()->assertJsonPath('errors.is_active.0', 'required');
    $this->patchJson("/api/admin/users/{$gone->id}", ['is_active' => false])
        ->assertConflict()->assertJsonPath('code', 'already_deactivated');

    expect($gone->fresh()->is_active)->toBeFalse();
});

it('answers 404 when deactivating an unknown user', function () {
    $this->withToken(adminToken())->patchJson('/api/admin/users/999999', ['is_active' => false])->assertNotFound();
});

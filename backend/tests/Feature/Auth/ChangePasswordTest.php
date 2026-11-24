<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

/** A user whose password an Administrator just set (D-054). */
function withTemporaryPassword(string $role = 'candidate'): User
{
    $user = User::factory()->state(['role' => $role])->create(['email' => 'ana@exemplu.ro', 'password' => 'lalea-verde-48']);
    $user->must_change_password = true;
    $user->save();

    return $user;
}

it('signs in with a temporary password and says it must be changed', function () {
    withTemporaryPassword();

    $this->postJson('/api/login', ['email' => 'ana@exemplu.ro', 'password' => 'lalea-verde-48'])
        ->assertOk()
        ->assertJsonPath('user.must_change_password', true);
});

it('allows only the current user, logout and the password change until the password is changed', function (string $role) {
    $user = withTemporaryPassword($role);
    $token = $user->createToken('spa')->plainTextToken;

    $this->withToken($token)->getJson('/api/user')->assertOk()->assertJsonPath('user.must_change_password', true);

    $blocked = match ($role) {
        'examiner' => ['GET', '/api/classes'],
        'candidate' => ['POST', '/api/memberships'],
        'administrator' => ['GET', '/api/admin/users'],
    };
    $this->withToken($token)->json(...$blocked)
        ->assertForbidden()->assertJsonPath('code', 'password_change_required');

    $this->withToken($token)->postJson('/api/logout')->assertNoContent();
})->with(['candidate', 'examiner', 'administrator']);

it('changes the password: the flag is cleared and a new token replaces the old one', function () {
    $user = withTemporaryPassword('examiner');
    $old = $user->createToken('spa')->plainTextToken;

    $response = $this->withToken($old)->putJson('/api/user/password', [
        'password' => 'soare-albastru-7', 'password_confirmation' => 'soare-albastru-7',
    ])->assertOk()
        ->assertJsonPath('user.id', $user->id)
        ->assertJsonPath('user.must_change_password', false);

    $user->refresh();
    expect(Hash::check('soare-albastru-7', $user->password))->toBeTrue()
        ->and($user->must_change_password)->toBeFalse()
        ->and($user->tokens()->count())->toBe(1);

    $this->app['auth']->forgetGuards();
    $this->withToken($old)->getJson('/api/user')->assertUnauthorized();
    $this->app['auth']->forgetGuards();
    $this->withToken($response->json('token'))->getJson('/api/classes')->assertOk();
});

it('refuses a missing, short, mismatched or temporary password', function () {
    $user = withTemporaryPassword();
    $this->withToken($user->createToken('spa')->plainTextToken);

    $this->putJson('/api/user/password', [])
        ->assertUnprocessable()->assertJsonPath('errors.password.0', 'required');
    $this->putJson('/api/user/password', ['password' => 'scurta', 'password_confirmation' => 'scurta'])
        ->assertJsonPath('errors.password.0', 'too_short');
    $this->putJson('/api/user/password', ['password' => 'soare-albastru-7', 'password_confirmation' => 'soare-albastru-8'])
        ->assertJsonPath('errors.password.0', 'mismatch');
    $this->putJson('/api/user/password', ['password' => 'lalea-verde-48', 'password_confirmation' => 'lalea-verde-48'])
        ->assertJsonPath('errors.password.0', 'same_as_temporary');

    expect($user->fresh()->must_change_password)->toBeTrue();
});

it('refuses a change when the password is not temporary', function () {
    $user = User::factory()->candidate()->create(['password' => 'parola-mea-48']);

    $this->withToken($user->createToken('spa')->plainTextToken)
        ->putJson('/api/user/password', ['password' => 'soare-albastru-7', 'password_confirmation' => 'soare-albastru-7'])
        ->assertForbidden()->assertJsonPath('code', 'password_change_not_required');

    expect(Hash::check('parola-mea-48', $user->fresh()->password))->toBeTrue();
});

<?php

use App\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

it('creates an examiner or administrator with a password asked twice', function (string $role) {
    $this->artisan('app:create-user', ['role' => $role, 'email' => 'Maria.Popa@exemplu.ro', 'first_name' => 'Maria', 'last_name' => 'Popa'])
        ->expectsQuestion('Password', 'parola-mea-48')
        ->expectsQuestion('Password again', 'parola-mea-48')
        ->assertSuccessful();

    $user = User::sole();
    expect($user->role)->toBe(Role::from($role))
        ->and($user->email)->toBe('maria.popa@exemplu.ro')
        ->and($user->first_name)->toBe('Maria')
        ->and($user->last_name)->toBe('Popa')
        ->and($user->is_active)->toBeTrue()
        ->and(Hash::check('parola-mea-48', $user->password))->toBeTrue()
        ->and($user->must_change_password)->toBeTrue(); // D-054: the first password is temporary
})->with(['examiner', 'administrator']);

it('refuses the candidate role', function () {
    $this->artisan('app:create-user', ['role' => 'candidate', 'email' => 'ana@exemplu.ro', 'first_name' => 'Ana', 'last_name' => 'Pop'])
        ->assertFailed();

    expect(User::count())->toBe(0);
});

it('refuses a taken email, a short password and mismatched passwords', function () {
    User::factory()->create(['email' => 'maria@exemplu.ro']);

    $this->artisan('app:create-user', ['role' => 'examiner', 'email' => 'MARIA@exemplu.ro', 'first_name' => 'Maria', 'last_name' => 'Pop'])
        ->assertFailed();

    $this->artisan('app:create-user', ['role' => 'examiner', 'email' => 'ion@exemplu.ro', 'first_name' => 'Ion', 'last_name' => 'Pop'])
        ->expectsQuestion('Password', 'scurta')
        ->expectsQuestion('Password again', 'scurta')
        ->assertFailed();

    $this->artisan('app:create-user', ['role' => 'examiner', 'email' => 'ion@exemplu.ro', 'first_name' => 'Ion', 'last_name' => 'Pop'])
        ->expectsQuestion('Password', 'parola-mea-48')
        ->expectsQuestion('Password again', 'parola-alta-48')
        ->assertFailed();

    expect(User::count())->toBe(1);
});

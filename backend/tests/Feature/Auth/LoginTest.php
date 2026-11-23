<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns a token and the user, ignoring the email case', function () {
    $user = User::factory()->examiner()->create(['email' => 'maria.popa@exemplu.ro', 'password' => 'parola-mea-48']);

    $response = $this->postJson('/api/login', ['email' => 'Maria.Popa@EXEMPLU.ro', 'password' => 'parola-mea-48']);

    $response->assertOk()
        ->assertJsonPath('user.id', $user->id)
        ->assertJsonPath('user.role', 'examiner')
        ->assertJsonStructure(['token']);
    expect($user->tokens()->count())->toBe(1);
});

it('gives the same answer for a wrong password and an unknown email', function (string $email, string $password) {
    User::factory()->create(['email' => 'ana@exemplu.ro', 'password' => 'parola-mea-48']);

    $this->postJson('/api/login', ['email' => $email, 'password' => $password])
        ->assertUnprocessable()
        ->assertJsonPath('errors.email.0', 'credentials')
        ->assertJsonMissingPath('errors.password');
})->with([
    'wrong password' => ['ana@exemplu.ro', 'gresita-123'],
    'unknown email' => ['nimeni@exemplu.ro', 'parola-mea-48'],
]);

it('reports missing and malformed fields with codes', function () {
    $this->postJson('/api/login', ['email' => '', 'password' => ''])
        ->assertUnprocessable()
        ->assertJsonPath('errors.email.0', 'required')
        ->assertJsonPath('errors.password.0', 'required');

    $this->postJson('/api/login', ['email' => 'ana@', 'password' => 'x'])
        ->assertJsonPath('errors.email.0', 'invalid');
});

it('refuses an inactive user with account_inactive and issues no token', function () {
    $user = User::factory()->examiner()->create(['email' => 'ana@exemplu.ro', 'password' => 'parola-mea-48', 'is_active' => false]);

    $this->postJson('/api/login', ['email' => 'ana@exemplu.ro', 'password' => 'parola-mea-48'])
        ->assertForbidden()
        ->assertJsonPath('code', 'account_inactive');

    expect($user->tokens()->count())->toBe(0);
});

it('throttles repeated failed logins', function () {
    User::factory()->create(['email' => 'ana@exemplu.ro', 'password' => 'parola-mea-48']);

    foreach (range(1, 5) as $ignored) {
        $this->postJson('/api/login', ['email' => 'ana@exemplu.ro', 'password' => 'gresita'])->assertUnprocessable();
    }

    $this->postJson('/api/login', ['email' => 'ana@exemplu.ro', 'password' => 'parola-mea-48'])
        ->assertStatus(429)
        ->assertHeader('Retry-After');
});

<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\PersonalAccessToken;

uses(RefreshDatabase::class);

it('refuses SQL injection in the sign-in fields and issues no token', function (string $email, string $password, string $code) {
    User::factory()->create(['email' => 'ana@exemplu.ro', 'password' => 'parola-mea-48']);

    $this->postJson('/api/login', ['email' => $email, 'password' => $password])
        ->assertUnprocessable()
        ->assertJsonPath('errors.email.0', $code)
        ->assertJsonMissingPath('token');

    expect(PersonalAccessToken::count())->toBe(0);
})->with([
    // Refused by validation, before any query.
    'always-true email' => ["' OR '1'='1", 'orice', 'invalid'],
    // A valid address that reaches the query: it must match no user.
    'always-true email that passes validation' => ["x'or'1'='1@exemplu.ro", 'orice', 'credentials'],
    'always-true password' => ['ana@exemplu.ro', "' OR '1'='1", 'credentials'],
    'comment after the email' => ['ana@exemplu.ro', "x' --", 'credentials'],
]);

it('stores SQL injection typed at registration as plain text', function () {
    $injection = "Robert'); DROP TABLE users;--";

    $this->postJson('/api/register', [
        'first_name' => $injection,
        'last_name' => "' OR '1'='1",
        'email' => "o'brien@exemplu.ro",
        'password' => 'lalea-verde-48',
        'password_confirmation' => 'lalea-verde-48',
    ])->assertCreated()
        ->assertJsonPath('user.first_name', $injection)
        ->assertJsonPath('user.last_name', "' OR '1'='1")
        ->assertJsonPath('user.email', "o'brien@exemplu.ro");

    // The table is still there, with exactly the one new user, stored as typed.
    expect(User::count())->toBe(1)
        ->and(User::first()->only('first_name', 'last_name'))->toBe(['first_name' => $injection, 'last_name' => "' OR '1'='1"]);

    // A class code that tries to match every class matches none.
    $this->postJson('/api/register', [
        'first_name' => 'Ana',
        'last_name' => 'Dumitru',
        'email' => 'ana@exemplu.ro',
        'password' => 'lalea-verde-48',
        'password_confirmation' => 'lalea-verde-48',
        'class_code' => "' OR '1'='1",
    ])->assertUnprocessable()
        ->assertJsonPath('errors.class_code.0', 'not_found');

    expect(User::count())->toBe(1);
});

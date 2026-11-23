<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns the logged-in user', function () {
    $user = User::factory()->examiner()->create(['first_name' => 'Maria', 'last_name' => 'Popa']);

    $this->withToken($user->createToken('spa')->plainTextToken)
        ->getJson('/api/user')
        ->assertOk()
        ->assertExactJson(['user' => [
            'id' => $user->id, 'first_name' => 'Maria', 'last_name' => 'Popa', 'name' => 'Maria Popa', 'email' => $user->email,
            'role' => 'examiner', 'is_active' => true,
        ]]);
});

it('answers 401 without a token', function () {
    $this->getJson('/api/user')->assertUnauthorized();
});

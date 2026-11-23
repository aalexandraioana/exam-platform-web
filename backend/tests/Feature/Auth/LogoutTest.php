<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('revokes the token used for logout', function () {
    $user = User::factory()->create();
    $token = $user->createToken('spa')->plainTextToken;
    $other = $user->createToken('spa')->plainTextToken;

    $this->withToken($token)->postJson('/api/logout')->assertNoContent();
    $this->app['auth']->forgetGuards();

    $this->withToken($token)->getJson('/api/user')->assertUnauthorized();
    $this->app['auth']->forgetGuards();
    $this->withToken($other)->getJson('/api/user')->assertOk();
});

it('refuses logout without a token', function () {
    $this->postJson('/api/logout')->assertUnauthorized();
});

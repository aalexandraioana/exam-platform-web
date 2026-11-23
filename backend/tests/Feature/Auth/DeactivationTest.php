<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('deletes a user\'s tokens when the user is deactivated', function () {
    $user = User::factory()->examiner()->create();
    $user->createToken('spa');
    $user->createToken('spa');

    $user->is_active = false;
    $user->save();

    expect($user->tokens()->count())->toBe(0);
});

it('deletes a user\'s tokens when the password changes, but not on other edits', function () {
    $user = User::factory()->create();
    $user->createToken('spa');

    $user->update(['first_name' => 'Alt']);
    expect($user->tokens()->count())->toBe(1);

    $user->update(['password' => 'parola-noua-48']);
    expect($user->tokens()->count())->toBe(0);
});

it('refuses an inactive user whose token still exists', function () {
    $user = User::factory()->examiner()->create();
    $token = $user->createToken('spa')->plainTextToken;
    // Deactivated without the model hook (e.g. a direct query), so the token survives.
    User::whereKey($user->id)->update(['is_active' => false]);

    $this->withToken($token)->getJson('/api/user')
        ->assertForbidden()
        ->assertJsonPath('code', 'account_inactive');
});

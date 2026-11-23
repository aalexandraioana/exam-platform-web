<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;

uses(RefreshDatabase::class);

beforeEach(function () {
    Route::middleware(['api', 'auth:sanctum', 'active', 'role:examiner'])
        ->get('/api/_test/examiner-only', fn () => response()->json(['ok' => true]));
});

it('lets an active examiner through', function () {
    $examiner = User::factory()->examiner()->create();

    $this->withToken($examiner->createToken('spa')->plainTextToken)
        ->getJson('/api/_test/examiner-only')->assertOk();
});

it('refuses other roles with forbidden_role', function (string $role) {
    $user = User::factory()->{$role}()->create();

    $this->withToken($user->createToken('spa')->plainTextToken)
        ->getJson('/api/_test/examiner-only')
        ->assertForbidden()
        ->assertJsonPath('code', 'forbidden_role');
})->with(['candidate', 'administrator']);

it('refuses an inactive examiner with account_inactive', function () {
    $examiner = User::factory()->examiner()->create();
    $token = $examiner->createToken('spa')->plainTextToken;
    User::whereKey($examiner->id)->update(['is_active' => false]);

    $this->withToken($token)->getJson('/api/_test/examiner-only')
        ->assertForbidden()
        ->assertJsonPath('code', 'account_inactive');
});

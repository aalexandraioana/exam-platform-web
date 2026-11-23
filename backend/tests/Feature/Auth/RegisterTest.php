<?php

use App\Enums\MembershipStatus;
use App\Enums\Role;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function registration(array $overrides = []): array
{
    return array_merge([
        'name' => 'Ana Dumitru',
        'email' => 'Ana.Dumitru@Exemplu.ro',
        'password' => 'lalea-verde-48',
        'password_confirmation' => 'lalea-verde-48',
    ], $overrides);
}

it('creates an active candidate and returns a token, ignoring a role in the body', function () {
    $response = $this->postJson('/api/register', registration(['role' => 'administrator', 'is_active' => false]));

    $response->assertCreated()
        ->assertJsonPath('user.email', 'ana.dumitru@exemplu.ro')
        ->assertJsonPath('user.role', 'candidate')
        ->assertJsonPath('user.is_active', true)
        ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role', 'is_active']]);

    $user = User::sole();
    expect($user->role)->toBe(Role::Candidate)
        ->and($user->is_active)->toBeTrue()
        ->and($user->tokens()->count())->toBe(1);

    $this->withToken($response->json('token'))->getJson('/api/user')->assertOk();
});

it('refuses invalid registrations with an error code per field', function (array $overrides, string $field, string $code) {
    User::factory()->create(['email' => 'taken@exemplu.ro']);

    $this->postJson('/api/register', registration($overrides))
        ->assertUnprocessable()
        ->assertJsonPath("errors.$field.0", $code);

    expect(User::count())->toBe(1);
})->with([
    'missing name' => [['name' => ''], 'name', 'required'],
    'bad email' => [['email' => 'ana.dumitru@'], 'email', 'invalid'],
    'missing email' => [['email' => ''], 'email', 'required'],
    'short password' => [['password' => 'abc12', 'password_confirmation' => 'abc12'], 'password', 'too_short'],
    'missing password' => [['password' => '', 'password_confirmation' => ''], 'password', 'required'],
    'mismatch' => [['password_confirmation' => 'abc123456'], 'password', 'mismatch'],
    'email taken in another case' => [['email' => 'TAKEN@exemplu.ro'], 'email', 'taken'],
]);

it('creates a pending membership for a class code in any case, with or without the hyphen', function (string $typed) {
    $class = SchoolClass::factory()->create(['join_code' => 'K7Q4MX']);

    $this->postJson('/api/register', registration(['class_code' => $typed]))->assertCreated();

    $membership = User::where('role', Role::Candidate)->sole()->memberships()->sole();
    expect($membership->class_id)->toBe($class->id)
        ->and($membership->status)->toBe(MembershipStatus::Pending);
})->with(['K7Q4MX', 'k7q-4mx', ' K7Q-4MX ']);

it('refuses the registration when the class code matches no class (D-053)', function () {
    SchoolClass::factory()->create(['join_code' => 'K7Q4MX']);

    $this->postJson('/api/register', registration(['class_code' => 'K7Q-4NX']))
        ->assertUnprocessable()
        ->assertJsonPath('errors.class_code.0', 'not_found');

    expect(User::where('role', Role::Candidate)->count())->toBe(0);
});

it('treats an empty class code as no code', function () {
    $this->postJson('/api/register', registration(['class_code' => '']))->assertCreated();

    expect(User::sole()->memberships()->count())->toBe(0);
});

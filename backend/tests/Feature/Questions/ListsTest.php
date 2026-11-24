<?php

use App\Models\Competence;
use App\Models\Pool;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// C-004 · the Examiner's own competences, topics and pools: list and create (D-058, D-041, Q-053).

it('lists and creates competences, sorted by code', function () {
    $examiner = User::factory()->examiner()->create();
    Competence::factory()->for(User::factory()->examiner()->create(), 'examiner')->create(['code' => 'C1']);
    $this->withToken($examiner->createToken('spa')->plainTextToken);

    $this->postJson('/api/competences', ['code' => 'C2', 'description' => 'Folosește proporțiile directe'])
        ->assertCreated()->assertJsonPath('competence.code', 'C2');
    $this->postJson('/api/competences', ['code' => ' C1 ', 'description' => 'Compară numere întregi'])->assertCreated();

    $this->getJson('/api/competences')->assertOk()
        ->assertJsonPath('competences.*.code', ['C1', 'C2'])
        ->assertJsonPath('competences.0.description', 'Compară numere întregi');

    $this->postJson('/api/competences', ['code' => 'C2', 'description' => 'x'])->assertUnprocessable()->assertJsonPath('errors.code.0', 'taken');
    $this->postJson('/api/competences', [])->assertJsonPath('errors.code.0', 'required')->assertJsonPath('errors.description.0', 'required');
});

it('lists and creates topics and pools, names unique per Examiner', function (string $path, string $key, string $model) {
    $examiner = User::factory()->examiner()->create();
    $this->withToken($examiner->createToken('spa')->plainTextToken);

    $this->postJson("/api/{$path}", ['name' => 'Unghiuri'])->assertCreated()->assertJsonPath("{$key}.name", 'Unghiuri');
    $this->postJson("/api/{$path}", ['name' => 'Drepte'])->assertCreated();
    $this->getJson("/api/{$path}")->assertOk()->assertJsonPath("{$path}.*.name", ['Drepte', 'Unghiuri']);

    $this->postJson("/api/{$path}", ['name' => 'unghiuri'])->assertUnprocessable()->assertJsonPath('errors.name.0', 'taken');
    $this->postJson("/api/{$path}", ['name' => ''])->assertJsonPath('errors.name.0', 'required');
    expect($model::count())->toBe(2);
})->with([
    ['topics', 'topic', Topic::class],
    ['pools', 'pool', Pool::class],
]);

it('shows only the Examiner\'s own lists', function () {
    Topic::factory()->for(User::factory()->examiner()->create(), 'examiner')->create(['name' => 'Altcuiva']);
    $this->withToken(User::factory()->examiner()->create()->createToken('spa')->plainTextToken);

    $this->getJson('/api/topics')->assertOk()->assertJsonCount(0, 'topics');
    $this->getJson('/api/pools')->assertOk()->assertJsonCount(0, 'pools');
    $this->getJson('/api/competences')->assertOk()->assertJsonCount(0, 'competences');
});

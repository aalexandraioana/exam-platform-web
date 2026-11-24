<?php

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/*
| Feature tests run inside the Laravel application, against the PostgreSQL test
| database configured in phpunit.xml (never SQLite).
*/
pest()->extend(TestCase::class)
    ->in('Feature');

/**
 * Runs a statement the database must refuse. The inner transaction becomes a savepoint, so the
 * test's own transaction stays usable after the expected error.
 */
function expectRefused(callable $statement): void
{
    expect(fn () => DB::transaction($statement))->toThrow(QueryException::class);
}

/** Whether Postgres has an index whose definition starts with these columns. */
function hasIndexOn(string $table, string $columns): bool
{
    return DB::table('pg_indexes')
        ->where('tablename', $table)
        ->where('indexdef', 'like', "%USING btree ({$columns})%")
        ->exists();
}

/** A Ready short answer in $pool, matching the defaults of blueprintItem(). */
function poolQuestion(\App\Models\User $examiner, \App\Models\Pool $pool, array $attributes = []): \App\Models\Question
{
    $question = \App\Models\Question::factory()->ready()->for($examiner, 'examiner')->create(array_merge([
        'difficulty' => 'easy', 'grade_level' => 6, 'answer_key' => ['kind' => 'number', 'value' => '1'],
    ], $attributes));
    $pool->questions()->attach($question);

    return $question;
}

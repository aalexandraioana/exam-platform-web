<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

it('splits existing names at the last space when it runs', function () {
    $migration = require database_path('migrations/2026_11_23_120000_split_user_names.php');
    $migration->down(); // back to one `name` column, as on the live database before P2b
    expect(Schema::hasColumn('users', 'name'))->toBeTrue();

    foreach (['Maria Popa', 'Ana Maria Popescu', 'Admin'] as $i => $name) {
        DB::table('users')->insert(['name' => $name, 'email' => "u{$i}@example.test", 'password' => 'x']);
    }

    $migration->up();

    expect(Schema::hasColumn('users', 'name'))->toBeFalse()
        ->and(DB::table('users')->orderBy('email')->get(['first_name', 'last_name'])->map(fn ($u) => [$u->first_name, $u->last_name])->all())
        ->toBe([['Maria', 'Popa'], ['Ana Maria', 'Popescu'], ['Admin', '']]);
});

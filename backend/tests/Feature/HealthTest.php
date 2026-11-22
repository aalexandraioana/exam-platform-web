<?php

use Illuminate\Support\Facades\DB;

it('reports the API as healthy', function () {
    $this->getJson('/api/health')
        ->assertOk()
        ->assertExactJson(['status' => 'healthy', 'service' => 'exam-platform-api']);
});

it('runs the test suite against PostgreSQL', function () {
    expect(DB::connection()->getDriverName())->toBe('pgsql')
        ->and(DB::connection()->getDatabaseName())->toBe('exam_platform_test')
        ->and(DB::selectOne('select 1 as ok')->ok)->toBe(1);
});

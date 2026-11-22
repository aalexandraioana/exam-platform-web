<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;

it('runs, rolls back and runs again every migration', function () {
    expect(Artisan::call('migrate:fresh'))->toBe(0)
        ->and(Schema::hasTable('class_memberships'))->toBeTrue();

    expect(Artisan::call('migrate:reset'))->toBe(0)
        ->and(Schema::hasTable('users'))->toBeFalse()
        ->and(Schema::hasTable('competences'))->toBeFalse()
        ->and(Schema::hasTable('classes'))->toBeFalse()
        ->and(Schema::hasTable('class_memberships'))->toBeFalse();

    expect(Artisan::call('migrate'))->toBe(0)
        ->and(Schema::hasColumns('users', ['role', 'is_active']))->toBeTrue()
        ->and(Schema::hasTable('class_memberships'))->toBeTrue();
});

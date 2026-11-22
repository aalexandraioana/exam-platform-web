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
        ->and(Schema::hasTable('class_memberships'))->toBeFalse()
        ->and(Schema::hasTable('questions'))->toBeFalse()
        ->and(Schema::hasTable('pools'))->toBeFalse()
        ->and(Schema::hasTable('exams'))->toBeFalse();

    expect(Artisan::call('migrate'))->toBe(0)
        ->and(Schema::hasColumns('users', ['role', 'is_active']))->toBeTrue()
        ->and(Schema::hasTable('class_memberships'))->toBeTrue()
        ->and(Schema::hasTable('pools'))->toBeTrue()
        ->and(Schema::hasTable('pool_question'))->toBeTrue()
        ->and(Schema::hasTable('topic_labels'))->toBeTrue()
        ->and(Schema::hasTable('question_topic_label'))->toBeTrue()
        ->and(Schema::hasTable('questions'))->toBeTrue()
        ->and(Schema::hasTable('barem_steps'))->toBeTrue()
        ->and(Schema::hasTable('exams'))->toBeTrue()
        ->and(Schema::hasTable('class_exam'))->toBeTrue()
        ->and(Schema::hasTable('exam_items'))->toBeTrue();
});

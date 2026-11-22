<?php

use App\Enums\ScorePolicy;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * An unpublished Exam is a draft that needs only a title; P5 checks the rest before publishing.
     * The 10 baseline points are fixed by D-005, so they aren't stored.
     */
    public function up(): void
    {
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('examiner_id')->index()->constrained('users')->restrictOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('grade_level')->nullable();
            $table->unsignedSmallInteger('duration_minutes')->nullable();
            // From `available_from`, Attempts may start; after `available_until`, no new ones (D-021).
            $table->timestamp('available_from')->nullable();
            $table->timestamp('available_until')->nullable();
            $table->unsignedSmallInteger('max_attempts')->default(1);
            $table->enum('score_policy', ScorePolicy::values())->default(ScorePolicy::Highest->value);
            $table->timestamp('published_at')->nullable();
            $table->timestamp('results_published_at')->nullable();
            $table->text('cohort_note')->nullable();
            $table->timestamps();
        });

        $checks = [
            'exams_grade_level_check' => 'grade_level BETWEEN 5 AND 8',
            'exams_duration_check' => 'duration_minutes > 0',
            'exams_max_attempts_check' => 'max_attempts >= 1',
            'exams_window_check' => 'available_from IS NULL OR available_until IS NULL OR available_until > available_from',
            // Results are released only for a published Exam (D-019).
            'exams_results_after_publish_check' => 'results_published_at IS NULL OR published_at IS NOT NULL',
        ];
        foreach ($checks as $name => $condition) {
            DB::statement("ALTER TABLE exams ADD CONSTRAINT {$name} CHECK ({$condition})");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('exams');
    }
};

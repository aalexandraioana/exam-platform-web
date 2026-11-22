<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('examiner_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('grade_level', 32)->nullable();
            $table->integer('duration_minutes')->default(50);
            $table->decimal('baseline_points', 5, 2)->default(10.00); // 10p din oficiu per D-005
            $table->integer('max_attempts')->default(1); // configurable per D-012
            $table->string('score_aggregation', 16)->default('highest'); // highest, latest per D-012
            $table->timestamp('start_time')->nullable();
            $table->timestamp('end_time')->nullable();
            $table->boolean('is_published')->default(false);
            $table->timestamp('feedback_published_at')->nullable(); // per D-010
            $table->text('cohort_feedback')->nullable(); // single cohort note per D-010
            $table->timestamps();

            $table->index(['is_published', 'start_time', 'end_time']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exams');
    }
};

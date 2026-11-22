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
        Schema::create('attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->foreignId('candidate_id')->constrained('users')->cascadeOnDelete();
            $table->integer('attempt_number')->default(1);
            $table->bigInteger('seed');
            $table->string('status', 32)->default('started'); // started, in_progress, submitted, graded
            $table->timestamp('started_at');
            $table->timestamp('expires_at');
            $table->integer('grace_period_seconds')->default(30); // 30s network buffer per D-004
            $table->timestamp('submitted_at')->nullable();
            $table->decimal('subject_1_score', 5, 2)->default(0.00); // auto-graded binary max 30.00
            $table->decimal('subject_2_score', 5, 2)->default(0.00); // manual graded max 60.00
            $table->decimal('total_score', 5, 2)->default(10.00); // baseline (10.00) + S1 + S2 per D-005
            $table->timestamps();

            $table->unique(['exam_id', 'candidate_id', 'attempt_number']);
            $table->index(['candidate_id', 'status']);
            $table->index(['status', 'expires_at']); // used by scheduled auto-sealing job
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attempts');
    }
};

<?php

use App\Enums\AttemptStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One Candidate taking one Exam. The deadline is fixed at start (D-021), the Grace Period comes
     * from config (D-004), and the seed lets a contest reproduce the draw (D-043).
     */
    public function up(): void
    {
        Schema::create('attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->restrictOnDelete();
            $table->foreignId('candidate_id')->index()->constrained('users')->restrictOnDelete();
            $table->unsignedSmallInteger('attempt_number');
            $table->enum('status', AttemptStatus::values())->default(AttemptStatus::Started->value);
            $table->bigInteger('seed');
            $table->timestamp('started_at');
            $table->timestamp('expires_at');
            $table->timestamp('submitted_at')->nullable();
            $table->boolean('auto_submitted')->default(false);
            $table->decimal('subject_1_score', 5, 2)->nullable();
            $table->decimal('subject_2_score', 5, 2)->nullable();
            $table->decimal('total_score', 5, 2)->nullable();
            $table->timestamps();

            $table->unique(['exam_id', 'candidate_id', 'attempt_number']);
            // D-044 seals open Attempts past their deadline.
            $table->index(['status', 'expires_at']);
        });

        $checks = [
            'attempts_number_check' => 'attempt_number >= 1',
            'attempts_deadline_check' => 'expires_at > started_at',
            'attempts_submitted_time_check' => "status NOT IN ('submitted', 'graded') OR submitted_at IS NOT NULL",
            'attempts_graded_total_check' => "status <> 'graded' OR total_score IS NOT NULL",
            // D-005: Subject I is out of 30, Subject II out of 60, the total out of 100.
            'attempts_subject_1_score_check' => 'subject_1_score BETWEEN 0 AND 30',
            'attempts_subject_2_score_check' => 'subject_2_score BETWEEN 0 AND 60',
            'attempts_total_score_check' => 'total_score BETWEEN 0 AND 100',
        ];
        foreach ($checks as $name => $condition) {
            DB::statement("ALTER TABLE attempts ADD CONSTRAINT {$name} CHECK ({$condition})");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('attempts');
    }
};

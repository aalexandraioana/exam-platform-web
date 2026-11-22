<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The question drawn for each Item of an Attempt, with what the Candidate saw: the snapshot
     * (including the shuffled option order, D-045), the drawn values and the expected answer (D-006).
     */
    public function up(): void
    {
        Schema::create('attempt_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attempt_id')->constrained('attempts')->cascadeOnDelete();
            $table->foreignId('exam_item_id')->index()->constrained('exam_items')->restrictOnDelete();
            $table->foreignId('question_id')->index()->constrained('questions')->restrictOnDelete();
            $table->unsignedSmallInteger('position');
            $table->jsonb('question_snapshot');
            $table->jsonb('drawn_values')->nullable();
            $table->jsonb('expected_answer')->nullable();
            $table->timestamps();

            $table->unique(['attempt_id', 'exam_item_id']);
            // D-043: no question appears twice in the same Attempt.
            $table->unique(['attempt_id', 'question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attempt_items');
    }
};

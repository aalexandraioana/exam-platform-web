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
        Schema::create('responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attempt_id')->constrained('attempts')->cascadeOnDelete();
            $table->foreignId('question_id')->constrained('questions')->cascadeOnDelete();
            $table->jsonb('response_data')->default('{}');
            $table->string('uploaded_image_path', 512)->nullable(); // handwritten proof photo per D-011
            $table->integer('version')->default(1); // monotonic version for idempotent autosave
            $table->boolean('is_auto_graded')->default(false);
            $table->decimal('awarded_points', 5, 2)->nullable(); // binary for Subject 1; partial credit for Subject 2
            $table->text('examiner_comment')->nullable(); // private per-problem examiner feedback per D-010
            $table->foreignId('graded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('graded_at')->nullable();
            $table->timestamps();

            $table->unique(['attempt_id', 'question_id']);
            $table->index(['attempt_id', 'is_auto_graded']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('responses');
    }
};

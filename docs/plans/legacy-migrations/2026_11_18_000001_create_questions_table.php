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
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('examiner_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('content');
            $table->string('grade_level', 32)->default('grade_6');
            $table->string('section', 32); // subject_1, subject_2
            $table->string('type', 32); // dual_choice, single_choice, multiple_choice, short_answer, parameterized_numeric, structured_problem
            $table->boolean('is_parameterized')->default(false);
            $table->decimal('default_points', 5, 2)->default(5.00);
            $table->string('difficulty', 16); // easy, medium, hard
            $table->string('topic', 64);
            $table->text('solution_explanation')->nullable();
            $table->jsonb('metadata')->default('{}');
            $table->timestamps();

            $table->index(['section', 'grade_level']);
            $table->index(['topic', 'difficulty']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};

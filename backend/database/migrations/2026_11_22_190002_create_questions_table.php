<?php

use App\Enums\Difficulty;
use App\Enums\QuestionStatus;
use App\Enums\QuestionType;
use App\Enums\Section;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * An Examiner's bank is all their questions (D-041). A library entry is a frozen copy: a row
     * with published_to_library_at set and copied_from_id pointing to its source (D-040).
     */
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('examiner_id')->index()->constrained('users')->restrictOnDelete();
            $table->string('code', 32)->unique();
            $table->enum('section', Section::values());
            $table->enum('type', QuestionType::values());
            $table->enum('status', QuestionStatus::values())->default(QuestionStatus::Draft->value);
            $table->unsignedSmallInteger('grade_level')->nullable();
            $table->enum('difficulty', Difficulty::values())->nullable();
            $table->foreignId('competence_id')->nullable()->index()->constrained('competences')->restrictOnDelete();
            $table->decimal('points', 5, 2)->nullable();
            $table->text('statement')->nullable();
            $table->jsonb('answer_key')->nullable();
            $table->jsonb('parameters')->nullable();
            $table->boolean('uses_barem')->default(false);
            $table->text('explanation')->nullable();
            $table->timestamp('published_to_library_at')->nullable();
            $table->foreignId('copied_from_id')->nullable()->index()->constrained('questions')->nullOnDelete();
            $table->timestamps();
        });

        $checks = [
            'questions_grade_level_check' => 'grade_level BETWEEN 5 AND 8',
            'questions_points_check' => 'points >= 0',
            // structured_problem is the only Subject II type (README §5).
            'questions_type_matches_section_check' => "(section = 'subject_2') = (type = 'structured_problem')",
            // A Draft needs only section and type; Ready needs the rest (D-042).
            'questions_ready_complete_check' => "status <> 'ready' OR (statement IS NOT NULL AND points IS NOT NULL"
                .' AND competence_id IS NOT NULL AND grade_level IS NOT NULL AND difficulty IS NOT NULL)',
            'questions_barem_subject_two_check' => "NOT uses_barem OR section = 'subject_2'",
            'questions_library_ready_check' => "published_to_library_at IS NULL OR status = 'ready'",
        ];
        foreach ($checks as $name => $condition) {
            DB::statement("ALTER TABLE questions ADD CONSTRAINT {$name} CHECK ({$condition})");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};

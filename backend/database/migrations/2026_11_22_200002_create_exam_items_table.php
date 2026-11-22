<?php

use App\Enums\Difficulty;
use App\Enums\Section;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The blueprint: each Item draws one matching question from its pool per Attempt (D-043).
     * While the Exam is a draft, only position and section are required.
     */
    public function up(): void
    {
        Schema::create('exam_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->unsignedSmallInteger('position');
            $table->enum('section', Section::values());
            $table->foreignId('competence_id')->nullable()->index()->constrained('competences')->restrictOnDelete();
            $table->enum('difficulty', Difficulty::values())->nullable();
            $table->decimal('points', 5, 2)->nullable();
            $table->foreignId('pool_id')->nullable()->index()->constrained('pools')->restrictOnDelete();
            $table->timestamps();

            $table->unique(['exam_id', 'position']);
        });

        DB::statement('ALTER TABLE exam_items ADD CONSTRAINT exam_items_points_check CHECK (points > 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_items');
    }
};

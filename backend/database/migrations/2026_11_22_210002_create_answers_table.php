<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A Candidate's answer to one drawn question. `version` lets autosave ignore requests that arrive
     * out of order; the grading fields hold partial points, the adjustment and the private comment
     * (D-019, D-031).
     */
    public function up(): void
    {
        Schema::create('answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attempt_item_id')->unique()->constrained('attempt_items')->cascadeOnDelete();
            $table->jsonb('answer')->nullable();
            $table->unsignedInteger('version')->default(0);
            $table->timestamp('saved_at')->nullable();
            $table->boolean('marked_for_review')->default(false);
            $table->decimal('awarded_points', 5, 2)->nullable();
            $table->decimal('adjustment', 5, 2)->nullable();
            $table->text('comment')->nullable();
            $table->boolean('needs_recheck')->default(false);
            $table->foreignId('graded_by')->nullable()->index()->constrained('users')->restrictOnDelete();
            $table->timestamp('graded_at')->nullable();
            $table->timestamps();
        });

        DB::statement('ALTER TABLE answers ADD CONSTRAINT answers_version_check CHECK (version >= 0)');
        DB::statement('ALTER TABLE answers ADD CONSTRAINT answers_awarded_points_check CHECK (awarded_points >= 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('answers');
    }
};

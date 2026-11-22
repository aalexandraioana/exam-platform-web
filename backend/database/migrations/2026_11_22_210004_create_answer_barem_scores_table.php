<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** The points given for each barem step of an answer; recalculated when the barem changes (D-031). */
    public function up(): void
    {
        Schema::create('answer_barem_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('answer_id')->constrained('answers')->cascadeOnDelete();
            $table->foreignId('barem_step_id')->index()->constrained('barem_steps')->cascadeOnDelete();
            $table->decimal('points', 5, 2);
            $table->timestamps();

            $table->unique(['answer_id', 'barem_step_id']);
        });

        DB::statement('ALTER TABLE answer_barem_scores ADD CONSTRAINT answer_barem_scores_points_check CHECK (points >= 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('answer_barem_scores');
    }
};

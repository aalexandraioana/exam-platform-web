<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** The ordered steps of a Subject II barem (D-031); P4b checks that they add up to the question's points. */
    public function up(): void
    {
        Schema::create('barem_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained('questions')->cascadeOnDelete();
            $table->unsignedSmallInteger('position');
            $table->text('description');
            $table->decimal('points', 5, 2);
            $table->timestamps();

            $table->unique(['question_id', 'position']);
        });

        DB::statement('ALTER TABLE barem_steps ADD CONSTRAINT barem_steps_points_check CHECK (points >= 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('barem_steps');
    }
};

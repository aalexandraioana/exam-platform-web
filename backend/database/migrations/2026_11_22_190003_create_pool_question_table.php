<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** A question can be in several pools; deleting either side only removes the link (D-041). */
    public function up(): void
    {
        Schema::create('pool_question', function (Blueprint $table) {
            $table->foreignId('pool_id')->constrained('pools')->cascadeOnDelete();
            $table->foreignId('question_id')->index()->constrained('questions')->cascadeOnDelete();

            $table->primary(['pool_id', 'question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pool_question');
    }
};

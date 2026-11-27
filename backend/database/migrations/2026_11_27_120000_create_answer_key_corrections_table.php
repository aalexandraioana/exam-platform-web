<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// P8c · D-046, Q-087: each Subject I answer-key correction on a drawn question, with its effect.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('answer_key_corrections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->foreignId('examiner_id')->constrained('users');
            $table->jsonb('before');
            $table->jsonb('after');
            // Answers re-graded (in submitted or graded Attempts); running Attempts only get the new key.
            $table->unsignedInteger('answers');
            $table->timestamps();
            $table->index(['question_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('answer_key_corrections');
    }
};

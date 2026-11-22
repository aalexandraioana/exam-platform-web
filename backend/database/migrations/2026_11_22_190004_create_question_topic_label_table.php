<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** A question can have several topic labels (D-039). */
    public function up(): void
    {
        Schema::create('question_topic_label', function (Blueprint $table) {
            $table->foreignId('question_id')->constrained('questions')->cascadeOnDelete();
            $table->foreignId('topic_label_id')->index()->constrained('topic_labels')->cascadeOnDelete();

            $table->primary(['question_id', 'topic_label_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_topic_label');
    }
};

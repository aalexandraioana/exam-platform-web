<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * D-058: a question has exactly one topic (the topic labels become topics, the link table goes);
 * D-059: Ready also needs the topic. No question existed when this ran (P4b plan).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::drop('question_topic_label');
        Schema::rename('topic_labels', 'topics');
        DB::statement('ALTER INDEX topic_labels_examiner_id_name_unique RENAME TO topics_examiner_id_name_unique');

        Schema::table('questions', function (Blueprint $table) {
            $table->foreignId('topic_id')->nullable()->after('competence_id')->index()->constrained('topics')->restrictOnDelete();
        });

        DB::statement('ALTER TABLE questions DROP CONSTRAINT questions_ready_complete_check');
        DB::statement("ALTER TABLE questions ADD CONSTRAINT questions_ready_complete_check CHECK (status <> 'ready' OR (statement IS NOT NULL"
            .' AND points IS NOT NULL AND competence_id IS NOT NULL AND topic_id IS NOT NULL AND grade_level IS NOT NULL AND difficulty IS NOT NULL))');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE questions DROP CONSTRAINT questions_ready_complete_check');
        DB::statement("ALTER TABLE questions ADD CONSTRAINT questions_ready_complete_check CHECK (status <> 'ready' OR (statement IS NOT NULL"
            .' AND points IS NOT NULL AND competence_id IS NOT NULL AND grade_level IS NOT NULL AND difficulty IS NOT NULL))');

        Schema::table('questions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('topic_id');
        });

        DB::statement('ALTER INDEX topics_examiner_id_name_unique RENAME TO topic_labels_examiner_id_name_unique');
        Schema::rename('topics', 'topic_labels');
        Schema::create('question_topic_label', function (Blueprint $table) {
            $table->foreignId('question_id')->constrained('questions')->cascadeOnDelete();
            $table->foreignId('topic_label_id')->index()->constrained('topic_labels')->cascadeOnDelete();
            $table->primary(['question_id', 'topic_label_id']);
        });
    }
};

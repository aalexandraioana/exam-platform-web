<?php

use App\Enums\QuestionType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** D-057: an Item also matches a question type and a topic; null means "any". */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_items', function (Blueprint $table) {
            $table->enum('type', QuestionType::values())->nullable()->after('difficulty');
            $table->foreignId('topic_id')->nullable()->after('type')->index()->constrained('topics')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('exam_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('topic_id');
            $table->dropColumn('type');
        });
    }
};

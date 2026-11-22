<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The classes an Exam is published to; only their Candidates see it (D-015). A linked class can't
     * be deleted (Q-038): P3 unlinks draft Exams first, so a class with a published Exam stays.
     */
    public function up(): void
    {
        Schema::create('class_exam', function (Blueprint $table) {
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->foreignId('class_id')->index()->constrained('classes')->restrictOnDelete();

            $table->primary(['exam_id', 'class_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_exam');
    }
};

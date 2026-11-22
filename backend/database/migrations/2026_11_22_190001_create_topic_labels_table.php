<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Each Examiner's own descriptive labels, e.g. "Unghiuri" (D-039). */
    public function up(): void
    {
        Schema::create('topic_labels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('examiner_id')->constrained('users')->restrictOnDelete();
            $table->string('name', 100);
            $table->timestamps();
        });

        // "Unghiuri" and "unghiuri" are the same label for one Examiner.
        DB::statement('CREATE UNIQUE INDEX topic_labels_examiner_id_name_unique ON topic_labels (examiner_id, lower(name))');
    }

    public function down(): void
    {
        Schema::dropIfExists('topic_labels');
    }
};

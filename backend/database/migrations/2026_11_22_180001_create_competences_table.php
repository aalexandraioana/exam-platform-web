<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Each Examiner's own competences: a short code and what is assessed (D-039). */
    public function up(): void
    {
        Schema::create('competences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('examiner_id')->constrained('users')->restrictOnDelete();
            $table->string('code', 20);
            $table->text('description');
            $table->timestamps();

            $table->unique(['examiner_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('competences');
    }
};

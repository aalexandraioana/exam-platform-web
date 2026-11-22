<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Named groups of questions inside an Examiner's bank; Exam Items draw from them (D-041, D-043). */
    public function up(): void
    {
        Schema::create('pools', function (Blueprint $table) {
            $table->id();
            $table->foreignId('examiner_id')->constrained('users')->restrictOnDelete();
            $table->string('name', 100);
            $table->timestamps();

            $table->unique(['examiner_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pools');
    }
};

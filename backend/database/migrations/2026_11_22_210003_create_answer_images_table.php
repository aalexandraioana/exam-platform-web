<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Up to 3 handwritten-solution photos per Subject II answer (D-026). `path` is the storage key:
     * object storage in production, local disk in development (D-048).
     */
    public function up(): void
    {
        Schema::create('answer_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('answer_id')->constrained('answers')->cascadeOnDelete();
            $table->unsignedSmallInteger('position');
            $table->string('path');
            $table->string('original_name');
            $table->string('mime_type', 100);
            $table->unsignedInteger('size_bytes');
            $table->timestamps();

            $table->unique(['answer_id', 'position']);
        });

        DB::statement('ALTER TABLE answer_images ADD CONSTRAINT answer_images_position_check CHECK (position BETWEEN 1 AND 3)');
    }

    public function down(): void
    {
        Schema::dropIfExists('answer_images');
    }
};

<?php

use App\Enums\MembershipStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** A Candidate's place in a class; a rejected request keeps its row (D-028). */
    public function up(): void
    {
        Schema::create('class_memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('candidate_id')->constrained('users')->cascadeOnDelete();
            $table->enum('status', MembershipStatus::values())->default(MembershipStatus::Pending->value);
            $table->timestamp('requested_at')->useCurrent();
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();

            $table->unique(['class_id', 'candidate_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_memberships');
    }
};

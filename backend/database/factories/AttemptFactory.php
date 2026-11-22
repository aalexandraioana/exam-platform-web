<?php

namespace Database\Factories;

use App\Enums\AttemptStatus;
use App\Models\Attempt;
use App\Models\Exam;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * A just-started Attempt on a published Exam; states submit or grade it.
 *
 * @extends Factory<Attempt>
 */
class AttemptFactory extends Factory
{
    public function definition(): array
    {
        $startedAt = now();

        return [
            'exam_id' => Exam::factory()->published(),
            'candidate_id' => User::factory()->candidate(),
            'attempt_number' => 1,
            'seed' => fake()->numberBetween(1, PHP_INT_MAX),
            'started_at' => $startedAt,
            'expires_at' => $startedAt->copy()->addMinutes(50),
        ];
    }

    public function submitted(): static
    {
        return $this->state(fn () => ['status' => AttemptStatus::Submitted, 'submitted_at' => now()]);
    }

    public function autoSubmitted(): static
    {
        return $this->submitted()->state(fn () => ['auto_submitted' => true]);
    }

    public function graded(): static
    {
        return $this->state(fn () => [
            'status' => AttemptStatus::Graded,
            'submitted_at' => now(),
            'subject_1_score' => 25,
            'subject_2_score' => 40,
            'total_score' => 75,
        ]);
    }
}

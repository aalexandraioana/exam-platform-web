<?php

namespace Database\Factories;

use App\Models\Exam;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * An unpublished draft by default; states publish it and release its results.
 *
 * @extends Factory<Exam>
 */
class ExamFactory extends Factory
{
    public function definition(): array
    {
        return [
            'examiner_id' => User::factory()->examiner(),
            'title' => 'Evaluare '.fake()->words(3, true),
            'grade_level' => 6,
            'duration_minutes' => 50,
        ];
    }

    public function published(): static
    {
        return $this->state(fn () => ['published_at' => now()]);
    }

    public function resultsPublished(): static
    {
        return $this->published()->state(fn () => ['results_published_at' => now()]);
    }
}

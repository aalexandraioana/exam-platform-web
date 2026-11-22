<?php

namespace Database\Factories;

use App\Models\BaremStep;
use App\Models\Question;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BaremStep>
 */
class BaremStepFactory extends Factory
{
    public function definition(): array
    {
        return [
            'question_id' => Question::factory()->subjectTwo()->withBarem(),
            'position' => fake()->unique()->numberBetween(1, 1000),
            'description' => fake()->sentence(),
            'points' => 2,
        ];
    }
}

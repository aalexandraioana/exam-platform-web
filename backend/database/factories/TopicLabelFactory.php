<?php

namespace Database\Factories;

use App\Models\TopicLabel;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TopicLabel>
 */
class TopicLabelFactory extends Factory
{
    public function definition(): array
    {
        return [
            'examiner_id' => User::factory()->examiner(),
            'name' => fake()->unique()->words(2, true),
        ];
    }
}

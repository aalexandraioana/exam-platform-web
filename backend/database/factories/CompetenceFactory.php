<?php

namespace Database\Factories;

use App\Models\Competence;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Competence>
 */
class CompetenceFactory extends Factory
{
    public function definition(): array
    {
        return [
            'examiner_id' => User::factory()->examiner(),
            'code' => fake()->unique()->bothify('C##'),
            'description' => fake()->sentence(),
        ];
    }
}

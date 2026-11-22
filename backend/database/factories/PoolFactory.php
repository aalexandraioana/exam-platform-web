<?php

namespace Database\Factories;

use App\Models\Pool;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Pool>
 */
class PoolFactory extends Factory
{
    public function definition(): array
    {
        return [
            'examiner_id' => User::factory()->examiner(),
            'name' => fake()->unique()->words(3, true),
        ];
    }
}

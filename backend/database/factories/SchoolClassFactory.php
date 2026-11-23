<?php

namespace Database\Factories;

use App\Models\SchoolClass;
use App\Models\User;
use App\Support\JoinCode;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SchoolClass>
 */
class SchoolClassFactory extends Factory
{
    public function definition(): array
    {
        return [
            'examiner_id' => User::factory()->examiner(),
            'name' => 'Clasa a VI-a '.fake()->randomLetter(),
            'join_code' => JoinCode::generate(),
        ];
    }
}

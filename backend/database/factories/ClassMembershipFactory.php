<?php

namespace Database\Factories;

use App\Models\ClassMembership;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ClassMembership>
 */
class ClassMembershipFactory extends Factory
{
    public function definition(): array
    {
        return [
            'class_id' => SchoolClass::factory(),
            'candidate_id' => User::factory()->candidate(),
        ];
    }
}

<?php

namespace Database\Factories;

use App\Models\Answer;
use App\Models\AttemptItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Answer>
 */
class AnswerFactory extends Factory
{
    public function definition(): array
    {
        return [
            'attempt_item_id' => AttemptItem::factory(),
            'answer' => ['value' => '42'],
            'saved_at' => now(),
        ];
    }
}

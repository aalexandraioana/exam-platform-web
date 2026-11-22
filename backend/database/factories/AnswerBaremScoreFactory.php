<?php

namespace Database\Factories;

use App\Models\Answer;
use App\Models\AnswerBaremScore;
use App\Models\BaremStep;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AnswerBaremScore>
 */
class AnswerBaremScoreFactory extends Factory
{
    public function definition(): array
    {
        return [
            'answer_id' => Answer::factory(),
            'barem_step_id' => BaremStep::factory(),
            'points' => 2,
        ];
    }
}

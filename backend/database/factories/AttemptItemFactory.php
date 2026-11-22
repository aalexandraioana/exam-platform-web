<?php

namespace Database\Factories;

use App\Models\Attempt;
use App\Models\AttemptItem;
use App\Models\ExamItem;
use App\Models\Question;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * A question drawn for an Item of the same Exam, from the same Examiner's bank.
 *
 * @extends Factory<AttemptItem>
 */
class AttemptItemFactory extends Factory
{
    public function definition(): array
    {
        $examOf = fn (array $attributes) => Attempt::find($attributes['attempt_id'])->exam;

        return [
            'attempt_id' => Attempt::factory(),
            'exam_item_id' => fn (array $attributes) => ExamItem::factory()
                ->create(['exam_id' => $examOf($attributes)->id])->id,
            'question_id' => fn (array $attributes) => Question::factory()->ready()
                ->create(['examiner_id' => $examOf($attributes)->examiner_id])->id,
            'position' => fake()->unique()->numberBetween(1, 1000),
            'question_snapshot' => ['statement' => fake()->sentence().' …'],
            'expected_answer' => ['value' => '42'],
        ];
    }
}

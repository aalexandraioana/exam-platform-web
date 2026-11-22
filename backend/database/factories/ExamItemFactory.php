<?php

namespace Database\Factories;

use App\Enums\Difficulty;
use App\Enums\Section;
use App\Models\Competence;
use App\Models\Exam;
use App\Models\ExamItem;
use App\Models\Pool;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * A complete Subject I Item whose pool and competence belong to the Exam's Examiner.
 *
 * @extends Factory<ExamItem>
 */
class ExamItemFactory extends Factory
{
    public function definition(): array
    {
        $examinerOf = fn (array $attributes) => Exam::find($attributes['exam_id'])->examiner_id;

        return [
            'exam_id' => Exam::factory(),
            'position' => fake()->unique()->numberBetween(1, 1000),
            'section' => Section::SubjectOne,
            'difficulty' => Difficulty::Easy,
            'points' => 5,
            'competence_id' => fn (array $attributes) => Competence::factory()
                ->create(['examiner_id' => $examinerOf($attributes)])->id,
            'pool_id' => fn (array $attributes) => Pool::factory()
                ->create(['examiner_id' => $examinerOf($attributes)])->id,
        ];
    }
}

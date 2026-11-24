<?php

namespace Database\Factories;

use App\Enums\Difficulty;
use App\Enums\QuestionStatus;
use App\Enums\QuestionType;
use App\Enums\Section;
use App\Models\Competence;
use App\Models\Question;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * A Subject I Draft by default; states make it Ready, Subject II, barem-graded or a library entry.
 *
 * @extends Factory<Question>
 */
class QuestionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'examiner_id' => User::factory()->examiner(),
            'code' => fake()->unique()->regexify('M6-[A-Z]{2}-[0-9]{4}'),
            'section' => Section::SubjectOne,
            'type' => QuestionType::ShortAnswer,
            'statement' => fake()->sentence().' …',
        ];
    }

    /** Every field D-059 requires; the competence and topic belong to the same Examiner. */
    public function ready(): static
    {
        return $this->state(fn () => [
            'status' => QuestionStatus::Ready,
            'statement' => fake()->sentence().' …',
            'points' => 5,
            'grade_level' => 6,
            'difficulty' => Difficulty::Medium,
            'answer_key' => ['accepted' => ['42']],
            'competence_id' => fn (array $attributes) => Competence::factory()
                ->create(['examiner_id' => $attributes['examiner_id']])->id,
            'topic_id' => fn (array $attributes) => Topic::factory()
                ->create(['examiner_id' => $attributes['examiner_id']])->id,
        ]);
    }

    public function subjectTwo(): static
    {
        return $this->state(fn () => [
            'section' => Section::SubjectTwo,
            'type' => QuestionType::StructuredProblem,
            'answer_key' => null,
        ]);
    }

    public function withBarem(): static
    {
        return $this->state(fn () => ['uses_barem' => true]);
    }

    public function inLibrary(): static
    {
        return $this->state(fn () => [
            'code' => fake()->unique()->regexify('LIB-[A-Z]{2}-[0-9]{4}'),
            'published_to_library_at' => now(),
        ]);
    }
}

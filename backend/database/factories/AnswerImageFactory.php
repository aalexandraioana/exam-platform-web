<?php

namespace Database\Factories;

use App\Models\Answer;
use App\Models\AnswerImage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AnswerImage>
 */
class AnswerImageFactory extends Factory
{
    public function definition(): array
    {
        return [
            'answer_id' => Answer::factory(),
            'position' => 1,
            'path' => 'answers/'.fake()->uuid().'.jpg',
            'original_name' => 'IMG_2041.HEIC',
            'mime_type' => 'image/jpeg',
            'size_bytes' => 2_000_000,
        ];
    }
}

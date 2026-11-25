<?php

namespace App\Http\Requests\Exams;

use App\Enums\Difficulty;
use App\Enums\QuestionType;
use App\Enums\Section;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * An Item's criteria (D-057); `type` and `topic_id` null mean "any". The section is required when
 * adding an Item; ownership and the type/section fit are checked by the controller.
 */
class ItemRequest extends FormRequest
{
    public function rules(): array
    {
        $adding = $this->isMethod('post');

        return [
            'section' => [$adding ? 'required' : 'sometimes', Rule::enum(Section::class)],
            'points' => ['sometimes', 'nullable', 'numeric', 'gt:0', 'max:999.99'],
            'pool_id' => ['sometimes', 'nullable', 'integer'],
            'competence_id' => ['sometimes', 'nullable', 'integer'],
            'difficulty' => ['sometimes', 'nullable', Rule::enum(Difficulty::class)],
            'type' => ['sometimes', 'nullable', Rule::enum(QuestionType::class)],
            'topic_id' => ['sometimes', 'nullable', 'integer'],
        ];
    }

    public function messages(): array
    {
        return ['*.required' => 'required', '*' => 'invalid'];
    }
}

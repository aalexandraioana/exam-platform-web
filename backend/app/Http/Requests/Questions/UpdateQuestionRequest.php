<?php

namespace App\Http\Requests\Questions;

use App\Enums\Difficulty;
use App\Enums\QuestionType;
use App\Enums\Section;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * The editor's fields. The shapes of the answer key and the named values are checked by Readiness
 * (a Draft may be incomplete); here only their types. Ownership of the competence, topic and pools,
 * and the Subject II-only barem, are checked by the controller, which knows the question.
 */
class UpdateQuestionRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'section' => ['sometimes', Rule::enum(Section::class)],
            'type' => ['sometimes', Rule::enum(QuestionType::class)],
            'grade_level' => ['sometimes', 'nullable', 'integer', 'between:5,8'],
            'difficulty' => ['sometimes', 'nullable', Rule::enum(Difficulty::class)],
            'competence_id' => ['sometimes', 'nullable', 'integer'],
            'topic_id' => ['sometimes', 'nullable', 'integer'],
            'points' => ['sometimes', 'nullable', 'numeric', 'between:0,999.99'],
            'statement' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'explanation' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'answer_key' => ['sometimes', 'nullable', 'array'],
            'parameters' => ['sometimes', 'nullable', 'array'],
            'uses_barem' => ['sometimes', 'boolean'],
            'barem' => ['sometimes', 'nullable', 'array', 'max:30'],
            'barem.*.id' => ['sometimes', 'integer'],
            'barem.*.description' => ['required', 'string', 'max:2000'],
            'barem.*.points' => ['required', 'numeric', 'between:0,999.99'],
            'pool_ids' => ['sometimes', 'array'],
            'pool_ids.*' => ['integer'],
        ];
    }

    public function messages(): array
    {
        return ['*.required' => 'required', '*' => 'invalid'];
    }
}

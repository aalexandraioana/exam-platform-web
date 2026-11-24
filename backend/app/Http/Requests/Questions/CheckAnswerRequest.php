<?php

namespace App\Http\Requests\Questions;

use App\Enums\QuestionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** "Testează un răspuns": the unsaved answer key and a typed answer (D-017). */
class CheckAnswerRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(QuestionType::class)],
            'answer_key' => ['required', 'array'],
            'given' => ['present'],
            'expected' => ['nullable', 'integer'],
        ];
    }

    public function messages(): array
    {
        return ['*.required' => 'required', '*.present' => 'required', '*' => 'invalid'];
    }
}

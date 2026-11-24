<?php

namespace App\Http\Requests\Questions;

use App\Enums\QuestionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** The unsaved editor content for sample values (D-057). */
class PreviewRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(QuestionType::class)],
            'statement' => ['nullable', 'string', 'max:10000'],
            'options' => ['nullable', 'array', 'max:10'],
            'options.*' => ['nullable', 'string', 'max:1000'],
            'parameters' => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return ['*.required' => 'required', '*' => 'invalid'];
    }
}

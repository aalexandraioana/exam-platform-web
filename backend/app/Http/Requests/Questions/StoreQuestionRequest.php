<?php

namespace App\Http\Requests\Questions;

use App\Enums\QuestionType;
use App\Enums\Section;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/** A new Draft needs only its code, Subject and type (D-059, Q-054). */
class StoreQuestionRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge(['code' => trim((string) $this->input('code', ''))]);
    }

    public function rules(): array
    {
        return [
            'code' => CodeRules::rules(),
            'section' => ['required', Rule::enum(Section::class)],
            'type' => ['required', Rule::enum(QuestionType::class)],
        ];
    }

    public function messages(): array
    {
        return [...CodeRules::messages(), '*.required' => 'required', 'section.enum' => 'invalid', 'type.enum' => 'invalid'];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            if (! $validator->errors()->hasAny(['section', 'type']) && ! TypeFitsSection::check($this->input('section'), $this->input('type'))) {
                $validator->errors()->add('type', 'invalid');
            }
        }];
    }
}

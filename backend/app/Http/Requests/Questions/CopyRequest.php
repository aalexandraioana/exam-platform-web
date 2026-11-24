<?php

namespace App\Http\Requests\Questions;

use Illuminate\Foundation\Http\FormRequest;

/** Copying a library entry asks for the copy's own code (Q-054). */
class CopyRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge(['code' => trim((string) $this->input('code', ''))]);
    }

    public function rules(): array
    {
        return ['code' => CodeRules::rules()];
    }

    public function messages(): array
    {
        return CodeRules::messages();
    }
}

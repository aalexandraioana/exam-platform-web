<?php

namespace App\Http\Requests\Classes;

use App\Support\JoinCode;
use Illuminate\Foundation\Http\FormRequest;

class JoinRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge(['class_code' => JoinCode::normalise((string) $this->input('class_code', ''))]);
    }

    public function rules(): array
    {
        return ['class_code' => ['required', 'string', 'exists:classes,join_code']];
    }

    public function messages(): array
    {
        return ['class_code.required' => 'required', 'class_code.exists' => 'not_found'];
    }
}

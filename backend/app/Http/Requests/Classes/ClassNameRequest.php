<?php

namespace App\Http\Requests\Classes;

use Illuminate\Foundation\Http\FormRequest;

/** Creating or renaming a class; error messages are codes (PATTERN-005). */
class ClassNameRequest extends FormRequest
{
    public function rules(): array
    {
        return ['name' => ['required', 'string', 'max:255']];
    }

    public function messages(): array
    {
        return ['name.required' => 'required', 'name.max' => 'invalid', 'name.string' => 'invalid'];
    }
}

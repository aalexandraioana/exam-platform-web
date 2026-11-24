<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/** A temporary password the Administrator types (D-054). */
class SetPasswordRequest extends FormRequest
{
    public function rules(): array
    {
        return ['password' => ['required', 'string', 'min:8']];
    }

    public function messages(): array
    {
        return ['password.required' => 'required', 'password.min' => 'too_short'];
    }
}

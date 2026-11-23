<?php

namespace App\Http\Requests\Classes;

use Illuminate\Foundation\Http\FormRequest;

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

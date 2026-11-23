<?php

namespace App\Http\Requests\Auth;

use App\Support\JoinCode;
use Illuminate\Foundation\Http\FormRequest;

/** Candidate self-registration; error messages are the codes of docs/API.md, not sentences. */
class RegisterRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $code = JoinCode::normalise((string) $this->input('class_code', ''));

        $this->merge([
            'email' => strtolower(trim((string) $this->input('email', ''))),
            'class_code' => $code === '' ? null : $code,
        ]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            // D-053: a code that matches no class refuses the registration.
            'class_code' => ['nullable', 'string', 'exists:classes,join_code'],
        ];
    }

    public function messages(): array
    {
        return [
            '*.required' => 'required',
            'name.max' => 'invalid',
            'email.email' => 'invalid',
            'email.max' => 'invalid',
            'email.unique' => 'taken',
            'password.min' => 'too_short',
            'password.confirmed' => 'mismatch',
            'class_code.exists' => 'not_found',
        ];
    }
}

<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/** An Examiner account the Administrator creates, with a temporary password (D-054, D-055). */
class CreateExaminerRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'first_name' => trim((string) $this->input('first_name', '')),
            'last_name' => trim((string) $this->input('last_name', '')),
            'email' => strtolower(trim((string) $this->input('email', ''))),
        ]);
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ];
    }

    public function messages(): array
    {
        return [
            '*.required' => 'required',
            'first_name.max' => 'invalid',
            'last_name.max' => 'invalid',
            'email.email' => 'invalid',
            'email.max' => 'invalid',
            'email.unique' => 'taken',
            'password.min' => 'too_short',
        ];
    }
}

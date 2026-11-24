<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/** Only deactivation: an account is never reactivated (D-056). */
class UpdateUserRequest extends FormRequest
{
    public function rules(): array
    {
        return ['is_active' => ['required', 'boolean', 'declined']];
    }

    public function messages(): array
    {
        return ['is_active.required' => 'required', 'is_active.boolean' => 'invalid', 'is_active.declined' => 'invalid'];
    }
}

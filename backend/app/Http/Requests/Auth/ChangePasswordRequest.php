<?php

namespace App\Http\Requests\Auth;

use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;

/** The user's own password replacing a temporary one; it must differ from it (D-054). */
class ChangePasswordRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'password' => ['bail', 'required', 'string', 'min:8', 'confirmed', function (string $attribute, mixed $value, Closure $fail) {
                if (Hash::check((string) $value, $this->user()->password)) {
                    $fail('same_as_temporary');
                }
            }],
        ];
    }

    public function messages(): array
    {
        return ['password.required' => 'required', 'password.min' => 'too_short', 'password.confirmed' => 'mismatch'];
    }
}

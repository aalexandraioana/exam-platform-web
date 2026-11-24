<?php

namespace App\Http\Requests\Questions;

/** The rules of a question code (Q-054): typed once, unique, letters, digits and - _ . only. */
final class CodeRules
{
    /** At most 28, so a library entry's `LIB-` code still fits the 32-character column (D-040). */
    public const MAX = 28;

    public static function rules(): array
    {
        return ['required', 'string', 'max:'.self::MAX, 'regex:/^[A-Za-z0-9][A-Za-z0-9._-]*$/', 'unique:questions,code'];
    }

    public static function messages(): array
    {
        return ['code.required' => 'required', 'code.string' => 'invalid', 'code.max' => 'invalid', 'code.regex' => 'invalid', 'code.unique' => 'taken'];
    }
}

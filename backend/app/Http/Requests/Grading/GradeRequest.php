<?php

namespace App\Http\Requests\Grading;

use Illuminate\Foundation\Http\FormRequest;

/**
 * One Subject II grade (D-031): every barem step's points, or one score when the question has no
 * barem; an optional adjustment and a private comment (D-019). Whether steps or a score is needed,
 * and the limits, depend on the question and are checked by the controller.
 */
class GradeRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'steps' => ['sometimes', 'array', 'max:30'],
            'steps.*.id' => ['required', 'integer'],
            'steps.*.points' => ['required', 'numeric', 'min:0', 'max:999.99'],
            'points' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:999.99'],
            'adjustment' => ['sometimes', 'nullable', 'numeric', 'between:-999.99,999.99'],
            'comment' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ];
    }

    public function messages(): array
    {
        return ['*.required' => 'required', '*' => 'invalid'];
    }
}

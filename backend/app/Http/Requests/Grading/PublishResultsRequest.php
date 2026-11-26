<?php

namespace App\Http\Requests\Grading;

use Illuminate\Foundation\Http\FormRequest;

/** The one note the whole cohort sees with the results (D-019). */
class PublishResultsRequest extends FormRequest
{
    public function rules(): array
    {
        return ['cohort_note' => ['sometimes', 'nullable', 'string', 'max:5000']];
    }

    public function messages(): array
    {
        return ['*' => 'invalid'];
    }
}

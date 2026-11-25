<?php

namespace App\Http\Requests\Exams;

use Illuminate\Foundation\Http\FormRequest;

/** A new Exam starts as a draft with its title (C-005). */
class StoreExamRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge(['title' => trim((string) $this->input('title', ''))]);
    }

    public function rules(): array
    {
        return ['title' => ['required', 'string', 'max:255']];
    }

    public function messages(): array
    {
        return ['title.required' => 'required', 'title.*' => 'invalid'];
    }
}

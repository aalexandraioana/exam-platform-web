<?php

namespace App\Http\Requests\Questions;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** A new competence: a short code unique for this Examiner and what it assesses (D-058). */
class CompetenceRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge(['code' => trim((string) $this->input('code', '')), 'description' => trim((string) $this->input('description', ''))]);
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:20', Rule::unique('competences', 'code')->where('examiner_id', $this->user()->id)],
            'description' => ['required', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return ['*.required' => 'required', 'code.unique' => 'taken', '*' => 'invalid'];
    }
}

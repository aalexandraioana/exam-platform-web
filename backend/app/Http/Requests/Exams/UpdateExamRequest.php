<?php

namespace App\Http\Requests\Exams;

use App\Enums\ScorePolicy;
use App\Models\Exam;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/** The builder's settings (D-012, D-021): the classes must be the Examiner's, and the window must end after it starts. */
class UpdateExamRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'grade_level' => ['sometimes', 'nullable', 'integer', 'between:5,8'],
            'duration_minutes' => ['sometimes', 'nullable', 'integer', 'between:1,600'],
            'available_from' => ['sometimes', 'nullable', 'date'],
            'available_until' => ['sometimes', 'nullable', 'date'],
            'max_attempts' => ['sometimes', 'integer', 'between:1,20'],
            'score_policy' => ['sometimes', Rule::enum(ScorePolicy::class)],
            'class_ids' => ['sometimes', 'array'],
            'class_ids.*' => ['integer'],
        ];
    }

    public function messages(): array
    {
        return ['*.required' => 'required', '*' => 'invalid'];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            $errors = $validator->errors();
            $ids = $this->input('class_ids');
            if (is_array($ids) && ! $errors->has('class_ids')) {
                $ids = array_unique($ids);
                if ($this->user()->classes()->whereIn('id', $ids)->count() !== count($ids)) {
                    $errors->add('class_ids', 'invalid');
                }
            }

            $exam = Exam::where('examiner_id', $this->user()->id)->find($this->route('id'));
            $from = $this->has('available_from') ? $this->input('available_from') : $exam?->available_from;
            $until = $this->has('available_until') ? $this->input('available_until') : $exam?->available_until;
            if ($from && $until && ! $errors->hasAny(['available_from', 'available_until'])
                && rescue(fn () => Carbon::parse($until)->lte(Carbon::parse($from)), false, false)) {
                $errors->add('available_until', 'invalid');
            }
        }];
    }
}

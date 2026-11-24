<?php

namespace App\Http\Requests\Questions;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Validator;

/** A new topic or pool: a name unique for this Examiner, ignoring case (D-058, D-041). */
class NameRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge(['name' => trim((string) $this->input('name', ''))]);
    }

    public function rules(): array
    {
        return ['name' => ['required', 'string', 'max:100']];
    }

    public function messages(): array
    {
        return ['name.required' => 'required', 'name.*' => 'invalid'];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            $table = $this->is('api/topics') ? 'topics' : 'pools';
            $taken = DB::table($table)->where('examiner_id', $this->user()->id)
                ->whereRaw('lower(name) = lower(?)', [$this->input('name')])->exists();
            if (! $validator->errors()->has('name') && $taken) {
                $validator->errors()->add('name', 'taken');
            }
        }];
    }
}

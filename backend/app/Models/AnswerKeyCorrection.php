<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One Subject I answer-key correction on a drawn question (P8c, D-046, Q-087). Written by grading code only. */
class AnswerKeyCorrection extends Model
{
    protected function casts(): array
    {
        return ['before' => 'array', 'after' => 'array', 'answers' => 'integer'];
    }

    /** @return BelongsTo<User, $this> */
    public function examiner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'examiner_id');
    }
}

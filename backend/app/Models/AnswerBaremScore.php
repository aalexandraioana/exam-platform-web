<?php

namespace App\Models;

use Database\Factories\AnswerBaremScoreFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Points given for one barem step of an answer (D-031). Written by grading code only. */
class AnswerBaremScore extends Model
{
    /** @use HasFactory<AnswerBaremScoreFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return ['points' => 'decimal:2'];
    }

    /** @return BelongsTo<Answer, $this> */
    public function answer(): BelongsTo
    {
        return $this->belongsTo(Answer::class);
    }

    /** @return BelongsTo<BaremStep, $this> */
    public function baremStep(): BelongsTo
    {
        return $this->belongsTo(BaremStep::class);
    }
}

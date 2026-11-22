<?php

namespace App\Models;

use Database\Factories\AttemptItemFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * The question drawn for one Item of an Attempt and what the Candidate saw (D-006, D-043, D-045).
 * Written once by the attempt engine; nothing is mass-assignable.
 */
class AttemptItem extends Model
{
    /** @use HasFactory<AttemptItemFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'question_snapshot' => 'array',
            'drawn_values' => 'array',
            'expected_answer' => 'array',
        ];
    }

    /** @return BelongsTo<Attempt, $this> */
    public function attempt(): BelongsTo
    {
        return $this->belongsTo(Attempt::class);
    }

    /** @return BelongsTo<ExamItem, $this> */
    public function examItem(): BelongsTo
    {
        return $this->belongsTo(ExamItem::class);
    }

    /** @return BelongsTo<Question, $this> */
    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    /** @return HasOne<Answer, $this> */
    public function answer(): HasOne
    {
        return $this->hasOne(Answer::class);
    }
}

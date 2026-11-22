<?php

namespace App\Models;

use Database\Factories\AnswerFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A Candidate's answer to one drawn question. Only the Candidate's own input is fillable; the
 * autosave version and every grading field are set by trusted code (P6, P8).
 */
#[Fillable(['answer', 'marked_for_review'])]
class Answer extends Model
{
    /** @use HasFactory<AnswerFactory> */
    use HasFactory;

    /** Mirrors the database defaults. */
    protected $attributes = ['version' => 0, 'marked_for_review' => false, 'needs_recheck' => false];

    protected function casts(): array
    {
        return [
            'answer' => 'array',
            'version' => 'integer',
            'saved_at' => 'datetime',
            'marked_for_review' => 'boolean',
            'awarded_points' => 'decimal:2',
            'adjustment' => 'decimal:2',
            'needs_recheck' => 'boolean',
            'graded_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<AttemptItem, $this> */
    public function attemptItem(): BelongsTo
    {
        return $this->belongsTo(AttemptItem::class);
    }

    /** @return BelongsTo<User, $this> */
    public function grader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'graded_by');
    }

    /** @return HasMany<AnswerImage, $this> */
    public function images(): HasMany
    {
        return $this->hasMany(AnswerImage::class)->orderBy('position');
    }

    /** @return HasMany<AnswerBaremScore, $this> */
    public function baremScores(): HasMany
    {
        return $this->hasMany(AnswerBaremScore::class);
    }
}

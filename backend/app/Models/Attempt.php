<?php

namespace App\Models;

use App\Enums\AttemptStatus;
use Database\Factories\AttemptFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One Candidate taking one Exam. Nothing is mass-assignable: the status, deadline, seed and
 * scores are set only by the attempt engine (P6) and grading (P8).
 */
class Attempt extends Model
{
    /** @use HasFactory<AttemptFactory> */
    use HasFactory;

    /** Mirrors the database defaults. */
    protected $attributes = ['status' => 'started', 'auto_submitted' => false];

    protected function casts(): array
    {
        return [
            'status' => AttemptStatus::class,
            'attempt_number' => 'integer',
            'seed' => 'integer',
            'started_at' => 'datetime',
            'expires_at' => 'datetime',
            'submitted_at' => 'datetime',
            'auto_submitted' => 'boolean',
            'subject_1_score' => 'decimal:2',
            'subject_2_score' => 'decimal:2',
            'total_score' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<Exam, $this> */
    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    /** @return BelongsTo<User, $this> */
    public function candidate(): BelongsTo
    {
        return $this->belongsTo(User::class, 'candidate_id');
    }

    /** The drawn questions, in blueprint order. @return HasMany<AttemptItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(AttemptItem::class)->orderBy('position');
    }
}

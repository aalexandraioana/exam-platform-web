<?php

namespace App\Models;

use App\Enums\AttemptStatus;
use App\Support\Attempts\InvalidTransition;
use Carbon\CarbonInterface;
use Database\Factories\AttemptFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One Candidate taking one Exam. Nothing is mass-assignable: the status, deadline, seed and
 * scores are set only by the attempt engine (P6, `Support/Attempts`) and grading (P8).
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

    /**
     * The state machine (catalog P13, Q-068): started until the first saved answer, then
     * in_progress; submitted by the Candidate or sealed at the deadline; graded after grading (P8).
     */
    public const TRANSITIONS = [
        'started' => [AttemptStatus::InProgress, AttemptStatus::Submitted],
        'in_progress' => [AttemptStatus::Submitted],
        'submitted' => [AttemptStatus::Graded],
        'graded' => [],
    ];

    /** The only way the status changes; the caller saves. */
    public function moveTo(AttemptStatus $to): void
    {
        if (! in_array($to, self::TRANSITIONS[$this->status->value], true)) {
            throw new InvalidTransition($this->status, $to);
        }
        $this->status = $to;
    }

    public function isOpen(): bool
    {
        return in_array($this->status, [AttemptStatus::Started, AttemptStatus::InProgress], true);
    }

    /** The deadline plus the Grace Period (D-004, D-021): the last moment an answer is accepted. */
    public function acceptsAnswersUntil(): CarbonInterface
    {
        return $this->expires_at->copy()->addSeconds((int) config('attempts.grace_seconds'));
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

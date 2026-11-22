<?php

namespace App\Models;

use App\Enums\ScorePolicy;
use Database\Factories\ExamFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * An Exam and its blueprint (D-043). Publishing and releasing results set their timestamps through
 * trusted code only, after P5's and P8's checks.
 */
#[Fillable([
    'title', 'description', 'grade_level', 'duration_minutes', 'available_from', 'available_until',
    'max_attempts', 'score_policy', 'cohort_note',
])]
class Exam extends Model
{
    /** @use HasFactory<ExamFactory> */
    use HasFactory;

    /** Mirrors the database defaults (D-012). */
    protected $attributes = ['max_attempts' => 1, 'score_policy' => 'highest'];

    protected function casts(): array
    {
        return [
            'grade_level' => 'integer',
            'duration_minutes' => 'integer',
            'max_attempts' => 'integer',
            'score_policy' => ScorePolicy::class,
            'available_from' => 'datetime',
            'available_until' => 'datetime',
            'published_at' => 'datetime',
            'results_published_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function examiner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'examiner_id');
    }

    /** The blueprint, in order. @return HasMany<ExamItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(ExamItem::class)->orderBy('position');
    }

    /** @return BelongsToMany<SchoolClass, $this> */
    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(SchoolClass::class, 'class_exam', 'exam_id', 'class_id');
    }

    /** @return HasMany<Attempt, $this> */
    public function attempts(): HasMany
    {
        return $this->hasMany(Attempt::class);
    }
}

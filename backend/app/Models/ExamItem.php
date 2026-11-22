<?php

namespace App\Models;

use App\Enums\Difficulty;
use App\Enums\Section;
use Database\Factories\ExamItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** One blueprint Item: it fixes section, competence, difficulty and points, and draws from a pool (D-043). */
#[Fillable(['position', 'section', 'competence_id', 'difficulty', 'points', 'pool_id'])]
class ExamItem extends Model
{
    /** @use HasFactory<ExamItemFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'section' => Section::class,
            'difficulty' => Difficulty::class,
            'points' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<Exam, $this> */
    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    /** @return BelongsTo<Competence, $this> */
    public function competence(): BelongsTo
    {
        return $this->belongsTo(Competence::class);
    }

    /** @return BelongsTo<Pool, $this> */
    public function pool(): BelongsTo
    {
        return $this->belongsTo(Pool::class);
    }

    /** The questions drawn for this Item across Attempts. @return HasMany<AttemptItem, $this> */
    public function attemptItems(): HasMany
    {
        return $this->hasMany(AttemptItem::class);
    }
}

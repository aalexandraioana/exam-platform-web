<?php

namespace App\Models;

use App\Enums\Difficulty;
use App\Enums\QuestionType;
use App\Enums\Section;
use Database\Factories\ExamItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** One blueprint Item: section, points, pool, competence and difficulty, plus a type and a topic (null = any) (D-057). */
#[Fillable(['position', 'section', 'competence_id', 'difficulty', 'type', 'topic_id', 'points', 'pool_id'])]
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
            'type' => QuestionType::class,
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

    /** @return BelongsTo<Topic, $this> */
    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
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

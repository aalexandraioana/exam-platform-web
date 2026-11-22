<?php

namespace App\Models;

use App\Enums\Difficulty;
use App\Enums\QuestionStatus;
use App\Enums\QuestionType;
use App\Enums\Section;
use Database\Factories\QuestionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A question in an Examiner's bank (D-041), or a frozen library entry when published_to_library_at
 * is set (D-040). Only content is fillable: the owner, code, status and library fields are set by
 * trusted code.
 */
#[Fillable([
    'section', 'type', 'grade_level', 'difficulty', 'competence_id', 'points',
    'statement', 'answer_key', 'parameters', 'uses_barem', 'explanation',
])]
class Question extends Model
{
    /** @use HasFactory<QuestionFactory> */
    use HasFactory;

    /** Mirrors the database defaults, so a new question reads as a Draft without a barem. */
    protected $attributes = ['status' => 'draft', 'uses_barem' => false];

    protected function casts(): array
    {
        return [
            'section' => Section::class,
            'type' => QuestionType::class,
            'status' => QuestionStatus::class,
            'difficulty' => Difficulty::class,
            'grade_level' => 'integer',
            'points' => 'decimal:2',
            'answer_key' => 'array',
            'parameters' => 'array',
            'uses_barem' => 'boolean',
            'published_to_library_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function examiner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'examiner_id');
    }

    /** @return BelongsTo<Competence, $this> */
    public function competence(): BelongsTo
    {
        return $this->belongsTo(Competence::class);
    }

    /** For a library entry, the question it was published from; for a copy, the entry it came from. @return BelongsTo<Question, $this> */
    public function copiedFrom(): BelongsTo
    {
        return $this->belongsTo(Question::class, 'copied_from_id');
    }

    /** @return BelongsToMany<Pool, $this> */
    public function pools(): BelongsToMany
    {
        return $this->belongsToMany(Pool::class, 'pool_question');
    }

    /** @return BelongsToMany<TopicLabel, $this> */
    public function topicLabels(): BelongsToMany
    {
        return $this->belongsToMany(TopicLabel::class, 'question_topic_label');
    }

    /** @return HasMany<BaremStep, $this> */
    public function baremSteps(): HasMany
    {
        return $this->hasMany(BaremStep::class)->orderBy('position');
    }
}

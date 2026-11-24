<?php

namespace App\Models;

use Database\Factories\CompetenceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** What an Examiner wants to assess, e.g. "C1 · knows that the angles of a triangle add up to 180°" (D-058). */
#[Fillable(['code', 'description'])]
class Competence extends Model
{
    /** @use HasFactory<CompetenceFactory> */
    use HasFactory;

    /** @return BelongsTo<User, $this> */
    public function examiner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'examiner_id');
    }

    /** @return HasMany<Question, $this> */
    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }

    /** @return HasMany<ExamItem, $this> */
    public function examItems(): HasMany
    {
        return $this->hasMany(ExamItem::class);
    }
}

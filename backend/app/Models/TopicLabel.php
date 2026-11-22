<?php

namespace App\Models;

use Database\Factories\TopicLabelFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/** One of an Examiner's own descriptive labels, e.g. "Unghiuri"; it doesn't structure anything (D-039). */
#[Fillable(['name'])]
class TopicLabel extends Model
{
    /** @use HasFactory<TopicLabelFactory> */
    use HasFactory;

    /** @return BelongsTo<User, $this> */
    public function examiner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'examiner_id');
    }

    /** @return BelongsToMany<Question, $this> */
    public function questions(): BelongsToMany
    {
        return $this->belongsToMany(Question::class, 'question_topic_label');
    }
}

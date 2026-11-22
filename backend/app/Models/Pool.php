<?php

namespace App\Models;

use Database\Factories\PoolFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/** A named group of questions inside an Examiner's bank; Exam Items draw from it (D-041, D-043). */
#[Fillable(['name'])]
class Pool extends Model
{
    /** @use HasFactory<PoolFactory> */
    use HasFactory;

    /** @return BelongsTo<User, $this> */
    public function examiner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'examiner_id');
    }

    /** @return BelongsToMany<Question, $this> */
    public function questions(): BelongsToMany
    {
        return $this->belongsToMany(Question::class, 'pool_question');
    }
}

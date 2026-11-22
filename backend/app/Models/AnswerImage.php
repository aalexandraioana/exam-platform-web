<?php

namespace App\Models;

use Database\Factories\AnswerImageFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A handwritten-solution photo (D-026, D-048). Written by the upload code only. */
class AnswerImage extends Model
{
    /** @use HasFactory<AnswerImageFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return ['position' => 'integer', 'size_bytes' => 'integer'];
    }

    /** @return BelongsTo<Answer, $this> */
    public function answer(): BelongsTo
    {
        return $this->belongsTo(Answer::class);
    }
}

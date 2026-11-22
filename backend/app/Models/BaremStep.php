<?php

namespace App\Models;

use Database\Factories\BaremStepFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One step of a Subject II barem: what earns the points (D-031). */
#[Fillable(['position', 'description', 'points'])]
class BaremStep extends Model
{
    /** @use HasFactory<BaremStepFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return ['points' => 'decimal:2'];
    }

    /** @return BelongsTo<Question, $this> */
    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}

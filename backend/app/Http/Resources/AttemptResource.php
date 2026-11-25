<?php

namespace App\Http\Resources;

use App\Models\Attempt;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * C-006: an Attempt as its Candidate sees it. Only the snapshot's shown parts leave the server:
 * never the answer key, the option order, the drawn values or answer, the seed or a score (D-019).
 */
class AttemptResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var Attempt $attempt */
        $attempt = $this->resource;
        $attempt->loadMissing(['exam', 'items']);

        return [
            'id' => $attempt->id,
            'exam' => ['id' => $attempt->exam->id, 'title' => $attempt->exam->title],
            'status' => $attempt->status->value,
            'attempt_number' => $attempt->attempt_number,
            'started_at' => $attempt->started_at->toIso8601String(),
            'expires_at' => $attempt->expires_at->toIso8601String(),
            'server_time' => now()->toIso8601String(),
            'items' => $attempt->items->map(fn ($item) => [
                'position' => $item->position,
                'section' => $item->question_snapshot['section'],
                'type' => $item->question_snapshot['type'],
                'points' => QuestionResource::number($item->question_snapshot['points']),
                'statement' => $item->question_snapshot['statement'],
                'options' => $item->question_snapshot['options'],
            ])->all(),
        ];
    }
}

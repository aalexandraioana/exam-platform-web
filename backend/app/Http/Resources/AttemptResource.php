<?php

namespace App\Http\Resources;

use App\Http\Controllers\AttemptImageController;
use App\Models\Answer;
use App\Models\Attempt;
use App\Support\Attempts\Photos;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * C-006: an Attempt as its Candidate sees it. Only the snapshot's shown parts leave the server:
 * never the answer key, the option order, the drawn values or answer, the seed or a score (D-019).
 * The saved answers come back too, so a refresh or another device resumes where the Candidate was.
 */
class AttemptResource extends JsonResource
{
    /** The Candidate's own saved answer (P6b); never its grading fields. */
    public static function answer(Answer $answer): array
    {
        return [
            'value' => $answer->answer['value'] ?? null,
            'version' => $answer->version,
            'marked_for_review' => $answer->marked_for_review,
            'saved_at' => $answer->saved_at?->toIso8601String(),
        ];
    }

    public function toArray(Request $request): array
    {
        /** @var Attempt $attempt */
        $attempt = $this->resource;
        $attempt->loadMissing(['exam', 'items.answer.images']);

        return [
            'id' => $attempt->id,
            'exam' => ['id' => $attempt->exam->id, 'title' => $attempt->exam->title, 'max_attempts' => $attempt->exam->max_attempts],
            'status' => $attempt->status->value,
            'attempt_number' => $attempt->attempt_number,
            'started_at' => $attempt->started_at->toIso8601String(),
            'expires_at' => $attempt->expires_at->toIso8601String(),
            // D-004: answers still arriving until then are accepted (P7d retries until this moment).
            'accepts_answers_until' => $attempt->acceptsAnswersUntil()->toIso8601String(),
            'submitted_at' => $attempt->submitted_at?->toIso8601String(),
            'auto_submitted' => $attempt->auto_submitted,
            'server_time' => now()->toIso8601String(),
            // P6d: false in production until the object storage is set up (D-048).
            'photos_enabled' => Photos::enabled(),
            'items' => $attempt->items->map(fn ($item) => [
                'position' => $item->position,
                'section' => $item->question_snapshot['section'],
                'type' => $item->question_snapshot['type'],
                'points' => QuestionResource::number($item->question_snapshot['points']),
                'statement' => $item->question_snapshot['statement'],
                'options' => $item->question_snapshot['options'],
                'answer' => $item->answer ? self::answer($item->answer) : null,
                'images' => $item->question_snapshot['type'] === 'structured_problem'
                    ? ($item->answer?->images ?? collect())->map(fn ($image) => AttemptImageController::image($image))->values()->all()
                    : null,
            ])->all(),
        ];
    }
}

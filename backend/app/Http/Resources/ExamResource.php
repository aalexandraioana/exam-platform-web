<?php

namespace App\Http\Resources;

use App\Models\Exam;
use App\Support\Exams\Blueprint;
use App\Support\Exams\PublishChecks;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** C-005: an Exam with its settings, Items (each with how many questions it may draw) and checks. */
class ExamResource extends JsonResource
{
    /** The fields the Examene list shows. */
    public static function summary(Exam $exam): array
    {
        return [
            'id' => $exam->id,
            'title' => $exam->title,
            'status' => $exam->isPublished() ? 'published' : 'draft',
            'grade_level' => $exam->grade_level,
            'available_from' => $exam->available_from?->toIso8601String(),
            'available_until' => $exam->available_until?->toIso8601String(),
            'published_at' => $exam->published_at?->toIso8601String(),
            'classes' => $exam->classes->sortBy('name')->values()->map(fn ($c) => ['id' => $c->id, 'name' => $c->name])->all(),
            'item_count' => $exam->items->count(),
        ];
    }

    public function toArray(Request $request): array
    {
        /** @var Exam $exam */
        $exam = $this->resource;
        $exam->load(['classes', 'items.pool', 'items.competence', 'items.topic']);

        return [
            ...self::summary($exam),
            'description' => $exam->description,
            'duration_minutes' => $exam->duration_minutes,
            'max_attempts' => $exam->max_attempts,
            'score_policy' => $exam->score_policy->value,
            'class_ids' => $exam->classes->pluck('id')->sort()->values()->all(),
            'items' => $exam->items->map(fn ($item) => [
                'id' => $item->id,
                'position' => $item->position,
                'section' => $item->section->value,
                'points' => QuestionResource::number($item->points),
                'pool' => $item->pool ? $item->pool->only('id', 'name') : null,
                'competence' => $item->competence ? $item->competence->only('id', 'code', 'description') : null,
                'difficulty' => $item->difficulty?->value,
                'type' => $item->type?->value,
                'topic' => $item->topic ? $item->topic->only('id', 'name') : null,
                'eligible' => count(Blueprint::eligible($item->setRelation('exam', $exam))),
            ])->all(),
            'checks' => PublishChecks::for($exam),
            // D-019 (P8a): the cohort note is the Examiner's here; Candidates see it only after publication.
            'results_published_at' => $exam->results_published_at?->toIso8601String(),
            'cohort_note' => $exam->cohort_note,
        ];
    }
}

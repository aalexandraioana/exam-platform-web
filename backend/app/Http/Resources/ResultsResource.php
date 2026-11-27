<?php

namespace App\Http\Resources;

use App\Enums\AttemptStatus;
use App\Enums\QuestionType;
use App\Enums\ScorePolicy;
use App\Http\Controllers\AttemptImageController;
use App\Models\Attempt;
use App\Models\AttemptItem;
use App\Models\Exam;
use Illuminate\Support\Collection;

/**
 * C-006 (P8b): a Candidate's own results, built only after publication (D-019). Subject I items carry
 * the correct answer in the order the Candidate saw the options (D-045) and the question's
 * explanation (Q-082); Subject II problems carry the comment, the adjustment and the barem steps
 * earned (Q-083). Every submitted Attempt is listed with the counted one marked (D-012, Q-084); no
 * class statistics (Q-085).
 */
final class ResultsResource
{
    /** The Candidate's handed-in Attempts at the Exam, by number. */
    public static function attempts(Exam $exam, int $candidateId): Collection
    {
        return $exam->attempts()->where('candidate_id', $candidateId)
            ->whereIn('status', [AttemptStatus::Submitted, AttemptStatus::Graded])
            ->orderBy('attempt_number')->get();
    }

    /** The Attempt whose grade counts under the score policy: the highest total, or the latest. */
    public static function counted(Exam $exam, Collection $attempts): ?Attempt
    {
        return $exam->score_policy === ScorePolicy::Latest
            ? $attempts->sortByDesc('attempt_number')->first()
            : $attempts->sortByDesc(fn (Attempt $a) => (float) $a->total_score)->first();
    }

    /** The grade (1–10): the total, Baseline Points included, divided by 10. */
    public static function grade(?Attempt $attempt): ?float
    {
        return $attempt?->total_score === null ? null : round((float) $attempt->total_score / 10, 2);
    }

    public static function make(Exam $exam, int $candidateId): array
    {
        $attempts = self::attempts($exam, $candidateId);
        $attempts->load(['items.answer.images', 'items.answer.baremScores', 'items.question.baremSteps']);
        $counted = self::counted($exam, $attempts);

        return [
            'exam' => [
                'id' => $exam->id,
                'title' => $exam->title,
                'score_policy' => $exam->score_policy->value,
                'results_published_at' => $exam->results_published_at->toIso8601String(),
                'cohort_note' => $exam->cohort_note,
            ],
            'attempts' => $attempts->map(fn (Attempt $attempt) => [
                'id' => $attempt->id,
                'attempt_number' => $attempt->attempt_number,
                'submitted_at' => $attempt->submitted_at?->toIso8601String(),
                'auto_submitted' => $attempt->auto_submitted,
                'subject_1_score' => QuestionResource::number($attempt->subject_1_score),
                'subject_2_score' => QuestionResource::number($attempt->subject_2_score),
                'total_score' => QuestionResource::number($attempt->total_score),
                'grade' => self::grade($attempt),
                'counted' => $counted?->is($attempt) ?? false,
                'items' => $attempt->items->sortBy('position')->values()->map(fn (AttemptItem $item) => self::item($item))->all(),
            ])->values()->all(),
        ];
    }

    private static function item(AttemptItem $item): array
    {
        $snapshot = $item->question_snapshot;
        $answer = $item->answer;
        $base = [
            'position' => $item->position,
            'section' => $snapshot['section'],
            'type' => $snapshot['type'],
            'points' => QuestionResource::number($snapshot['points']),
            'statement' => $snapshot['statement'],
            'options' => $snapshot['options'] ?? [],
            'answer' => $answer?->answer['value'] ?? null,
            'awarded_points' => QuestionResource::number($answer?->awarded_points ?? 0),
        ];

        if ($snapshot['section'] === 'subject_1') {
            return [...$base, 'correct' => self::correct($item), 'explanation' => $item->question?->explanation];
        }

        $earned = $answer ? $answer->baremScores->pluck('points', 'barem_step_id') : collect();
        $usesBarem = (bool) $item->question?->uses_barem;

        return [
            ...$base,
            'images' => ($answer?->images ?? collect())->map(fn ($image) => AttemptImageController::image($image))->values()->all(),
            'adjustment' => QuestionResource::number($answer?->adjustment),
            'comment' => $answer?->comment,
            'uses_barem' => $usesBarem,
            'barem' => $usesBarem ? $item->question->baremSteps->sortBy('position')->values()->map(fn ($step) => [
                'description' => $step->description,
                'points' => QuestionResource::number($step->points),
                'earned' => QuestionResource::number($earned[$step->id] ?? 0),
            ])->all() : [],
        ];
    }

    /** The correct answer as the Candidate saw it: shown option positions, true/false, or the expected value. */
    private static function correct(AttemptItem $item): mixed
    {
        $expected = $item->expected_answer ?? [];
        $key = $expected['answer_key'] ?? [];
        $order = $expected['option_order'] ?? [];
        // Original position p is shown at position (index of p in option_order) + 1.
        $shown = fn (int $p) => ($i = array_search($p, $order, true)) === false ? null : $i + 1;

        return match (QuestionType::tryFrom($item->question_snapshot['type'])) {
            QuestionType::SingleChoice => isset($key['correct']) ? $shown((int) $key['correct']) : null,
            QuestionType::MultipleChoice => collect((array) ($key['correct'] ?? []))->map(fn ($p) => $shown((int) $p))->filter()->sort()->values()->all(),
            QuestionType::DualChoice => $key['correct'] ?? null,
            default => isset($expected['answer'])
                ? (string) QuestionResource::number($expected['answer'])
                : ($key['value'] ?? ($key['accepted'][0] ?? null)),
        };
    }
}

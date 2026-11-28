<?php

namespace App\Http\Controllers;

use App\Enums\AttemptStatus;
use App\Models\Exam;
use App\Support\Attempts\Starter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * C-009 (P11): read-only overviews computed on every read. The Examiner's dashboard over their own
 * exams (DS-006) and the Administrator's list of every exam (DS-012, Q-098), with no Candidate data.
 */
class OverviewController extends Controller
{
    public function examinerDashboard(Request $request): JsonResponse
    {
        // D-004: an Attempt takes answers until its deadline plus the grace period; an expired one
        // that isn't sealed yet (D-044) is no longer in progress.
        $cutoff = now()->subSeconds((int) config('attempts.grace_seconds'));
        $exams = $request->user()->exams()->whereNotNull('published_at')->withCount([
            'attempts as in_progress' => fn (Builder $q) => $q
                ->whereIn('status', [AttemptStatus::Started, AttemptStatus::InProgress])
                ->where('expires_at', '>', $cutoff),
            'attempts as awaiting_grading' => fn (Builder $q) => $q->where('status', AttemptStatus::Submitted),
        ])->orderByDesc('id')->get()->each(fn (Exam $e) => $e->setAttribute('state', Starter::state($e)));

        $attention = $exams->filter(fn (Exam $e) => $e->state === 'open' || $e->awaiting_grading > 0)
            ->sortBy(fn (Exam $e) => $e->state === 'open' ? 0 : 1)->values();

        return response()->json([
            'counts' => [
                'active_exams' => $exams->where('state', 'open')->count(),
                'attempts_in_progress' => (int) $exams->sum('in_progress'),
                'awaiting_grading' => (int) $exams->sum('awaiting_grading'),
            ],
            'exams' => $attention->map(fn (Exam $e) => [
                'id' => $e->id,
                'title' => $e->title,
                'state' => $e->state,
                'available_until' => $e->available_until?->toIso8601String(),
                'in_progress' => $e->in_progress,
                'awaiting_grading' => $e->awaiting_grading,
                'results_published' => $e->results_published_at !== null,
            ])->all(),
        ]);
    }

    public function adminExams(): JsonResponse
    {
        $exams = Exam::with(['examiner', 'classes'])->withCount([
            'attempts as submitted' => fn (Builder $q) => $q->whereIn('status', [AttemptStatus::Submitted, AttemptStatus::Graded]),
            'attempts as graded' => fn (Builder $q) => $q->where('status', AttemptStatus::Graded),
        ])->orderByDesc('id')->get();

        return response()->json(['exams' => $exams->map(fn (Exam $e) => [
            'id' => $e->id,
            'title' => $e->title,
            'examiner' => ['id' => $e->examiner->id, 'name' => $e->examiner->name],
            'status' => $e->isPublished() ? 'published' : 'draft',
            'state' => $e->isPublished() ? Starter::state($e) : null,
            'available_from' => $e->available_from?->toIso8601String(),
            'available_until' => $e->available_until?->toIso8601String(),
            'results_published_at' => $e->results_published_at?->toIso8601String(),
            'classes' => $e->classes->sortBy('name')->values()->map(fn ($c) => ['id' => $c->id, 'name' => $c->name])->all(),
            'attempts' => ['submitted' => $e->submitted, 'graded' => $e->graded],
        ])->all()]);
    }
}

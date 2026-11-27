<?php

namespace App\Http\Controllers;

use App\Enums\MembershipStatus;
use App\Http\Resources\AttemptResource;
use App\Http\Resources\ResultsResource;
use App\Support\Attempts\Sealer;
use App\Support\Attempts\Starter;
use App\Support\Attempts\StartRefused;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** C-006: the Candidate's exams and starting an Attempt (D-012, D-015, D-021, P6a; dashboard fields P7a). */
class CandidateExamController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $candidate = $request->user();
        Sealer::sealExpired($candidate); // D-044
        $exams = Starter::examsFor($candidate)
            ->with(['attempts' => fn ($q) => $q->where('candidate_id', $candidate->id), 'items.topic'])
            ->orderByRaw('available_from IS NULL, available_from')->orderBy('id')->get();

        // The dashboard's empty states: no class, a request waiting, or no exam yet (P7a).
        $requests = $candidate->memberships()->selectRaw('status, count(*) as n')->groupBy('status')->pluck('n', 'status');

        return response()->json([
            'server_time' => now()->toIso8601String(),
            'classes' => [
                'accepted' => (int) ($requests[MembershipStatus::Accepted->value] ?? 0),
                'pending' => (int) ($requests[MembershipStatus::Pending->value] ?? 0),
            ],
            'exams' => $exams->map(function ($exam) use ($candidate) {
                $state = Starter::state($exam);
                $open = $exam->attempts->first(fn ($a) => in_array($a->status, Starter::OPEN, true));
                $used = $exam->attempts->count();

                return [
                    'id' => $exam->id,
                    'title' => $exam->title,
                    'description' => $exam->description,
                    'duration_minutes' => $exam->duration_minutes,
                    'available_from' => $exam->available_from?->toIso8601String(),
                    'available_until' => $exam->available_until?->toIso8601String(),
                    'max_attempts' => $exam->max_attempts,
                    'attempts_used' => $used,
                    'state' => $state,
                    'open_attempt_id' => $open?->id,
                    'open_attempt' => $open ? [
                        'id' => $open->id,
                        'started_at' => $open->started_at->toIso8601String(),
                        'expires_at' => $open->expires_at->toIso8601String(),
                    ] : null,
                    // D-019: "submitted, awaiting grading" until results are published.
                    'submitted' => $exam->attempts->contains(fn ($a) => ! in_array($a->status, Starter::OPEN, true)),
                    // Q-069: only the topics; Items with "any" topic add none.
                    'topics' => $exam->items->pluck('topic.name')->filter()->unique()->values()->all(),
                    'item_counts' => [
                        'subject_1' => $exam->items->where('section.value', 'subject_1')->count(),
                        'subject_2' => $exam->items->where('section.value', 'subject_2')->count(),
                    ],
                    'can_start' => $state === 'open' && ! $open && $used < $exam->max_attempts,
                    'results_published' => $exam->results_published_at !== null,
                    // P8b: the counted grade, only once the results are published (D-012, D-019).
                    'grade' => $exam->results_published_at === null ? null
                        : ResultsResource::grade(ResultsResource::counted($exam, ResultsResource::attempts($exam, $candidate->id))),
                ];
            }),
        ]);
    }

    public function start(Request $request, int $id): JsonResponse
    {
        $exam = Starter::examsFor($request->user())->findOrFail($id);
        Sealer::sealExpired($request->user()); // an expired Attempt no longer blocks a new start
        try {
            $attempt = Starter::start($request->user(), $exam);
        } catch (StartRefused $refused) {
            return response()->json(array_filter([
                'code' => $refused->reason,
                'message' => 'The attempt cannot start.',
                'attempt_id' => $refused->attemptId,
            ], fn ($v) => $v !== null), 409);
        }

        return response()->json(['attempt' => new AttemptResource($attempt)], 201);
    }
}

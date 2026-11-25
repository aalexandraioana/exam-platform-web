<?php

namespace App\Http\Controllers;

use App\Http\Resources\AttemptResource;
use App\Support\Attempts\Starter;
use App\Support\Attempts\StartRefused;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** C-006: the Candidate's exams and starting an Attempt (D-012, D-015, D-021, P6a). */
class CandidateExamController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $candidate = $request->user();
        $exams = Starter::examsFor($candidate)->with(['attempts' => fn ($q) => $q->where('candidate_id', $candidate->id)])
            ->orderByRaw('available_from IS NULL, available_from')->orderBy('id')->get();

        return response()->json(['exams' => $exams->map(function ($exam) {
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
                'can_start' => $state === 'open' && ! $open && $used < $exam->max_attempts,
                'results_published' => $exam->results_published_at !== null,
            ];
        })]);
    }

    public function start(Request $request, int $id): JsonResponse
    {
        $exam = Starter::examsFor($request->user())->findOrFail($id);
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

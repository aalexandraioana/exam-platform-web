<?php

namespace App\Http\Controllers;

use App\Http\Resources\ResultsResource;
use App\Support\Attempts\Sealer;
use App\Support\Attempts\Starter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** C-006 (P8b): the Candidate's own results of an Exam, only once the Examiner published them (D-019). */
class CandidateResultsController extends Controller
{
    public function show(Request $request, int $id): JsonResponse
    {
        $candidate = $request->user();
        $exam = Starter::examsFor($candidate)->findOrFail($id);
        Sealer::sealExpired($candidate); // D-044
        if ($exam->results_published_at === null) {
            return response()->json(['code' => 'results_not_published', 'message' => 'The results are not published yet.'], 409);
        }

        return response()->json(ResultsResource::make($exam, $candidate->id));
    }
}

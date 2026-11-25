<?php

namespace App\Http\Controllers;

use App\Http\Resources\AttemptResource;
use App\Models\Attempt;
use App\Support\Attempts\AttemptClosed;
use App\Support\Attempts\Saver;
use App\Support\Attempts\Sealer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * C-006: a Candidate's own Attempt: read, autosave, submit. Another Candidate's is a 404. Each
 * request seals the Candidate's expired Attempts first (D-044).
 */
class AttemptController extends Controller
{
    public function show(Request $request, int $id): JsonResponse
    {
        return response()->json(['attempt' => new AttemptResource($this->own($request, $id))]);
    }

    public function save(Request $request, int $id, int $position): JsonResponse
    {
        $attempt = $this->own($request, $id);
        $item = $attempt->items()->where('position', $position)->firstOrFail();
        $data = $request->validate([
            'answer' => ['present'],
            'marked_for_review' => ['sometimes', 'boolean'],
            'version' => ['required', 'integer', 'min:1'],
        ]);
        if (! Saver::fits($item, $data['answer'])) {
            return response()->json(['code' => 'invalid_answer', 'message' => 'The answer does not fit this question.'], 422);
        }

        try {
            $saved = Saver::save($attempt, $item, $data['answer'], (bool) ($data['marked_for_review'] ?? false), (int) $data['version']);
        } catch (AttemptClosed $closed) {
            return response()->json(['code' => $closed->reason, 'message' => 'The attempt takes no more answers.'], 409);
        }

        return response()->json([
            'answer' => AttemptResource::answer($saved['answer']),
            'applied' => $saved['applied'],
            'status' => $saved['status']->value,
        ]);
    }

    public function submit(Request $request, int $id): JsonResponse
    {
        return response()->json(['attempt' => new AttemptResource(Sealer::submit($this->own($request, $id)))]);
    }

    private function own(Request $request, int $id): Attempt
    {
        $attempt = $request->user()->attempts()->findOrFail($id);
        Sealer::sealExpired($request->user());

        return $attempt->refresh();
    }
}

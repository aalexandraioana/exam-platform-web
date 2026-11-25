<?php

namespace App\Http\Controllers;

use App\Http\Resources\AttemptResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** C-006: a Candidate's own Attempt. Another Candidate's is a 404. */
class AttemptController extends Controller
{
    public function show(Request $request, int $id): JsonResponse
    {
        $attempt = $request->user()->attempts()->findOrFail($id);

        return response()->json(['attempt' => new AttemptResource($attempt)]);
    }
}

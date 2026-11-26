<?php

namespace App\Http\Controllers;

use App\Models\AnswerImage;
use App\Models\Attempt;
use App\Support\Attempts\PhotoRefused;
use App\Support\Attempts\Photos;
use App\Support\Attempts\Sealer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** C-006 · Subject II photos of the Candidate's own Attempt (P6d, D-026, D-048). */
class AttemptImageController extends Controller
{
    public function store(Request $request, int $id, int $position): JsonResponse
    {
        $attempt = $this->own($request, $id);
        $item = $attempt->items()->where('position', $position)->firstOrFail();
        $file = $request->file('image');
        if (! $file) {
            return response()->json(['code' => 'image_type', 'message' => 'Send one image.'], 422);
        }

        try {
            $image = Photos::add($attempt, $item, $file);
        } catch (PhotoRefused $refused) {
            return response()->json(['code' => $refused->reason, 'message' => 'The photo was not added.'], $refused->status);
        }

        return response()->json(['image' => self::image($image)], 201);
    }

    public function destroy(Request $request, int $id, int $position, int $imageId): Response|JsonResponse
    {
        $attempt = $this->own($request, $id);
        $item = $attempt->items()->where('position', $position)->firstOrFail();
        $image = AnswerImage::whereKey($imageId)->whereHas('answer', fn ($q) => $q->where('attempt_item_id', $item->id))->firstOrFail();

        try {
            Photos::remove($attempt, $image);
        } catch (PhotoRefused $refused) {
            return response()->json(['code' => $refused->reason, 'message' => 'The photo was not removed.'], $refused->status);
        }

        return response()->noContent();
    }

    public function show(Request $request, int $id, int $imageId): StreamedResponse
    {
        $attempt = $request->user()->attempts()->findOrFail($id);
        $image = AnswerImage::whereKey($imageId)
            ->whereHas('answer.attemptItem', fn ($q) => $q->where('attempt_id', $attempt->id))
            ->firstOrFail();

        return Storage::response($image->path, $image->original_name, ['Content-Type' => $image->mime_type, 'Cache-Control' => 'private, max-age=3600']);
    }

    /** @return array{id: int, position: int, name: string, size: int} */
    public static function image(AnswerImage $image): array
    {
        return ['id' => $image->id, 'position' => $image->position, 'name' => $image->original_name, 'size' => $image->size_bytes];
    }

    private function own(Request $request, int $id): Attempt
    {
        $attempt = $request->user()->attempts()->findOrFail($id);
        Sealer::sealExpired($request->user());

        return $attempt->refresh();
    }
}

<?php

namespace App\Http\Controllers;

use App\Enums\QuestionStatus;
use App\Http\Requests\Questions\CopyRequest;
use App\Http\Resources\QuestionResource;
use App\Models\Question;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * C-004: the shared library (D-027). Publishing makes a frozen copy coded `LIB-<code>` (D-040),
 * once per question; there is no withdrawing (Q-058). Copying makes an independent question in the
 * copier's bank, with the code they type (Q-054), bringing the competence and topic into their lists.
 */
class LibraryController extends Controller
{
    private const COPIED_FIELDS = ['section', 'type', 'status', 'grade_level', 'difficulty', 'points', 'statement', 'answer_key', 'parameters', 'uses_barem', 'explanation'];

    public function index(Request $request): JsonResponse
    {
        $entries = Question::query()->whereNotNull('published_to_library_at')
            ->with(['competence', 'topic', 'examiner'])->orderBy('code')->get();
        $copies = Question::query()->where('examiner_id', $request->user()->id)
            ->whereIn('copied_from_id', $entries->pluck('id'))->pluck('code', 'copied_from_id');

        return response()->json(['entries' => $entries->map(fn ($e) => $this->entry($e, $copies[$e->id] ?? null))]);
    }

    public function publish(Request $request, int $id): JsonResponse
    {
        $source = QuestionController::bank($request)->findOrFail($id);
        if ($source->status !== QuestionStatus::Ready) {
            return response()->json(['message' => 'The given data was invalid.', 'errors' => ['status' => ['not_ready']]], 422);
        }
        if (Question::where('copied_from_id', $source->id)->whereNotNull('published_to_library_at')->exists()) {
            return response()->json(['code' => 'already_published', 'message' => 'This question is already in the library.'], 409);
        }

        $entry = DB::transaction(function () use ($source) {
            $entry = $this->duplicate($source, 'LIB-'.$source->code, $source->examiner_id, $source->competence_id, $source->topic_id);
            $entry->published_to_library_at = now();
            $entry->save();

            return $entry;
        });

        return response()->json(['entry' => $this->entry($entry->load(['competence', 'topic', 'examiner']), null)], 201);
    }

    public function copy(CopyRequest $request, int $id): JsonResponse
    {
        $entry = Question::whereNotNull('published_to_library_at')->with(['competence', 'topic'])->findOrFail($id);
        $user = $request->user();

        $copy = DB::transaction(function () use ($entry, $user, $request) {
            // D-040: the entry's competence (by code) and topic (by name) join the copier's lists.
            $competence = $entry->competence
                ? $user->competences()->firstOrCreate(['code' => $entry->competence->code], ['description' => $entry->competence->description])
                : null;
            $topic = null;
            if ($entry->topic) {
                $topic = $user->topics()->whereRaw('lower(name) = lower(?)', [$entry->topic->name])->first()
                    ?? $user->topics()->create(['name' => $entry->topic->name]);
            }
            $copy = $this->duplicate($entry, $request->validated('code'), $user->id, $competence?->id, $topic?->id);
            $copy->save();

            return $copy;
        });

        $copy->load(['competence', 'topic', 'pools', 'baremSteps', 'copiedFrom']);

        return response()->json(['question' => new QuestionResource($copy)], 201);
    }

    /** A new row with the source's content and barem; it remembers the source (copied_from_id). */
    private function duplicate(Question $source, string $code, int $examinerId, ?int $competenceId, ?int $topicId): Question
    {
        $copy = new Question;
        foreach (self::COPIED_FIELDS as $field) {
            $copy->{$field} = $source->{$field};
        }
        $copy->code = $code;
        $copy->examiner_id = $examinerId;
        $copy->competence_id = $competenceId;
        $copy->topic_id = $topicId;
        $copy->copied_from_id = $source->id;
        $copy->save();
        foreach ($source->baremSteps as $step) {
            $copy->baremSteps()->create($step->only('position', 'description', 'points'));
        }

        return $copy;
    }

    private function entry(Question $e, ?string $copiedAs): array
    {
        return [
            'id' => $e->id,
            'code' => $e->code,
            'section' => $e->section->value,
            'type' => $e->type->value,
            'grade_level' => $e->grade_level,
            'difficulty' => $e->difficulty?->value,
            'statement' => $e->statement,
            'competence' => $e->competence?->only('code', 'description'),
            'topic' => $e->topic ? ['name' => $e->topic->name] : null,
            'author' => $e->examiner->name,
            'copied_as' => $copiedAs,
        ];
    }
}

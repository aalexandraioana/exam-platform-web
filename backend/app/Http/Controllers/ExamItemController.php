<?php

namespace App\Http\Controllers;

use App\Enums\Section;
use App\Http\Requests\Exams\ItemRequest;
use App\Http\Requests\Questions\TypeFitsSection;
use App\Http\Resources\ExamResource;
use App\Models\Exam;
use App\Support\Exams\Blueprint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * C-005: the blueprint's Items (D-057). Each change answers with the whole Exam, so the checks and
 * the counts stay current. Items of a published Exam don't change (Q-060).
 */
class ExamItemController extends Controller
{
    public function store(ItemRequest $request, int $id): JsonResponse
    {
        $exam = ExamController::find($request, $id);
        if ($exam->isPublished()) {
            return ExamController::published();
        }
        $data = $this->checked($request, $request->validated(), null, null);
        $exam->items()->create([...$data, 'position' => ($exam->items()->max('position') ?? 0) + 1]);

        return response()->json(['exam' => new ExamResource($exam->refresh())], 201);
    }

    public function update(ItemRequest $request, int $id, int $itemId): JsonResponse
    {
        $exam = ExamController::find($request, $id);
        $item = $exam->items()->findOrFail($itemId);
        if ($exam->isPublished()) {
            return ExamController::published();
        }
        $item->update($this->checked($request, $request->validated(), $item->section->value, $item->points));

        return response()->json(['exam' => new ExamResource($exam->refresh())]);
    }

    public function destroy(Request $request, int $id, int $itemId): JsonResponse
    {
        $exam = ExamController::find($request, $id);
        $item = $exam->items()->findOrFail($itemId);
        if ($exam->isPublished()) {
            return ExamController::published();
        }
        DB::transaction(function () use ($exam, $item) {
            $item->delete();
            $this->renumber($exam, $exam->items()->pluck('id')->all());
        });

        return response()->json(['exam' => new ExamResource($exam->refresh())]);
    }

    public function order(Request $request, int $id): JsonResponse
    {
        $exam = ExamController::find($request, $id);
        if ($exam->isPublished()) {
            return ExamController::published();
        }
        $ids = $request->input('item_ids');
        $current = $exam->items()->pluck('id')->sort()->values()->all();
        if (! is_array($ids) || collect($ids)->sort()->values()->all() !== $current) {
            throw ValidationException::withMessages(['item_ids' => ['invalid']]);
        }
        DB::transaction(fn () => $this->renumber($exam, $ids));

        return response()->json(['exam' => new ExamResource($exam->refresh())]);
    }

    /** The live count of the Item dialog, for unsaved criteria. */
    public function match(ItemRequest $request, int $id): JsonResponse
    {
        $exam = ExamController::find($request, $id);

        return response()->json(['count' => count(Blueprint::eligibleFor($exam, $request->validated()))]);
    }

    /** Positions 1..n in this order; moved out of the way first so the unique key never clashes. */
    private function renumber(Exam $exam, array $ids): void
    {
        $exam->items()->update(['position' => DB::raw('position + 10000')]);
        foreach (array_values($ids) as $i => $itemId) {
            $exam->items()->whereKey($itemId)->update(['position' => $i + 1]);
        }
    }

    /** The pool, competence and topic must be the Examiner's; the type must fit the Subject. */
    private function checked(Request $request, array $data, ?string $section, mixed $points): array
    {
        $examinerId = $request->user()->id;
        $errors = [];
        foreach (['pool_id' => 'pools', 'competence_id' => 'competences', 'topic_id' => 'topics'] as $field => $table) {
            if (isset($data[$field]) && ! DB::table($table)->where('id', $data[$field])->where('examiner_id', $examinerId)->exists()) {
                $errors[$field] = ['invalid'];
            }
        }
        $section = $data['section'] ?? $section;
        if (isset($data['type']) && ! TypeFitsSection::check($section, $data['type'])) {
            $errors['type'] = ['invalid'];
        }
        // D-062: a Subject II Item is worth 20 points (or none yet, while it is a draft).
        $points = array_key_exists('points', $data) ? $data['points'] : $points;
        if ($section === Section::SubjectTwo->value && $points !== null && (float) $points !== (float) Section::SUBJECT_TWO_POINTS) {
            $errors['points'] = ['invalid'];
        }
        if ($errors) {
            throw ValidationException::withMessages($errors);
        }

        return $data;
    }
}

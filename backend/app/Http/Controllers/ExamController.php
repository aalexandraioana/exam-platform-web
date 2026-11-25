<?php

namespace App\Http\Controllers;

use App\Http\Requests\Exams\StoreExamRequest;
use App\Http\Requests\Exams\UpdateExamRequest;
use App\Http\Resources\ExamResource;
use App\Models\Exam;
use App\Models\Question;
use App\Support\Exams\Blueprint;
use App\Support\Exams\PublishChecks;
use App\Support\Math\ValueDrawer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

/**
 * C-005: the Examiner's own exams (D-012, D-015, D-021, D-057). Another Examiner's exam is a 404.
 * Once published, only the title, the description and the end of the window change (Q-060), and
 * the exam can't be deleted (Q-061).
 */
class ExamController extends Controller
{
    private const EDITABLE_WHEN_PUBLISHED = ['title', 'description', 'available_until'];

    public function index(Request $request): JsonResponse
    {
        $exams = $request->user()->exams()->with(['classes', 'items'])->orderByDesc('id')->get();

        return response()->json(['exams' => $exams->map(fn ($e) => ExamResource::summary($e))]);
    }

    public function store(StoreExamRequest $request): JsonResponse
    {
        $exam = $request->user()->exams()->create($request->validated());

        return response()->json(['exam' => new ExamResource($exam->refresh())], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        return response()->json(['exam' => new ExamResource(self::find($request, $id))]);
    }

    public function update(UpdateExamRequest $request, int $id): JsonResponse
    {
        $exam = self::find($request, $id);
        $data = $request->validated();
        if ($exam->isPublished() && array_diff(array_keys($data), self::EDITABLE_WHEN_PUBLISHED)) {
            return self::published();
        }

        DB::transaction(function () use ($exam, $data) {
            $exam->update(collect($data)->except('class_ids')->all());
            if (array_key_exists('class_ids', $data)) {
                $exam->classes()->sync($data['class_ids']);
            }
        });

        return response()->json(['exam' => new ExamResource($exam->refresh())]);
    }

    public function destroy(Request $request, int $id): Response|JsonResponse
    {
        $exam = self::find($request, $id);
        if ($exam->isPublished()) {
            return self::published();
        }
        DB::transaction(function () use ($exam) {
            $exam->classes()->detach();
            $exam->delete();
        });

        return response()->noContent();
    }

    public function publish(Request $request, int $id): JsonResponse
    {
        $exam = self::find($request, $id);
        if ($exam->isPublished()) {
            return self::published();
        }
        if ($problems = PublishChecks::for($exam)['problems']) {
            return self::notPublishable($problems);
        }
        $exam->published_at = now();
        $exam->save();

        return response()->json(['exam' => new ExamResource($exam)]);
    }

    /** One draw as a Candidate would get it: every Item its own question, values filled (D-057, D-006). */
    public function preview(Request $request, int $id): JsonResponse
    {
        $exam = self::find($request, $id);
        $seed = random_int(1, PHP_INT_MAX >> 8);
        $assignment = Blueprint::assign($exam, $seed);
        if ($assignment === null) {
            return self::notPublishable(PublishChecks::for($exam)['problems']);
        }

        $questions = Question::findMany(array_values($assignment))->keyBy('id');
        $items = $exam->items()->get()->map(function ($item) use ($assignment, $questions, $seed, $exam) {
            $question = $questions[$assignment[$item->id]];
            $options = array_map('strval', (array) ($question->answer_key['options'] ?? []));
            $drawn = ['values' => (object) [], 'statement' => $question->statement, 'options' => $options, 'answer' => null];
            if (! empty($question->parameters)) {
                $draw = ValueDrawer::draw($question->type, (string) $question->statement, $question->parameters, $seed + $item->position, $options);
                $drawn = ['values' => $draw->values, 'statement' => $draw->statement, 'options' => $draw->options, 'answer' => $draw->answer];
            }

            return [
                'item_id' => $item->id,
                'position' => $item->position,
                'question_id' => $question->id,
                'code' => $question->code,
                'competence' => $item->competence?->code,
                'eligible' => count(Blueprint::eligible($item->setRelation('exam', $exam))),
                ...$drawn,
            ];
        });

        return response()->json(['items' => $items]);
    }

    public static function find(Request $request, int $id): Exam
    {
        return $request->user()->exams()->findOrFail($id);
    }

    public static function published(): JsonResponse
    {
        return response()->json(['code' => 'exam_published', 'message' => 'The exam is published.'], 409);
    }

    private static function notPublishable(array $problems): JsonResponse
    {
        return response()->json([
            'message' => 'The given data was invalid.',
            'errors' => ['status' => ['not_publishable']],
            'problems' => $problems,
        ], 422);
    }
}

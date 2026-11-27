<?php

namespace App\Http\Controllers;

use App\Enums\QuestionStatus;
use App\Enums\QuestionType;
use App\Enums\Section;
use App\Http\Requests\Questions\CheckAnswerRequest;
use App\Http\Requests\Questions\PreviewRequest;
use App\Http\Requests\Questions\StoreQuestionRequest;
use App\Http\Requests\Questions\TypeFitsSection;
use App\Http\Requests\Questions\UpdateQuestionRequest;
use App\Http\Resources\QuestionResource;
use App\Models\BaremStep;
use App\Models\Question;
use App\Support\Grading\Scorer;
use App\Support\Math\AnswerMatcher;
use App\Support\Math\NoValidDraw;
use App\Support\Math\ValueDefinitions;
use App\Support\Math\ValueDrawer;
use App\Support\Questions\NotReady;
use App\Support\Questions\Readiness;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * C-004: the Examiner's own bank (D-041, D-059). Questions are looked up through the signed-in
 * Examiner, so another Examiner's question, or a library entry, is a 404.
 */
class QuestionController extends Controller
{
    private const FILTERS = ['competence_id', 'topic_id', 'type', 'section', 'grade_level', 'difficulty', 'status'];

    public function index(Request $request): JsonResponse
    {
        $query = $this->bank($request)->with(['competence', 'topic', 'pools'])->orderBy('code');
        foreach (self::FILTERS as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->query($filter));
            }
        }
        if ($request->filled('pool_id')) {
            $query->whereHas('pools', fn (Builder $q) => $q->where('pools.id', $request->query('pool_id')));
        }
        if ($request->filled('search')) {
            $like = '%'.addcslashes((string) $request->query('search'), '%_\\').'%';
            $query->where(fn (Builder $q) => $q->where('code', 'ilike', $like)->orWhere('statement', 'ilike', $like));
        }

        return response()->json(['questions' => $query->get()->map(fn ($q) => QuestionResource::summary($q))]);
    }

    public function store(StoreQuestionRequest $request): JsonResponse
    {
        // Fillable content only; the owner and the code are set here (Q-054).
        $question = new Question($request->only('section', 'type'));
        $question->examiner_id = $request->user()->id;
        $question->code = $request->validated('code');
        $question->save();

        return $this->answer($question->refresh(), 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        return $this->answer($this->find($request, $id));
    }

    public function update(UpdateQuestionRequest $request, int $id): JsonResponse
    {
        $question = $this->find($request, $id);
        $data = $request->validated();
        $this->checkOwnership($request, $data, $question);
        $regraded = null;

        try {
            $question = DB::transaction(function () use ($question, $data, &$regraded) {
                // PATTERN-007: the exams that drew it, then the question itself, before the lock check
                // and the barem read, so a publication or a grade running now is waited for (D-031, D-046).
                Scorer::lockExamsOf($question->id);
                $question = Question::lockForUpdate()->findOrFail($question->id);
                $this->checkLocks($question, $data);
                $usedBarem = $question->uses_barem;
                $question->fill(collect($data)->except(['barem', 'pool_ids'])->all());
                // C-004 (P8a): a step sent with its id keeps its row, so the scores given on it stay.
                $current = $question->baremSteps->keyBy('id');
                $steps = array_key_exists('barem', $data)
                    ? collect(array_values($data['barem'] ?? []))->map(function ($step, $i) use ($current) {
                        $model = isset($step['id']) ? $current[$step['id']] : new BaremStep;
                        $model->fill(['position' => $i + 1, 'description' => $step['description'], 'points' => $step['points']]);

                        return $model;
                    })
                    : null;
                if ($steps !== null) {
                    $question->setRelation('baremSteps', $steps);
                }
                // Q-057: a Ready question must stay complete; checked before anything is written,
                // so the Examiner gets the checklist, not the database's refusal.
                if ($question->status === QuestionStatus::Ready && ($problems = Readiness::problems($question))) {
                    throw new NotReady($problems);
                }

                $question->save();
                if ($steps !== null) {
                    $regraded = $this->saveBarem($question, $steps);
                }
                // Q-086: answers graded with one score go back to the queue to be graded on the new barem.
                if (! $usedBarem && $question->uses_barem) {
                    $flagged = Scorer::flagForBarem($question);
                    $regraded = ['answers' => $regraded['answers'] ?? 0, 'flagged' => ($regraded['flagged'] ?? 0) + $flagged];
                }
                if (array_key_exists('pool_ids', $data)) {
                    $question->pools()->sync($data['pool_ids']);
                }

                return $question->fresh();
            });
        } catch (NotReady $e) {
            return $this->notReady($e->problems);
        }

        return $this->answer($question, 200, $regraded === null ? [] : ['regraded' => $regraded]);
    }

    public function ready(Request $request, int $id): JsonResponse
    {
        $question = $this->find($request, $id);
        if ($problems = Readiness::problems($question)) {
            return $this->notReady($problems);
        }
        $question->status = QuestionStatus::Ready;
        $question->save();

        return $this->answer($question);
    }

    public function draft(Request $request, int $id): JsonResponse
    {
        $question = $this->find($request, $id);
        $question->status = QuestionStatus::Draft;
        $question->save();

        return $this->answer($question);
    }

    public function destroy(Request $request, int $id): Response|JsonResponse
    {
        $question = $this->find($request, $id);
        // Q-056: results point to a question an Attempt has drawn.
        if ($question->attemptItems()->exists()) {
            return response()->json(['code' => 'question_drawn', 'message' => 'An Attempt has drawn this question.'], 409);
        }
        $question->delete();

        return response()->noContent();
    }

    /** Sample values for the unsaved editor content (D-057, P4a). */
    public function preview(PreviewRequest $request): JsonResponse
    {
        $type = QuestionType::from($request->validated('type'));
        $statement = (string) $request->validated('statement');
        $options = array_map('strval', $request->validated('options') ?? []);
        $parameters = $request->validated('parameters') ?? [];

        $problems = ValueDefinitions::problems($type, $statement, $parameters, $options);
        $samples = [];
        if (! $problems && $parameters) {
            try {
                for ($i = 0; $i < 3; $i++) {
                    $draw = ValueDrawer::draw($type, $statement, $parameters, random_int(1, PHP_INT_MAX), $options);
                    $samples[] = ['values' => $draw->values, 'statement' => $draw->statement, 'options' => $draw->options, 'answer' => $draw->answer];
                }
            } catch (NoValidDraw) {
                $problems = [['code' => 'no_valid_draw']];
                $samples = [];
            }
        }

        return response()->json(['problems' => $problems, 'samples' => $samples]);
    }

    /** "Testează un răspuns" on the unsaved answer key (D-017). */
    public function checkAnswer(CheckAnswerRequest $request): JsonResponse
    {
        $accepted = AnswerMatcher::matches(
            QuestionType::from($request->validated('type')),
            $request->validated('answer_key'),
            $request->input('given'),
            $request->validated('expected'),
        );

        return response()->json(['accepted' => $accepted]);
    }

    /** The signed-in Examiner's bank, without library entries (D-040). */
    public static function bank(Request $request): Builder
    {
        return Question::query()->where('examiner_id', $request->user()->id)->whereNull('published_to_library_at');
    }

    private function find(Request $request, int $id): Question
    {
        return $this->bank($request)->findOrFail($id);
    }

    private function answer(Question $question, int $status = 200, array $extra = []): JsonResponse
    {
        $question->load(['competence', 'topic', 'pools', 'baremSteps', 'copiedFrom']);

        return response()->json(['question' => new QuestionResource($question), ...$extra], $status);
    }

    /**
     * Saves the barem steps in place: removed steps are deleted (with only their scores), kept ones
     * updated, new ones added; then the graded answers are recalculated (D-031).
     *
     * @param  Collection<int, BaremStep>  $steps
     * @return array{answers: int, flagged: int}
     */
    private function saveBarem(Question $question, Collection $steps): array
    {
        $before = Scorer::scoresBefore($question);
        $kept = $steps->filter(fn (BaremStep $s) => $s->exists);
        $added = $steps->count() !== $kept->count();

        $question->baremSteps()->whereNotIn('id', $kept->pluck('id'))->delete();
        // Positions are unique per question: move the kept steps out of the way first.
        foreach ($kept as $step) {
            BaremStep::whereKey($step->id)->update(['position' => $step->position + 1000]);
        }
        foreach ($steps as $step) {
            $step->question_id = $question->id;
            $step->save();
            if ($kept->contains($step)) {
                // Not dirty when it ends where it started, so written explicitly.
                BaremStep::whereKey($step->id)->update(['position' => $step->position]);
            }
        }

        return Scorer::regrade($question, $before, $kept->mapWithKeys(fn (BaremStep $s) => [$s->id => (float) $s->points])->all(), $added);
    }

    /** D-031, D-046: once an exam that drew this question has published results, its barem and answer key stay as they are. */
    private function checkLocks(Question $question, array $data): void
    {
        $baremChanged = (array_key_exists('uses_barem', $data) && (bool) $data['uses_barem'] !== $question->uses_barem)
            || (array_key_exists('barem', $data) && ! self::sameBarem($question, array_values($data['barem'] ?? [])));
        $keyChanged = array_key_exists('answer_key', $data) && $data['answer_key'] != $question->answer_key;
        if ((! $baremChanged && ! $keyChanged) || ! Scorer::locked($question)) {
            return;
        }
        $errors = [];
        if ($baremChanged) {
            $errors['barem'] = ['barem_locked'];
        }
        if ($keyChanged) {
            $errors['answer_key'] = ['answer_key_locked'];
        }

        throw ValidationException::withMessages($errors);
    }

    /** The editor sends the whole question on every save; an unchanged barem is not a change. */
    private static function sameBarem(Question $question, array $incoming): bool
    {
        $current = $question->baremSteps->values();
        if ($current->count() !== count($incoming)) {
            return false;
        }
        foreach ($incoming as $i => $step) {
            $was = $current[$i];
            if (($step['id'] ?? null) !== $was->id || $step['description'] !== $was->description || (float) $step['points'] !== (float) $was->points) {
                return false;
            }
        }

        return true;
    }

    /** @param  list<array>  $problems */
    private function notReady(array $problems): JsonResponse
    {
        return response()->json([
            'message' => 'The given data was invalid.',
            'errors' => ['status' => ['not_ready']],
            'problems' => $problems,
        ], 422);
    }

    /** The competence, topic and pools must be this Examiner's; the barem is Subject II only (D-031). */
    private function checkOwnership(Request $request, array $data, Question $question): void
    {
        $examinerId = $request->user()->id;
        $errors = [];
        foreach (['competence_id' => 'competences', 'topic_id' => 'topics'] as $field => $table) {
            if (isset($data[$field]) && ! DB::table($table)->where('id', $data[$field])->where('examiner_id', $examinerId)->exists()) {
                $errors[$field] = 'invalid';
            }
        }
        $stepIds = array_values(array_filter(array_column($data['barem'] ?? [], 'id')));
        if ($stepIds && (count(array_unique($stepIds)) !== count($stepIds) || array_diff($stepIds, $question->baremSteps->pluck('id')->all()))) {
            $errors['barem'] = 'invalid';
        }
        $poolIds = array_unique($data['pool_ids'] ?? []);
        if ($poolIds && DB::table('pools')->whereIn('id', $poolIds)->where('examiner_id', $examinerId)->count() !== count($poolIds)) {
            $errors['pool_ids'] = 'invalid';
        }
        $section = $data['section'] ?? $question->section->value;
        if (! TypeFitsSection::check($section, $data['type'] ?? $question->type->value)) {
            $errors['type'] = 'invalid';
        }
        if (($data['uses_barem'] ?? $question->uses_barem) && $section !== Section::SubjectTwo->value) {
            $errors['uses_barem'] = 'invalid';
        }
        if ($errors) {
            throw ValidationException::withMessages(array_map(fn ($code) => [$code], $errors));
        }
    }
}

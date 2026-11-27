<?php

namespace App\Http\Controllers;

use App\Enums\AttemptStatus;
use App\Enums\ScorePolicy;
use App\Enums\Section;
use App\Http\Requests\Grading\GradeRequest;
use App\Http\Requests\Grading\PublishResultsRequest;
use App\Http\Resources\ExamResource;
use App\Http\Resources\QuestionResource;
use App\Models\Answer;
use App\Models\AnswerBaremScore;
use App\Models\AnswerImage;
use App\Models\Attempt;
use App\Models\AttemptItem;
use App\Models\Exam;
use App\Support\Attempts\Sealer;
use App\Support\Attempts\Starter;
use App\Support\Grading\Scorer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * C-007 (P8a): the Examiner grades Subject II (D-005, D-031) and publishes the results with one
 * cohort note (D-019). Everything is looked up through the signed-in Examiner's own exams, so
 * another Examiner's exam, answer or photo is a 404.
 */
class GradingController extends Controller
{
    /** The queue: every Subject II answer of the exam's submitted Attempts, per problem and per Candidate. */
    public function queue(Request $request, int $id): JsonResponse
    {
        $exam = ExamController::find($request, $id);
        $attempts = $this->submitted($exam)->with(['candidate', 'items.answer.images', 'items.question'])->orderBy('id')->get();
        $numbers = $attempts->pluck('id')->values()->flip()->map(fn ($i) => $i + 1);

        $answers = [];
        foreach ($attempts as $attempt) {
            foreach ($attempt->items->sortBy('position') as $item) {
                if (($item->question_snapshot['section'] ?? null) !== Section::SubjectTwo->value) {
                    continue;
                }
                $answer = $item->answer;
                $answers[] = [
                    'attempt_item_id' => $item->id,
                    'attempt_id' => $attempt->id,
                    'candidate' => $attempt->candidate->name,
                    'number' => $numbers[$attempt->id],
                    'position' => $item->position,
                    'question_code' => $item->question->code,
                    'photos' => $answer?->images->count() ?? 0,
                    'answered' => filled($answer?->answer['value'] ?? null) || ($answer?->images->isNotEmpty() ?? false),
                    'status' => self::status($answer),
                    'awarded_points' => QuestionResource::number($answer?->awarded_points),
                ];
            }
        }
        $byPosition = collect($answers)->groupBy('position');
        $items = $exam->items()->with('competence')->where('section', Section::SubjectTwo)->orderBy('position')->get()
            ->map(fn ($item) => [
                'position' => $item->position,
                'competence' => $item->competence?->code,
                'points' => QuestionResource::number($item->points),
                'graded' => ($byPosition[$item->position] ?? collect())->where('status', 'graded')->count(),
                'total' => ($byPosition[$item->position] ?? collect())->count(),
            ])->all();
        $statuses = collect($answers)->countBy('status');

        return response()->json([
            'exam' => [
                'id' => $exam->id,
                'title' => $exam->title,
                'classes' => $exam->classes()->orderBy('name')->pluck('name')->all(),
                'available_until' => $exam->available_until?->toIso8601String(),
                'submissions' => $attempts->count(),
                'results_published_at' => $exam->results_published_at?->toIso8601String(),
                'cohort_note' => $exam->cohort_note,
            ],
            'items' => $items,
            'answers' => $answers,
            'counts' => [
                'total' => count($answers),
                'graded' => $statuses['graded'] ?? 0,
                'to_grade' => $statuses['to_grade'] ?? 0,
                'recheck' => $statuses['recheck'] ?? 0,
            ],
            'publish' => ['ready' => ! $this->missing($exam), 'missing' => $this->missing($exam), ...self::stats($exam)],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        return response()->json(['item' => $this->item($this->find($request, $id))]);
    }

    public function grade(GradeRequest $request, int $id): JsonResponse
    {
        $item = $this->find($request, $id);
        $exam = $item->attempt->exam;
        if ($exam->results_published_at !== null) {
            return self::resultsPublished();
        }

        return DB::transaction(function () use ($request, $item, $exam) {
            // PATTERN-007, same order as publish(): the exam first, so a publication that won the race
            // is seen here and no grade changes after it (D-019); then the Attempt, whose status and
            // totals depend on its other answers.
            if (Exam::lockForUpdate()->findOrFail($exam->id)->results_published_at !== null) {
                return self::resultsPublished();
            }
            $attempt = Attempt::lockForUpdate()->findOrFail($item->attempt_id);
            if (! in_array($attempt->status, [AttemptStatus::Submitted, AttemptStatus::Graded], true)) {
                return response()->json(['code' => 'attempt_open', 'message' => 'The Attempt is still running.'], 409);
            }
            $question = $item->question;
            $max = (float) $item->question_snapshot['points'];
            $data = $request->validated();
            $adjustment = isset($data['adjustment']) ? (float) $data['adjustment'] : null;

            if ($question->uses_barem) {
                $steps = $question->baremSteps()->get();
                $given = collect($data['steps'] ?? [])->mapWithKeys(fn ($s) => [(int) $s['id'] => (float) $s['points']]);
                if (! array_key_exists('steps', $data)) {
                    throw ValidationException::withMessages(['steps' => ['required']]);
                }
                $fits = $given->count() === $steps->count() && count($data['steps']) === $steps->count()
                    && $steps->every(fn ($step) => $given->has($step->id) && $given[$step->id] <= (float) $step->points);
                if (! $fits) {
                    throw ValidationException::withMessages(['steps' => ['invalid']]);
                }
                $base = (float) $given->sum();
            } else {
                if (! isset($data['points'])) {
                    throw ValidationException::withMessages(['points' => ['required']]);
                }
                if ((float) $data['points'] > $max) {
                    throw ValidationException::withMessages(['points' => ['invalid']]);
                }
                $given = collect();
                $base = (float) $data['points'];
            }
            [$total, $clamped] = Scorer::total($base, $adjustment, $max);
            if ($clamped) {
                throw ValidationException::withMessages(['adjustment' => ['out_of_range']]); // D-031: kept between 0 and the points
            }

            $answer = $item->answer ?? tap(new Answer, fn (Answer $a) => $a->attempt_item_id = $item->id);
            $answer->awarded_points = $total;
            $answer->adjustment = $adjustment;
            $answer->comment = isset($data['comment']) && trim($data['comment']) !== '' ? $data['comment'] : null;
            $answer->needs_recheck = false;
            $answer->graded_by = $request->user()->id;
            $answer->graded_at = now();
            $answer->save();
            $answer->baremScores()->delete();
            foreach ($given as $stepId => $points) {
                $score = new AnswerBaremScore;
                $score->points = $points;
                $score->answer_id = $answer->id;
                $score->barem_step_id = $stepId;
                $score->save();
            }

            $this->finish($attempt);

            return response()->json(['item' => $this->item($item->fresh())]);
        });
    }

    /** D-019, Q-076: once every submitted Attempt is graded, none is running and the window has closed. */
    public function publish(PublishResultsRequest $request, int $id): JsonResponse
    {
        $exam = ExamController::find($request, $id);
        Sealer::sealExpired(); // an Attempt past its deadline is submitted, not running

        return DB::transaction(function () use ($request, $exam) {
            $exam = Exam::lockForUpdate()->findOrFail($exam->id);
            if ($exam->results_published_at !== null) {
                return self::resultsPublished();
            }
            if ($missing = $this->missing($exam)) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => ['status' => ['results_not_ready']],
                    'missing' => $missing,
                ], 422);
            }
            $exam->cohort_note = $request->validated('cohort_note');
            $exam->results_published_at = now();
            $exam->save();

            return response()->json(['exam' => new ExamResource($exam)]);
        });
    }

    public function image(Request $request, int $id): StreamedResponse
    {
        $image = AnswerImage::whereKey($id)
            ->whereHas('answer.attemptItem.attempt.exam', fn (Builder $q) => $q->where('examiner_id', $request->user()->id))
            ->firstOrFail();

        return Storage::response($image->path, $image->original_name, ['Content-Type' => $image->mime_type, 'Cache-Control' => 'private, max-age=3600']);
    }

    /** A Subject II answer of one of the Examiner's exams. */
    private function find(Request $request, int $id): AttemptItem
    {
        return AttemptItem::whereKey($id)
            ->where('question_snapshot->section', Section::SubjectTwo->value)
            ->whereHas('attempt.exam', fn (Builder $q) => $q->where('examiner_id', $request->user()->id))
            ->with(['attempt.exam', 'attempt.candidate', 'question.baremSteps', 'answer.images', 'answer.baremScores'])
            ->firstOrFail();
    }

    private function item(AttemptItem $item): array
    {
        $answer = $item->answer;
        $question = $item->question;

        return [
            'attempt_item_id' => $item->id,
            'attempt_id' => $item->attempt_id,
            'position' => $item->position,
            'question_id' => $question->id,
            'question_code' => $question->code,
            'candidate' => $item->attempt->candidate->name,
            'statement' => $item->question_snapshot['statement'] ?? null,
            'points' => QuestionResource::number($item->question_snapshot['points']),
            'text' => $answer?->answer['value'] ?? null,
            'photos' => $answer ? $answer->images->sortBy('position')->values()->map(fn ($i) => AttemptImageController::image($i))->all() : [],
            'uses_barem' => $question->uses_barem,
            // "modificat" on DS-009: the step changed after this answer was graded (D-031).
            'barem' => $question->baremSteps->map(fn ($s) => [
                'id' => $s->id, 'description' => $s->description, 'points' => QuestionResource::number($s->points),
                'modified' => $answer?->graded_at !== null && $s->updated_at->gt($answer->graded_at),
            ])->all(),
            'scores' => $answer ? $answer->baremScores->mapWithKeys(fn ($s) => [$s->barem_step_id => QuestionResource::number($s->points)])->all() : [],
            'adjustment' => QuestionResource::number($answer?->adjustment),
            'comment' => $answer?->comment,
            'awarded_points' => QuestionResource::number($answer?->awarded_points),
            'needs_recheck' => (bool) $answer?->needs_recheck,
            'graded_at' => $answer?->graded_at?->toIso8601String(),
        ];
    }

    /** Graded once every Subject II problem has a grade; totals refreshed on every grade after that. */
    private function finish(Attempt $attempt): void
    {
        if ($attempt->status === AttemptStatus::Graded) {
            Scorer::attemptTotals($attempt);

            return;
        }
        $ungraded = $attempt->items()->where('question_snapshot->section', Section::SubjectTwo->value)
            ->where(fn (Builder $q) => $q->whereDoesntHave('answer')->orWhereHas('answer', fn (Builder $a) => $a->whereNull('graded_at')))
            ->exists();
        if ($ungraded) {
            return;
        }
        $attempt->moveTo(AttemptStatus::Graded);
        $attempt->subject_2_score = Scorer::subjectTwo($attempt);
        $attempt->total_score = Scorer::BASELINE + (float) $attempt->subject_1_score + (float) $attempt->subject_2_score;
        $attempt->save();
    }

    /** @return list<string> what still blocks publishing (Q-076), in a fixed order */
    private function missing(Exam $exam): array
    {
        $missing = [];
        if ($exam->attempts()->where('status', AttemptStatus::Submitted)->exists()) {
            $missing[] = 'ungraded';
        }
        if ($this->submitted($exam)->whereHas('items.answer', fn (Builder $a) => $a->where('needs_recheck', true))->exists()) {
            $missing[] = 'recheck';
        }
        if ($exam->attempts()->whereIn('status', Starter::OPEN)->exists()) {
            $missing[] = 'open_attempts';
        }
        if ($exam->available_until === null || $exam->available_until->isFuture()) {
            $missing[] = 'window_open';
        }

        return $missing;
    }

    /** Mean and median grade (1–10) over each Candidate's counted Attempt (D-012); null before any is graded. */
    private static function stats(Exam $exam): array
    {
        /** @var Collection<int, Attempt> $graded */
        $graded = $exam->attempts()->where('status', AttemptStatus::Graded)->get();
        $counted = $graded->groupBy('candidate_id')->map(fn ($attempts) => $exam->score_policy === ScorePolicy::Latest
            ? $attempts->sortByDesc('attempt_number')->first()
            : $attempts->sortByDesc(fn ($a) => (float) $a->total_score)->first());
        $grades = $counted->map(fn ($a) => (float) $a->total_score / 10)->sort()->values();
        if ($grades->isEmpty()) {
            return ['mean' => null, 'median' => null];
        }
        $n = $grades->count();
        $median = $n % 2 ? $grades[intdiv($n, 2)] : ($grades[$n / 2 - 1] + $grades[$n / 2]) / 2;

        return ['mean' => round($grades->avg(), 2), 'median' => round($median, 2)];
    }

    /** Attempts handed in: submitted (awaiting grading) or graded. */
    private function submitted(Exam $exam)
    {
        return $exam->attempts()->whereIn('status', [AttemptStatus::Submitted, AttemptStatus::Graded]);
    }

    private static function status(?Answer $answer): string
    {
        return match (true) {
            $answer?->graded_at === null => 'to_grade',
            (bool) $answer->needs_recheck => 'recheck',
            default => 'graded',
        };
    }

    private static function resultsPublished(): JsonResponse
    {
        return response()->json(['code' => 'results_published', 'message' => 'The results are published.'], 409);
    }
}

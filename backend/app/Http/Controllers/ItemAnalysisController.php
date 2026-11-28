<?php

namespace App\Http\Controllers;

use App\Enums\AttemptStatus;
use App\Http\Resources\QuestionResource;
use App\Models\Attempt;
use App\Models\AttemptItem;
use App\Models\Question;
use App\Support\Analysis\ItemAnalysis;
use App\Support\Grading\CountedAttempts;
use App\Support\Grading\Scorer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * C-008 (P10): Item Analysis of one of the Examiner's exams, per competence, per Item and per
 * question (D-047, D-057, D-058), from each Candidate's counted, graded Attempt (Q-093, Q-094,
 * Q-097). Computed on every read; nothing is stored, so it follows every re-grade.
 */
class ItemAnalysisController extends Controller
{
    public function show(Request $request, int $id): JsonResponse
    {
        $exam = ExamController::find($request, $id);
        $counted = CountedAttempts::of($exam)->values();
        $counted->load(['items.answer', 'items.question']);
        $enough = $counted->count() >= ItemAnalysis::MIN_ATTEMPTS;

        $items = $exam->items()->with('competence')->orderBy('position')->get()->map(function ($item) use ($counted) {
            /** @var Collection<int, array{attempt: Attempt, item: AttemptItem}> $drawn */
            $drawn = $counted->map(fn (Attempt $a) => ['attempt' => $a, 'item' => $a->items->firstWhere('exam_item_id', $item->id)])
                ->filter(fn ($d) => $d['item'] !== null)->values();

            return [
                'competence' => $item->competence,
                'earned' => $drawn->sum(fn ($d) => self::points($d['item'])),
                'possible' => $drawn->count() * (float) $item->points,
                'row' => [
                    'position' => $item->position,
                    'section' => $item->section->value,
                    'points' => QuestionResource::number($item->points),
                    ...self::measure($drawn, (float) $item->points),
                    'questions' => $drawn->groupBy(fn ($d) => $d['item']->question_id)
                        ->map(fn (Collection $group) => self::question($group->first()['item']->question, $group, (float) $item->points))
                        ->sortBy('code')->values()->all(),
                ],
            ];
        });

        $competences = $items->groupBy(fn ($i) => $i['competence']?->id)->map(function (Collection $group) use ($enough) {
            $competence = $group->first()['competence'];
            $possible = $group->sum('possible');

            return [
                'code' => $competence?->code,
                'description' => $competence?->description,
                'p' => $enough && $possible > 0 ? round($group->sum('earned') / $possible, 4) : null,
                'weak' => $group->filter(fn ($i) => $i['row']['flags'] !== [])->count(),
                'items' => $group->pluck('row')->all(),
            ];
        })->sortBy('code')->values()->all();

        return response()->json([
            'exam' => ['id' => $exam->id, 'title' => $exam->title],
            'graded' => $exam->attempts()->where('status', AttemptStatus::Graded)->count(),
            'submissions' => $exam->attempts()->whereIn('status', [AttemptStatus::Submitted, AttemptStatus::Graded])->count(),
            'recheck' => $counted->sum(fn (Attempt $a) => $a->items->filter(fn ($i) => (bool) $i->answer?->needs_recheck)->count()),
            ...CountedAttempts::stats($counted),
            'competences' => $competences,
        ]);
    }

    /** @param Collection<int, array{attempt: Attempt, item: AttemptItem}> $drawn */
    private static function measure(Collection $drawn, float $max): array
    {
        $scores = $drawn->map(fn ($d) => self::points($d['item']))->all();
        $rests = $drawn->map(fn ($d) => (float) $d['attempt']->total_score - Scorer::BASELINE - self::points($d['item']))->all();

        return ItemAnalysis::measure($scores, $rests, $max);
    }

    /** One question drawn for an Item, on the Attempts that drew it; choice questions count their options. */
    private static function question(Question $question, Collection $drawn, float $max): array
    {
        $key = $question->answer_key ?? [];
        $type = $question->type->value;
        // Options are numbered by their original position, from 1 (D-045).
        $options = array_map('strval', (array) ($key['options'] ?? []));
        $labels = match ($type) {
            'single_choice', 'multiple_choice' => $options ? array_combine(range(1, count($options)), $options) : [],
            'dual_choice' => ['true' => 'true', 'false' => 'false'],
            default => null,
        };
        $correct = match ($type) {
            'single_choice' => [(int) ($key['correct'] ?? 0)],
            'multiple_choice' => array_map('intval', (array) ($key['correct'] ?? [])),
            'dual_choice' => [(bool) ($key['correct'] ?? false)],
            default => [],
        };
        $choices = $drawn->map(fn ($d) => ItemAnalysis::chosen(
            $type, $d['item']->answer?->answer['value'] ?? null, $d['item']->expected_answer['option_order'] ?? null,
        ))->all();

        return [
            'id' => $question->id,
            'code' => $question->code,
            'type' => $type,
            ...self::measure($drawn, $max),
            'options' => $labels === null ? null : ItemAnalysis::distractors($choices, $labels, $correct),
        ];
    }

    /** An item's points; an answer with no points yet counts as 0. */
    private static function points(AttemptItem $item): float
    {
        return (float) ($item->answer?->awarded_points ?? 0);
    }
}

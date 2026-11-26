<?php

namespace App\Support\Grading;

use App\Enums\AttemptStatus;
use App\Enums\Section;
use App\Models\Answer;
use App\Models\Attempt;
use App\Models\AttemptItem;
use App\Models\Question;
use Illuminate\Database\Eloquent\Builder;

/**
 * Subject II scores (D-005, D-031): a barem answer is the sum of its steps plus an optional
 * adjustment, kept between 0 and the question's points; an Attempt's total is the 10 baseline
 * points plus both Subjects. Used by grading (P8a) and by barem edits, which recalculate the
 * answers already graded and flag the ones the Examiner should look at again.
 */
final class Scorer
{
    /** Punct din oficiu (D-005). */
    public const BASELINE = 10;

    /** @return array{0: float, 1: bool} the total and whether it had to be clamped */
    public static function total(float $steps, ?float $adjustment, float $max): array
    {
        $raw = $steps + ($adjustment ?? 0);
        $total = max(0.0, min($max, $raw));

        return [$total, $total !== $raw];
    }

    /**
     * The barem scores of the graded answers to this question in exams whose results aren't
     * published, read before the barem changes (a removed step takes its scores with it).
     *
     * @return array<int, array<int, float>> answer id => [barem step id => points]
     */
    public static function scoresBefore(Question $question): array
    {
        $scores = [];
        foreach (self::regradable($question)->with('baremScores')->get() as $answer) {
            if ($answer->baremScores->isNotEmpty()) {
                $scores[$answer->id] = $answer->baremScores->mapWithKeys(fn ($s) => [$s->barem_step_id => (float) $s->points])->all();
            }
        }

        return $scores;
    }

    /**
     * D-031: after a barem edit, partial points are capped at a step's new maximum; a removed step
     * that had points, a new step, or a clamped total flags the answer for re-check.
     *
     * @param  array<int, array<int, float>>  $before  from scoresBefore()
     * @param  array<int, float>  $maxima  the kept steps' new points, by id
     * @return array{answers: int, flagged: int}
     */
    public static function regrade(Question $question, array $before, array $maxima, bool $added): array
    {
        $flagged = 0;
        $answers = Answer::whereIn('id', array_keys($before))->with(['baremScores', 'attemptItem.attempt'])->get();
        foreach ($answers as $answer) {
            $flag = $added;
            foreach ($before[$answer->id] as $stepId => $points) {
                if (! array_key_exists($stepId, $maxima)) {
                    $flag = $flag || $points > 0;
                }
            }
            $sum = 0.0;
            foreach ($answer->baremScores as $score) {
                $max = $maxima[$score->barem_step_id] ?? null;
                if ($max !== null && (float) $score->points > $max) {
                    $score->points = $max;
                    $score->save();
                    $flag = true;
                }
                $sum += (float) $score->points;
            }
            [$total, $clamped] = self::total($sum, $answer->adjustment !== null ? (float) $answer->adjustment : null, (float) $question->points);

            $answer->awarded_points = $total;
            $answer->needs_recheck = $answer->needs_recheck || $flag || $clamped;
            $answer->save();
            self::attemptTotals($answer->attemptItem->attempt);
            $flagged += ($flag || $clamped) ? 1 : 0;
        }

        return ['answers' => $answers->count(), 'flagged' => $flagged];
    }

    /** Refreshes a graded Attempt's Subject II score and total after one of its answers changed. */
    public static function attemptTotals(Attempt $attempt): void
    {
        if ($attempt->status !== AttemptStatus::Graded) {
            return;
        }
        $attempt->subject_2_score = self::subjectTwo($attempt);
        $attempt->total_score = self::BASELINE + (float) $attempt->subject_1_score + (float) $attempt->subject_2_score;
        $attempt->save();
    }

    public static function subjectTwo(Attempt $attempt): float
    {
        return (float) Answer::whereHas('attemptItem', fn (Builder $q) => $q->where('attempt_id', $attempt->id)
            ->where('question_snapshot->section', Section::SubjectTwo->value))->sum('awarded_points');
    }

    /** True when an Attempt of an exam with published results drew this question (D-031, D-046). */
    public static function locked(Question $question): bool
    {
        return AttemptItem::where('question_id', $question->id)
            ->whereHas('attempt.exam', fn (Builder $q) => $q->whereNotNull('results_published_at'))
            ->exists();
    }

    /** Graded answers to this question in exams whose results aren't published. */
    private static function regradable(Question $question): Builder
    {
        return Answer::query()->whereNotNull('graded_at')->whereNotNull('awarded_points')
            ->whereHas('attemptItem', fn (Builder $q) => $q->where('question_id', $question->id)
                ->whereHas('attempt.exam', fn (Builder $e) => $e->whereNull('results_published_at')));
    }
}

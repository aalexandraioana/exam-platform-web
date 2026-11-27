<?php

namespace App\Support\Grading;

use App\Enums\AttemptStatus;
use App\Enums\ScorePolicy;
use App\Models\Attempt;
use App\Models\Exam;
use Illuminate\Support\Collection;

/**
 * Each Candidate's counted, graded Attempt under the Exam's score policy (D-012): the latest, or
 * the highest total with a tie going to the later Attempt (Q-097), so the grading screen's mean
 * and median (C-007) and Item Analysis (C-008) always use the same one.
 */
final class CountedAttempts
{
    /** @return Collection<int, Attempt> keyed by Candidate id */
    public static function of(Exam $exam): Collection
    {
        return $exam->attempts()->where('status', AttemptStatus::Graded)->get()
            ->groupBy('candidate_id')
            ->map(fn (Collection $attempts) => $attempts->sort(fn (Attempt $a, Attempt $b) => $exam->score_policy === ScorePolicy::Latest
                ? $b->attempt_number <=> $a->attempt_number
                : [(float) $b->total_score, $b->attempt_number] <=> [(float) $a->total_score, $a->attempt_number])->first());
    }

    /**
     * Mean and median grade (1–10) over the counted Attempts; null before any is graded.
     *
     * @param  Collection<int, Attempt>  $counted
     * @return array{mean: ?float, median: ?float}
     */
    public static function stats(Collection $counted): array
    {
        $grades = $counted->map(fn (Attempt $a) => (float) $a->total_score / 10)->sort()->values();
        if ($grades->isEmpty()) {
            return ['mean' => null, 'median' => null];
        }
        $n = $grades->count();
        $median = $n % 2 ? $grades[intdiv($n, 2)] : ($grades[$n / 2 - 1] + $grades[$n / 2]) / 2;

        return ['mean' => round($grades->avg(), 2), 'median' => round($median, 2)];
    }
}

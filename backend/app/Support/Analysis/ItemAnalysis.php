<?php

namespace App\Support\Analysis;

/**
 * Item Analysis (P10, D-047): difficulty p = mean score / maximum (partial scores for Subject II),
 * discrimination r = Pearson correlation of the item score with the rest of the score (corrected
 * item-total; the point-biserial for 0-or-full items). Fewer than 2 Attempts: neither value. No
 * variation in the item or the rest: p only, r is not enough data (Q-095). Flags use the unrounded
 * values. Pure functions on plain arrays; ItemAnalysisController reads the Attempts.
 */
final class ItemAnalysis
{
    public const MIN_ATTEMPTS = 2;

    public const TOO_HARD = 0.20;

    public const TOO_EASY = 0.90;

    public const LOW_DISCRIMINATION = 0.20;

    public const UNUSED_SHARE = 0.05;

    /**
     * @param  list<float|int>  $scores  the item's points per Attempt
     * @param  list<float|int>  $rests  the rest of each Attempt's score, in the same order
     * @return array{n: int, p: ?float, r: ?float, flags: list<string>, not_enough_data: bool}
     */
    public static function measure(array $scores, array $rests, float $max): array
    {
        $n = count($scores);
        $p = $n >= self::MIN_ATTEMPTS && $max > 0 ? array_sum($scores) / $n / $max : null;
        $r = $n >= self::MIN_ATTEMPTS ? self::pearson($scores, $rests) : null;

        return [
            'n' => $n,
            'p' => $p === null ? null : round($p, 4),
            'r' => $r === null ? null : round($r, 4),
            'flags' => self::flags($p, $r),
            'not_enough_data' => $p === null || $r === null,
        ];
    }

    /** @return list<string> D-047's weak-item flags; a negative r is also low */
    public static function flags(?float $p, ?float $r): array
    {
        $flags = [];
        if ($p !== null && $p < self::TOO_HARD) {
            $flags[] = 'too_hard';
        }
        if ($p !== null && $p > self::TOO_EASY) {
            $flags[] = 'too_easy';
        }
        if ($r !== null && $r < self::LOW_DISCRIMINATION) {
            $flags[] = 'low_discrimination';
        }
        if ($r !== null && $r < 0) {
            $flags[] = 'negative_discrimination';
        }

        return $flags;
    }

    /** Pearson's r; null when either side has no variation. */
    public static function pearson(array $x, array $y): ?float
    {
        $n = count($x);
        $mx = array_sum($x) / $n;
        $my = array_sum($y) / $n;
        $sxy = $sxx = $syy = 0.0;
        foreach ($x as $i => $xi) {
            $dx = $xi - $mx;
            $dy = $y[$i] - $my;
            $sxy += $dx * $dy;
            $sxx += $dx * $dx;
            $syy += $dy * $dy;
        }
        // Scores are whole or half points, so a tiny epsilon only absorbs float noise.
        if ($sxx < 1e-9 || $syy < 1e-9) {
            return null;
        }

        return $sxy / sqrt($sxx * $syy);
    }

    /**
     * The original options a Candidate chose: shown position k is original option_order[k-1]
     * (D-045), as in Grader::isCorrect; a true/false answer is its own option.
     *
     * @return list<int|bool>
     */
    public static function chosen(string $type, mixed $given, ?array $order): array
    {
        $original = fn ($k) => is_int($k) && $order ? ($order[$k - 1] ?? null) : null;
        $chosen = match ($type) {
            'single_choice' => [$original($given)],
            'multiple_choice' => is_array($given) ? array_map($original, $given) : [],
            'dual_choice' => is_bool($given) ? [$given] : [],
            default => [],
        };

        return array_values(array_filter($chosen, fn ($c) => $c !== null));
    }

    /**
     * How many Candidates chose each option; a wrong option chosen by fewer than 5% of the
     * Candidates who got the question is unused (D-047). Unanswered ones count in the share.
     *
     * @param  list<list<int|bool>>  $choices  per Candidate who got the question, from chosen()
     * @param  array<int|string, string>  $labels  option => label, in order
     * @param  list<int|bool>  $correct
     * @return list<array{option: int|bool, label: string, correct: bool, count: int, share: float, unused: bool}>
     */
    public static function distractors(array $choices, array $labels, array $correct): array
    {
        $n = count($choices);
        $out = [];
        foreach ($labels as $option => $label) {
            $option = is_string($option) ? $option === 'true' : $option;
            $count = count(array_filter($choices, fn ($c) => in_array($option, $c, true)));
            $share = $n ? $count / $n : 0.0;
            $isCorrect = in_array($option, $correct, true);
            $out[] = [
                'option' => $option, 'label' => (string) $label, 'correct' => $isCorrect,
                'count' => $count, 'share' => round($share, 4), 'unused' => ! $isCorrect && $n > 0 && $share < self::UNUSED_SHARE,
            ];
        }

        return $out;
    }
}

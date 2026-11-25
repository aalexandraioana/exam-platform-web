<?php

namespace App\Support\Attempts;

use App\Enums\QuestionType;
use App\Models\Answer;
use App\Models\Attempt;
use App\Models\AttemptItem;
use App\Support\Math\AnswerMatcher;

/**
 * Subject I grading (P6c, D-005): each item full points or 0, never negative, from the Attempt's
 * own snapshot, so a later edit of the question never changes it. Choices are the shown positions,
 * mapped back through `option_order` (D-045); short answers are checked against this Attempt's
 * drawn answer (D-006, D-017). Runs when the Attempt becomes submitted; nothing is shown before
 * publication (D-019). Subject II is left for the Examiner (P8).
 */
final class Grader
{
    /** Inside the submit/seal transaction; the caller saves the Attempt. */
    public static function subjectOne(Attempt $attempt): void
    {
        $total = 0.0;
        foreach ($attempt->items()->with('answer')->get() as $item) {
            if ($item->question_snapshot['section'] !== 'subject_1') {
                continue;
            }
            $answer = $item->answer;
            if (! $answer) {
                // Unanswered: a row with no value, so Item Analysis counts it as wrong (P10).
                $answer = new Answer;
                $answer->attempt_item_id = $item->id;
            }
            $given = $answer->answer['value'] ?? null;
            $points = $given !== null && self::isCorrect($item, $given) ? (float) $item->question_snapshot['points'] : 0.0;

            $answer->awarded_points = $points;
            $answer->graded_at = now();
            $answer->save();
            $total += $points;
        }
        $attempt->subject_1_score = $total;
    }

    public static function isCorrect(AttemptItem $item, mixed $given): bool
    {
        $type = QuestionType::tryFrom($item->question_snapshot['type']);
        $expected = $item->expected_answer;
        $order = $expected['option_order'] ?? null;
        // Shown position k is original position option_order[k-1].
        $original = fn ($k) => is_int($k) && $order ? ($order[$k - 1] ?? null) : null;

        $given = match ($type) {
            QuestionType::SingleChoice => $original($given),
            QuestionType::MultipleChoice => is_array($given) ? array_map($original, $given) : null,
            default => $given,
        };
        if ($type === null || $given === null || (is_array($given) && in_array(null, $given, true))) {
            return false;
        }

        return AnswerMatcher::matches($type, $expected['answer_key'] ?? [], $given, $expected['answer'] ?? null);
    }
}

<?php

namespace App\Support\Grading;

use App\Enums\AttemptStatus;
use App\Models\Answer;
use App\Models\AnswerKeyCorrection;
use App\Models\Attempt;
use App\Models\AttemptItem;
use App\Models\Question;
use App\Models\User;
use App\Support\Attempts\Grader;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * P8c · D-046: a Subject I answer key corrected after the question was drawn. Each Attempt of an exam
 * whose results aren't published gets the corrected key in its own snapshot, keeping the options it
 * showed (Q-088), and its Subject I is graded again from that snapshot (D-006, D-045); the change is
 * logged (Q-087). Runs inside the question's save, after its locks (PATTERN-007).
 */
final class KeyCorrection
{
    /** The fields that decide what is correct; option texts are not among them (Q-088). */
    private const KEY_FIELDS = ['correct', 'kind', 'accepted', 'value'];

    /** Whether the correct answer itself changes, not only an option's text. */
    public static function changes(array $before, array $after): bool
    {
        return self::correctness($before) != self::correctness($after);
    }

    /**
     * Q-088: once drawn, the options keep their number and order; a text may be fixed only in place.
     * An existing option's text found at another position is a reorder, even if other texts changed.
     */
    public static function optionsMoved(array $before, array $after): bool
    {
        $old = array_values(array_map('strval', (array) ($before['options'] ?? [])));
        $new = array_values(array_map('strval', (array) ($after['options'] ?? [])));
        if (count($old) !== count($new)) {
            return true;
        }
        foreach ($new as $position => $text) {
            if (($old[$position] ?? null) !== $text && in_array($text, $old, true)) {
                return true;
            }
        }

        return false;
    }

    /** The Attempt items of this question in exams whose results aren't published. */
    public static function items(Question $question): Builder
    {
        return AttemptItem::query()->where('question_id', $question->id)
            ->whereHas('attempt.exam', fn (Builder $e) => $e->whereNull('results_published_at'));
    }

    /** PATTERN-007: the Attempts that will be written, locked before the question (as grading does). */
    public static function lockAttempts(Question $question): void
    {
        Attempt::whereIn('id', self::items($question)->select('attempt_id'))->orderBy('id')->lockForUpdate()->get();
    }

    /** @return int the answers graded again (in submitted or graded Attempts) */
    public static function apply(Question $question, array $before, User $examiner): int
    {
        $after = (array) $question->answer_key;
        /** @var Collection<int, AttemptItem> $items */
        $items = self::items($question)->with(['attempt', 'answer'])->get();
        foreach ($items as $item) {
            $expected = $item->expected_answer ?? [];
            $shown = $expected['answer_key']['options'] ?? null;
            $expected['answer_key'] = [...$after, ...($shown !== null ? ['options' => $shown] : [])];
            $item->expected_answer = $expected;
            $item->save();
        }

        // Only this item is graded again (D-005: full points or 0, from the snapshot); the Attempt's
        // Subject I score and total move by the difference, so its other answers stay untouched.
        $handedIn = $items->filter(fn (AttemptItem $i) => in_array($i->attempt->status, [AttemptStatus::Submitted, AttemptStatus::Graded], true));
        foreach ($handedIn as $item) {
            $answer = $item->answer ?? tap(new Answer, fn (Answer $a) => $a->attempt_item_id = $item->id);
            $given = $answer->answer['value'] ?? null;
            $points = $given !== null && Grader::isCorrect($item, $given) ? (float) $item->question_snapshot['points'] : 0.0;
            $delta = $points - (float) ($answer->awarded_points ?? 0);
            $answer->awarded_points = $points;
            $answer->graded_at = now();
            $answer->save();
            if ($delta != 0.0) {
                $attempt = $item->attempt;
                $attempt->subject_1_score = (float) $attempt->subject_1_score + $delta;
                if ($attempt->status === AttemptStatus::Graded) {
                    $attempt->total_score = (float) $attempt->total_score + $delta;
                }
                $attempt->save();
            }
        }

        $log = new AnswerKeyCorrection;
        $log->question_id = $question->id;
        $log->examiner_id = $examiner->id;
        $log->before = $before;
        $log->after = $after;
        $log->answers = $handedIn->count();
        $log->save();

        return $handedIn->count();
    }

    private static function correctness(array $key): array
    {
        return collect(self::KEY_FIELDS)->mapWithKeys(fn ($f) => [$f => $key[$f] ?? null])->all();
    }
}

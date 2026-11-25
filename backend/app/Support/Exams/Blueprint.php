<?php

namespace App\Support\Exams;

use App\Enums\QuestionStatus;
use App\Models\Exam;
use App\Models\ExamItem;
use App\Models\Question;
use Illuminate\Database\Eloquent\Builder;
use Random\Engine\Mt19937;
use Random\Randomizer;

/**
 * Which questions an Item may draw, and one distinct question per Item (D-057). P5 uses it for the
 * publish check and the preview; P6 calls `assign` when an Attempt starts, with the Attempt's seed.
 *
 * The assignment is a bipartite matching (augmenting paths): each Item's eligible questions are
 * shuffled with the seed, so the draw is random and reproducible, and it never fails when some
 * assignment exists, unlike picking greedily per Item.
 */
final class Blueprint
{
    /** @return list<int> */
    public static function eligible(ExamItem $item): array
    {
        return self::eligibleFor($item->exam, $item->only('section', 'pool_id', 'competence_id', 'difficulty', 'type', 'topic_id'));
    }

    /**
     * Ready questions of the Examiner's bank in the pool, with the competence and difficulty, the
     * type and topic unless null ("any"), and the Exam's grade level. None for incomplete criteria.
     *
     * @return list<int>
     */
    public static function eligibleFor(Exam $exam, array $criteria): array
    {
        $value = function (string $key) use ($criteria) {
            $v = $criteria[$key] ?? null;

            return $v instanceof \BackedEnum ? $v->value : $v;
        };
        if (! $exam->grade_level || ! $value('pool_id') || ! $value('competence_id') || ! $value('difficulty') || ! $value('section')) {
            return [];
        }

        return Question::query()
            ->where('examiner_id', $exam->examiner_id)
            ->whereNull('published_to_library_at')
            ->where('status', QuestionStatus::Ready)
            ->where('section', $value('section'))
            ->where('grade_level', $exam->grade_level)
            ->where('competence_id', $value('competence_id'))
            ->where('difficulty', $value('difficulty'))
            ->when($value('type'), fn (Builder $q, $type) => $q->where('type', $type))
            ->when($value('topic_id'), fn (Builder $q, $topic) => $q->where('topic_id', $topic))
            ->whereHas('pools', fn (Builder $q) => $q->where('pools.id', $value('pool_id')))
            ->orderBy('id')
            ->pluck('id')
            ->all();
    }

    /**
     * One distinct question per Item, in Item order; null when no assignment exists.
     *
     * @return array<int, int>|null item id => question id
     */
    public static function assign(Exam $exam, int $seed): ?array
    {
        [$assignment, $unserved] = self::match($exam, $seed);

        return $unserved ? null : $assignment;
    }

    /** Positions of the Items left without a question by a largest assignment. @return list<int> */
    public static function unserved(Exam $exam): array
    {
        return self::match($exam, null)[1];
    }

    /** @return array{0: array<int, int>, 1: list<int>} */
    private static function match(Exam $exam, ?int $seed): array
    {
        $items = $exam->items()->get()->each->setRelation('exam', $exam);
        $randomizer = $seed === null ? null : new Randomizer(new Mt19937($seed));
        $lists = [];
        foreach ($items as $item) {
            $eligible = self::eligible($item);
            $lists[$item->id] = $randomizer && $eligible ? $randomizer->shuffleArray($eligible) : $eligible;
        }

        $owner = []; // question id => item id
        $unserved = [];
        foreach ($items as $item) {
            $visited = [];
            if (! self::augment($item->id, $lists, $owner, $visited)) {
                $unserved[] = $item->position;
            }
        }

        $assignment = [];
        $byItem = array_flip($owner);
        foreach ($items as $item) {
            if (isset($byItem[$item->id])) {
                $assignment[$item->id] = $byItem[$item->id];
            }
        }

        return [$assignment, $unserved];
    }

    /** Kuhn's augmenting path: give $itemId a question, moving earlier Items to others if needed. */
    private static function augment(int $itemId, array $lists, array &$owner, array &$visited): bool
    {
        foreach ($lists[$itemId] as $question) {
            if (isset($visited[$question])) {
                continue;
            }
            $visited[$question] = true;
            if (! isset($owner[$question]) || self::augment($owner[$question], $lists, $owner, $visited)) {
                $owner[$question] = $itemId;

                return true;
            }
        }

        return false;
    }
}

<?php

use App\Models\Competence;
use App\Models\Exam;
use App\Models\ExamItem;
use App\Models\Pool;
use App\Models\Question;
use App\Models\Topic;
use App\Models\User;
use App\Support\Exams\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// D-057: an Item draws a Ready question from its pool by competence, difficulty, type and topic
// (each of the last two may be "any"), at the Exam's grade level; every Item gets its own question.

function blueprintItem(Exam $exam, Pool $pool, Competence $competence, array $attributes = []): ExamItem
{
    return ExamItem::factory()->create(array_merge([
        'exam_id' => $exam->id, 'position' => $exam->items()->count() + 1,
        'pool_id' => $pool->id, 'competence_id' => $competence->id, 'difficulty' => 'easy', 'section' => 'subject_1', 'points' => 5,
    ], $attributes));
}

beforeEach(function () {
    $this->examiner = User::factory()->examiner()->create();
    $this->exam = Exam::factory()->for($this->examiner, 'examiner')->create(['grade_level' => 6]);
    $this->pool = Pool::factory()->for($this->examiner, 'examiner')->create();
    $this->competence = Competence::factory()->for($this->examiner, 'examiner')->create();
    $this->topic = Topic::factory()->for($this->examiner, 'examiner')->create();
    $this->q = fn (array $a = []) => poolQuestion($this->examiner, $this->pool, array_merge(['competence_id' => $this->competence->id, 'topic_id' => $this->topic->id], $a));
});

it('lists the Ready questions an Item may draw', function () {
    $match = ($this->q)();
    ($this->q)(['difficulty' => 'hard']);                                    // other difficulty
    ($this->q)(['grade_level' => 7]);                                        // other grade
    ($this->q)(['competence_id' => Competence::factory()->for($this->examiner, 'examiner')->create()->id]);
    $draft = ($this->q)(['status' => 'draft']);                              // not Ready
    Question::factory()->ready()->for($this->examiner, 'examiner')->create(['competence_id' => $this->competence->id, 'difficulty' => 'easy', 'grade_level' => 6]); // not in the pool
    $item = blueprintItem($this->exam, $this->pool, $this->competence);

    expect(Blueprint::eligible($item))->toBe([$match->id]);
});

it('matches type and topic unless the Item says any', function () {
    $short = ($this->q)(['type' => 'short_answer']);
    $choice = ($this->q)(['type' => 'single_choice', 'answer_key' => ['options' => ['1', '2'], 'correct' => 1]]);
    $otherTopic = ($this->q)(['topic_id' => Topic::factory()->for($this->examiner, 'examiner')->create()->id]);

    $any = blueprintItem($this->exam, $this->pool, $this->competence);
    $typed = blueprintItem($this->exam, $this->pool, $this->competence, ['type' => 'single_choice']);
    $topical = blueprintItem($this->exam, $this->pool, $this->competence, ['topic_id' => $this->topic->id]);

    expect(Blueprint::eligible($any))->toEqualCanonicalizing([$short->id, $choice->id, $otherTopic->id])
        ->and(Blueprint::eligible($typed))->toBe([$choice->id])
        ->and(Blueprint::eligible($topical))->toEqualCanonicalizing([$short->id, $choice->id]);
});

it('draws nothing for an incomplete Item or an Exam without a grade level', function () {
    ($this->q)();
    $noPool = blueprintItem($this->exam, $this->pool, $this->competence, ['pool_id' => null]);
    expect(Blueprint::eligible($noPool))->toBe([]);

    $this->exam->update(['grade_level' => null]);
    expect(Blueprint::eligible(blueprintItem($this->exam->fresh(), $this->pool, $this->competence)))->toBe([]);
});

it('gives every Item its own question, also where a greedy pick would fail', function () {
    // Item 1 may take A or B; Item 2 only A. Picking A for Item 1 first would leave Item 2 empty.
    $a = ($this->q)(['type' => 'short_answer']);
    $b = ($this->q)(['type' => 'single_choice', 'answer_key' => ['options' => ['1', '2'], 'correct' => 1]]);
    $one = blueprintItem($this->exam, $this->pool, $this->competence);
    $two = blueprintItem($this->exam, $this->pool, $this->competence, ['type' => 'short_answer']);

    foreach (range(1, 30) as $seed) {
        expect(Blueprint::assign($this->exam->fresh(), $seed))->toBe([$one->id => $b->id, $two->id => $a->id]);
    }
});

it('reports the Items that can\'t all get their own question', function () {
    ($this->q)();
    $one = blueprintItem($this->exam, $this->pool, $this->competence);
    $two = blueprintItem($this->exam, $this->pool, $this->competence);

    expect(Blueprint::assign($this->exam->fresh(), 1))->toBeNull()
        ->and(Blueprint::unserved($this->exam->fresh()))->toBe([2]);
});

it('draws the same for the same seed and varies between seeds', function () {
    foreach (range(1, 6) as $i) {
        ($this->q)();
    }
    blueprintItem($this->exam, $this->pool, $this->competence);
    blueprintItem($this->exam, $this->pool, $this->competence);
    $exam = $this->exam->fresh();

    expect(Blueprint::assign($exam, 42))->toBe(Blueprint::assign($exam, 42));
    $draws = collect(range(1, 40))->map(fn ($seed) => implode('-', Blueprint::assign($exam, $seed)))->unique();
    expect($draws->count())->toBeGreaterThan(5);
});

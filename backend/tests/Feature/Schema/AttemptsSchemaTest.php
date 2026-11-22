<?php

use App\Enums\AttemptStatus;
use App\Models\Answer;
use App\Models\AnswerBaremScore;
use App\Models\AnswerImage;
use App\Models\Attempt;
use App\Models\AttemptItem;
use App\Models\BaremStep;
use App\Models\ExamItem;
use App\Models\Question;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

it('starts an Attempt as started, not auto-submitted and without scores', function () {
    $attempt = Attempt::factory()->create();
    $attempt->refresh();

    expect($attempt->status)->toBe(AttemptStatus::Started)
        ->and($attempt->auto_submitted)->toBeFalse()
        ->and($attempt->submitted_at)->toBeNull()
        ->and($attempt->total_score)->toBeNull();
});

it('refuses impossible attempt numbers, statuses, deadlines, submissions and scores', function () {
    $attempt = Attempt::factory()->create(['attempt_number' => 1]);
    $row = fn (array $values) => array_merge([
        'exam_id' => $attempt->exam_id,
        'candidate_id' => $attempt->candidate_id,
        'attempt_number' => 2,
        'seed' => 42,
        'started_at' => '2026-11-30 10:00:00',
        'expires_at' => '2026-11-30 10:50:00',
    ], $values);

    expectRefused(fn () => DB::table('attempts')->insert($row(['attempt_number' => 0])));
    expectRefused(fn () => DB::table('attempts')->insert($row(['attempt_number' => 1])));
    expectRefused(fn () => DB::table('attempts')->insert($row(['status' => 'paused'])));
    expectRefused(fn () => DB::table('attempts')->insert($row(['expires_at' => '2026-11-30 10:00:00'])));
    expectRefused(fn () => DB::table('attempts')->insert($row(['status' => 'submitted'])));
    expectRefused(fn () => DB::table('attempts')->insert($row(['status' => 'graded', 'submitted_at' => '2026-11-30 10:40:00'])));
    expectRefused(fn () => DB::table('attempts')->insert($row(['subject_1_score' => 31])));
    expectRefused(fn () => DB::table('attempts')->insert($row(['subject_2_score' => 61])));
    expectRefused(fn () => DB::table('attempts')->insert($row(['total_score' => 101])));
    expectRefused(fn () => DB::table('attempts')->insert($row(['subject_1_score' => -1])));

    expect(Attempt::factory()->graded()->create()->total_score)->not->toBeNull();
});

it('never draws the same question twice in one Attempt, and draws each Item once', function () {
    $attemptItem = AttemptItem::factory()->create();
    $attempt = $attemptItem->attempt;
    $otherItem = ExamItem::factory()->create(['exam_id' => $attempt->exam_id]);

    expectRefused(fn () => AttemptItem::factory()->create([
        'attempt_id' => $attempt->id, 'exam_item_id' => $otherItem->id, 'question_id' => $attemptItem->question_id,
    ]));
    expectRefused(fn () => AttemptItem::factory()->create([
        'attempt_id' => $attempt->id, 'exam_item_id' => $attemptItem->exam_item_id,
    ]));

    expect(AttemptItem::factory()->create(['attempt_id' => $attempt->id, 'exam_item_id' => $otherItem->id])->attempt_id)
        ->toBe($attempt->id);
});

it('keeps one answer per Attempt Item with a non-negative version and points', function () {
    $answer = Answer::factory()->create();

    expectRefused(fn () => Answer::factory()->create(['attempt_item_id' => $answer->attempt_item_id]));
    expectRefused(fn () => DB::table('answers')->where('id', $answer->id)->update(['version' => -1]));
    expectRefused(fn () => DB::table('answers')->where('id', $answer->id)->update(['awarded_points' => -0.5]));

    expect($answer->fresh()->version)->toBe(0)
        ->and($answer->fresh()->marked_for_review)->toBeFalse()
        ->and($answer->fresh()->needs_recheck)->toBeFalse();
});

it('allows photo positions 1 to 3 only, once each', function () {
    $answer = Answer::factory()->create();
    AnswerImage::factory()->for($answer)->create(['position' => 1]);
    AnswerImage::factory()->for($answer)->create(['position' => 3]);

    expectRefused(fn () => AnswerImage::factory()->for($answer)->create(['position' => 1]));
    expectRefused(fn () => AnswerImage::factory()->for($answer)->create(['position' => 4]));
    expectRefused(fn () => AnswerImage::factory()->for($answer)->create(['position' => 0]));
});

it('keeps one non-negative barem score per answer and step, and drops it with the step', function () {
    $score = AnswerBaremScore::factory()->create();

    expectRefused(fn () => AnswerBaremScore::factory()->create([
        'answer_id' => $score->answer_id, 'barem_step_id' => $score->barem_step_id,
    ]));
    expectRefused(fn () => DB::table('answer_barem_scores')->where('id', $score->id)->update(['points' => -1]));

    $score->baremStep->delete();
    expect(AnswerBaremScore::count())->toBe(0);
});

it('protects what an Attempt refers to and deletes its own rows with it', function () {
    $attemptItem = AttemptItem::factory()->create();
    $answer = Answer::factory()->create(['attempt_item_id' => $attemptItem->id]);
    AnswerImage::factory()->for($answer)->create(['position' => 1]);
    AnswerBaremScore::factory()->create(['answer_id' => $answer->id]);
    $attempt = $attemptItem->attempt;

    expectRefused(fn () => $attempt->exam->delete());
    expectRefused(fn () => $attempt->candidate->delete());
    expectRefused(fn () => $attemptItem->examItem->delete());
    expectRefused(fn () => $attemptItem->question->delete());

    $attempt->delete();
    expect(AttemptItem::count())->toBe(0)
        ->and(Answer::count())->toBe(0)
        ->and(AnswerImage::count())->toBe(0)
        ->and(AnswerBaremScore::count())->toBe(0);
});

it('navigates candidate, attempts, items, questions, answers, photos and barem scores', function () {
    $attemptItem = AttemptItem::factory()->create();
    $answer = Answer::factory()->create(['attempt_item_id' => $attemptItem->id]);
    $image = AnswerImage::factory()->for($answer)->create(['position' => 1]);
    $score = AnswerBaremScore::factory()->create(['answer_id' => $answer->id]);
    $attempt = $attemptItem->attempt;

    expect($attempt->candidate->attempts->first()->is($attempt))->toBeTrue()
        ->and($attempt->exam->attempts->first()->is($attempt))->toBeTrue()
        ->and($attempt->items->first()->is($attemptItem))->toBeTrue()
        ->and($attemptItem->question->attemptItems->first()->is($attemptItem))->toBeTrue()
        ->and($attemptItem->examItem->attemptItems->first()->is($attemptItem))->toBeTrue()
        ->and($attemptItem->answer->is($answer))->toBeTrue()
        ->and($answer->images->first()->is($image))->toBeTrue()
        ->and($answer->baremScores->first()->is($score))->toBeTrue()
        ->and($score->baremStep->answerScores->first()->is($score))->toBeTrue();
});

it('indexes the uncovered foreign keys and the sealing query', function () {
    expect(hasIndexOn('attempts', 'candidate_id'))->toBeTrue()
        ->and(hasIndexOn('attempts', 'status, expires_at'))->toBeTrue()
        ->and(hasIndexOn('attempt_items', 'exam_item_id'))->toBeTrue()
        ->and(hasIndexOn('attempt_items', 'question_id'))->toBeTrue()
        ->and(hasIndexOn('answers', 'graded_by'))->toBeTrue()
        ->and(hasIndexOn('answer_barem_scores', 'barem_step_id'))->toBeTrue();
});

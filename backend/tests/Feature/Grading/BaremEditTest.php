<?php

use App\Enums\AttemptStatus;
use App\Models\Answer;
use App\Models\AnswerBaremScore;
use App\Models\Attempt;
use App\Models\AttemptItem;
use App\Models\Exam;
use App\Models\ExamItem;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

// C-004 change (P8a): barem steps keep their ids, a barem edit recalculates graded answers and
// flags them for re-check (D-031), and published results lock the barem and answer key (D-046).

/** A Ready 20-point Subject II problem with a barem of 6 + 6 + 8, drawn in a published Exam. */
function baremSetup(array $exam = []): array
{
    $examiner = User::factory()->examiner()->create();
    signInAs($examiner);
    $question = Question::factory()->subjectTwo()->ready()->withBarem()->for($examiner, 'examiner')->create(['points' => 20]);
    $steps = collect([['Triunghi isoscel', 6], ['∢B + ∢C = 140°', 6], ['∢B = 70°', 8]])
        ->map(fn ($s, $i) => $question->baremSteps()->create(['position' => $i + 1, 'description' => $s[0], 'points' => $s[1]]));
    $exam = Exam::factory()->published()->for($examiner, 'examiner')->create($exam);
    $item = ExamItem::factory()->create(['exam_id' => $exam->id, 'position' => 1, 'section' => 'subject_2', 'points' => 20]);

    return compact('examiner', 'question', 'steps', 'exam', 'item');
}

/** A submitted Attempt whose answer to the problem got these points per step, plus an adjustment. */
function gradedAnswer(array $s, array $stepPoints, float $adjustment = 0): Answer
{
    $attempt = Attempt::factory()->submitted()->create(['exam_id' => $s['exam']->id]);
    $attemptItem = AttemptItem::factory()->create([
        'attempt_id' => $attempt->id, 'exam_item_id' => $s['item']->id, 'question_id' => $s['question']->id, 'position' => 1,
        'question_snapshot' => ['section' => 'subject_2', 'type' => 'structured_problem', 'points' => 20, 'statement' => 'În triunghiul ABC …'],
    ]);
    $answer = Answer::factory()->create(['attempt_item_id' => $attemptItem->id, 'answer' => ['value' => 'a) ∢B = 70°']]);
    $answer->adjustment = $adjustment ?: null;
    $answer->awarded_points = max(0, min(20, array_sum($stepPoints) + $adjustment));
    $answer->graded_by = $s['examiner']->id;
    $answer->graded_at = now()->subHour();
    $answer->save();
    foreach ($stepPoints as $i => $points) {
        AnswerBaremScore::factory()->create(['answer_id' => $answer->id, 'barem_step_id' => $s['steps'][$i]->id, 'points' => $points]);
    }

    return $answer;
}

/** The barem as the editor sends it back, from the question's current steps. */
function baremOf(Question $question): array
{
    return test()->getJson("/api/questions/{$question->id}")->assertOk()->json('question.barem');
}

it('returns barem steps with ids and keeps them by id: updated, added, removed', function () {
    $s = baremSetup();
    $barem = baremOf($s['question']);
    expect(array_column($barem, 'id'))->toBe($s['steps']->pluck('id')->all());

    $this->patchJson("/api/questions/{$s['question']->id}", ['barem' => [
        ['id' => $barem[0]['id'], 'description' => 'Triunghiul ABC este isoscel', 'points' => 6],
        ['id' => $barem[2]['id'], 'description' => '∢B = 70°', 'points' => 8],
        ['description' => 'Concluzia', 'points' => 6],
    ]])->assertOk();

    $after = $s['question']->baremSteps()->get();
    expect($after->pluck('id')->take(2)->all())->toBe([$barem[0]['id'], $barem[2]['id']])
        ->and($after->pluck('description')->all())->toBe(['Triunghiul ABC este isoscel', '∢B = 70°', 'Concluzia'])
        ->and($after->pluck('position')->all())->toBe([1, 2, 3])
        ->and($after->pluck('id')->contains($barem[1]['id']))->toBeFalse();
});

it('refuses a barem step id from another question', function () {
    $other = baremSetup();
    $s = baremSetup(); // signed in as this one's Examiner

    $this->patchJson("/api/questions/{$s['question']->id}", ['barem' => [
        ['id' => $other['steps'][0]->id, 'description' => 'Altceva', 'points' => 20],
    ]])->assertUnprocessable()->assertJsonPath('errors.barem.0', 'invalid');

    expect($s['question']->baremSteps()->count())->toBe(3);
});

it('keeps the scores of kept steps when a barem is saved again', function () {
    $s = baremSetup();
    $answer = gradedAnswer($s, [6, 4, 8]);

    $this->patchJson("/api/questions/{$s['question']->id}", ['statement' => 'În triunghiul ABC, AB = AC.', 'barem' => baremOf($s['question'])])->assertOk();

    expect($answer->baremScores()->orderBy('barem_step_id')->pluck('points')->all())->toBe(['6.00', '4.00', '8.00'])
        ->and($answer->fresh()->awarded_points)->toBe('18.00')
        ->and($answer->fresh()->needs_recheck)->toBeFalse();
});

it('recalculates graded answers after a barem edit: capped and flagged when a step went down', function () {
    $s = baremSetup();
    $above = gradedAnswer($s, [6, 4, 8]);
    $below = gradedAnswer($s, [6, 2, 8]);
    $barem = baremOf($s['question']);

    $this->patchJson("/api/questions/{$s['question']->id}", ['barem' => [
        ['id' => $barem[0]['id'], 'description' => 'Triunghiul este isoscel', 'points' => 6], // description only
        ['id' => $barem[1]['id'], 'description' => $barem[1]['description'], 'points' => 3],   // down: 4 > 3
        ['id' => $barem[2]['id'], 'description' => $barem[2]['description'], 'points' => 11],  // up
    ]])->assertOk()->assertJsonPath('regraded', ['answers' => 2, 'flagged' => 1]);

    expect($above->fresh()->awarded_points)->toBe('17.00')
        ->and($above->fresh()->needs_recheck)->toBeTrue()
        ->and($above->baremScores()->where('barem_step_id', $barem[1]['id'])->value('points'))->toBe('3.00')
        ->and($below->fresh()->awarded_points)->toBe('16.00')
        ->and($below->fresh()->needs_recheck)->toBeFalse();
});

it('flags graded answers when a step with points is removed or a step is added', function () {
    $s = baremSetup();
    $answer = gradedAnswer($s, [6, 6, 8]);
    $barem = baremOf($s['question']);

    $this->patchJson("/api/questions/{$s['question']->id}", ['barem' => [
        $barem[0], $barem[1], ['description' => 'Calculul final', 'points' => 8],
    ]])->assertOk()->assertJsonPath('regraded', ['answers' => 1, 'flagged' => 1]);

    expect($answer->fresh()->awarded_points)->toBe('12.00')
        ->and($answer->fresh()->needs_recheck)->toBeTrue();
});

it('keeps a recalculated total between 0 and the points, and flags it', function () {
    $s = baremSetup();
    $answer = gradedAnswer($s, [2, 0, 0], -2);
    $barem = baremOf($s['question']);

    $this->patchJson("/api/questions/{$s['question']->id}", ['barem' => [
        ['id' => $barem[0]['id'], 'description' => $barem[0]['description'], 'points' => 1],
        $barem[1], ['id' => $barem[2]['id'], 'description' => $barem[2]['description'], 'points' => 13],
    ]])->assertOk();

    expect($answer->fresh()->awarded_points)->toBe('0.00')
        ->and($answer->fresh()->needs_recheck)->toBeTrue();
});

it('does not touch answers of an exam whose results are published, nor ungraded answers', function () {
    $s = baremSetup();
    $ungraded = gradedAnswer($s, []);
    $ungraded->awarded_points = null;
    $ungraded->graded_at = null;
    $ungraded->save();
    $barem = baremOf($s['question']);

    $this->patchJson("/api/questions/{$s['question']->id}", ['barem' => [
        ['id' => $barem[0]['id'], 'description' => $barem[0]['description'], 'points' => 2], $barem[1],
        ['id' => $barem[2]['id'], 'description' => $barem[2]['description'], 'points' => 12],
    ]])->assertOk()->assertJsonPath('regraded', ['answers' => 0, 'flagged' => 0]);

    expect($ungraded->fresh()->needs_recheck)->toBeFalse()->and($ungraded->fresh()->awarded_points)->toBeNull();
});

it('locks the barem and the answer key once results are published, and allows other edits', function () {
    $s = baremSetup();
    gradedAnswer($s, [6, 6, 8]);
    $s['exam']->results_published_at = now();
    $s['exam']->save();
    $barem = baremOf($s['question']);
    $id = $s['question']->id;

    $this->patchJson("/api/questions/{$id}", ['barem' => [...array_slice($barem, 0, 2), ['id' => $barem[2]['id'], 'description' => '∢B = 70°', 'points' => 7]]])
        ->dump()->assertUnprocessable()->assertJsonPath('errors.barem.0', 'barem_locked');
    $this->patchJson("/api/questions/{$id}", ['uses_barem' => false])
        ->assertUnprocessable()->assertJsonPath('errors.barem.0', 'barem_locked');
    $this->patchJson("/api/questions/{$id}", ['statement' => 'Enunț corectat.', 'uses_barem' => true, 'barem' => $barem])
        ->assertOk()->assertJsonPath('question.statement', 'Enunț corectat.');

    $choice = Question::factory()->ready()->for($s['examiner'], 'examiner')->create([
        'type' => 'single_choice', 'answer_key' => ['options' => ['12', '36'], 'correct' => 2],
    ]);
    $attempt = Attempt::factory()->create(['exam_id' => $s['exam']->id, 'status' => AttemptStatus::Graded, 'submitted_at' => now(), 'total_score' => 50]);
    AttemptItem::factory()->create(['attempt_id' => $attempt->id, 'question_id' => $choice->id, 'position' => 2]);

    $this->patchJson("/api/questions/{$choice->id}", ['answer_key' => ['options' => ['12', '36'], 'correct' => 1]])
        ->assertUnprocessable()->assertJsonPath('errors.answer_key.0', 'answer_key_locked');
    $this->patchJson("/api/questions/{$choice->id}", ['answer_key' => ['options' => ['12', '36'], 'correct' => 2], 'explanation' => '48 : 4 · 3 = 36.'])
        ->assertOk();
});

it('lets the barem and answer key change while results are not published', function () {
    $s = baremSetup();
    gradedAnswer($s, [6, 6, 8]);

    $this->patchJson("/api/questions/{$s['question']->id}", ['uses_barem' => false])->assertOk();
});

it('refuses a barem edit when the results are published while it is being saved (D-031, PATTERN-007)', function () {
    $s = baremSetup();
    $answer = gradedAnswer($s, [6, 6, 8]);
    $barem = baremOf($s['question']);

    // The race: another request publishes right after this one's first check, as its transaction starts.
    $outside = DB::transactionLevel();
    $published = false;
    DB::beforeExecuting(function () use (&$published, $outside, $s) {
        if (! $published && DB::transactionLevel() > $outside) {
            $published = true;
            DB::table('exams')->where('id', $s['exam']->id)->update(['results_published_at' => now()]);
        }
    });

    // Still 20 in all (D-062): only the lock may refuse it.
    $edited = [[...$barem[0], 'points' => 5], [...$barem[1], 'points' => 7], $barem[2]];
    $this->patchJson("/api/questions/{$s['question']->id}", ['barem' => $edited])
        ->assertUnprocessable()->assertJsonPath('errors.barem.0', 'barem_locked');
    expect((float) $answer->fresh()->awarded_points)->toBe(20.0)
        ->and($answer->fresh()->needs_recheck)->toBeFalse()
        ->and((float) $s['steps'][0]->fresh()->points)->toBe(6.0);
});

it('locks the exam, then the question, before a barem edit or a grade reads the barem (PATTERN-007)', function () {
    $s = baremSetup();
    $answer = gradedAnswer($s, [6, 6, 8]);
    $locks = function (callable $request): array {
        DB::flushQueryLog();
        DB::enableQueryLog();
        $request();
        DB::disableQueryLog();
        $order = [];
        foreach (DB::getQueryLog() as $query) {
            $sql = strtolower($query['query']);
            if (preg_match('/from "(exams|attempts|questions)".* for update/', $sql, $m)) {
                $order[] = $m[1];
            } elseif (str_contains($sql, 'from "barem_steps"')) {
                $order[] = 'steps read';
            }
        }
        // An earlier read (loading the item to show it) is harmless; the barem the request decides on
        // is its last read, which must come after the locks.
        $last = array_search('steps read', array_reverse($order, true), true);

        return array_values(array_filter(array_slice($order, 0, $last + 1), fn ($e, $i) => $e !== 'steps read' || $i === $last, ARRAY_FILTER_USE_BOTH));
    };

    // Same order in both requests (exam before question), so they wait for each other and never deadlock.
    $barem = baremOf($s['question']);
    expect($locks(fn () => $this->patchJson("/api/questions/{$s['question']->id}", ['barem' => $barem])->assertOk()))
        ->toBe(['exams', 'questions', 'steps read']);
    expect($locks(fn () => $this->putJson('/api/grading/items/'.$answer->attempt_item_id, [
        'steps' => $s['steps']->map(fn ($step) => ['id' => $step->id, 'points' => 0])->all(),
    ])->assertOk()))->toBe(['exams', 'attempts', 'questions', 'steps read']);
});

/** baremSetup() with the question still graded by one score: no steps yet, and one answer given 15. */
function singleScoreSetup(): array
{
    $s = baremSetup(['available_until' => now()->subHour()]);
    $s['question']->baremSteps()->delete();
    $s['question']->forceFill(['uses_barem' => false])->save();
    $answer = gradedAnswer($s, []);
    $answer->forceFill(['awarded_points' => 15])->save();
    $answer->attemptItem->attempt->forceFill(['status' => 'graded', 'subject_1_score' => 25, 'subject_2_score' => 15, 'total_score' => 50])->save();

    return [...$s, 'answer' => $answer->fresh()];
}

it('marks answers graded with one score for re-check when the question switches to a barem, keeping their points (Q-086)', function () {
    $s = singleScoreSetup();

    $this->patchJson("/api/questions/{$s['question']->id}", ['uses_barem' => true, 'barem' => [
        ['description' => 'Triunghi isoscel', 'points' => 6], ['description' => '∢B + ∢C = 140°', 'points' => 6], ['description' => '∢B = 70°', 'points' => 8],
    ]])->assertOk()->assertJsonPath('regraded.flagged', 1);

    $answer = $s['answer']->fresh();
    expect($answer->needs_recheck)->toBeTrue()
        ->and((float) $answer->awarded_points)->toBe(15.0)
        ->and($answer->baremScores()->count())->toBe(0);
    $this->getJson("/api/exams/{$s['exam']->id}/grading")->assertJsonPath('counts.recheck', 1)->assertJsonPath('publish.missing', ['recheck']);
    $this->postJson("/api/exams/{$s['exam']->id}/results")->assertUnprocessable()->assertJsonPath('missing', ['recheck']);
});

it('publishes once those answers are graded on the barem steps (Q-086, Q-079)', function () {
    $s = singleScoreSetup();
    $this->patchJson("/api/questions/{$s['question']->id}", ['uses_barem' => true, 'barem' => [
        ['description' => 'Triunghi isoscel', 'points' => 6], ['description' => '∢B + ∢C = 140°', 'points' => 6], ['description' => '∢B = 70°', 'points' => 8],
    ]])->assertOk();
    $steps = $s['question']->baremSteps()->orderBy('position')->get();

    $this->putJson("/api/grading/items/{$s['answer']->attempt_item_id}", ['points' => 15])->assertUnprocessable()->assertJsonPath('errors.steps.0', 'required');
    $this->putJson("/api/grading/items/{$s['answer']->attempt_item_id}", ['steps' => $steps->map(fn ($step, $i) => ['id' => $step->id, 'points' => [6, 6, 4][$i]])->all()])
        ->assertOk()->assertJsonPath('item.needs_recheck', false)->assertJsonPath('item.awarded_points', 16);

    $this->postJson("/api/exams/{$s['exam']->id}/results")->assertOk();
});

it('leaves graded answers alone when a save sends the same barem, as the editor does on every save', function () {
    $s = baremSetup();
    $answer = gradedAnswer($s, [6, 3, 0]);
    $before = $answer->fresh()->updated_at;
    $this->travel(1)->minutes();

    $response = $this->patchJson("/api/questions/{$s['question']->id}", ['explanation' => 'Folosește suma unghiurilor.', 'barem' => baremOf($s['question'])])->assertOk();

    expect($response->json())->not->toHaveKey('regraded')
        ->and($answer->fresh()->updated_at->equalTo($before))->toBeTrue()
        ->and($answer->baremScores()->count())->toBe(3);
});

<?php

use App\Enums\AttemptStatus;
use App\Models\Answer;
use App\Models\AnswerImage;
use App\Models\Attempt;
use App\Models\AttemptItem;
use App\Models\Competence;
use App\Models\Exam;
use App\Models\ExamItem;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

// C-007 (P8a): the Examiner grades Subject II (D-005, D-031) and publishes the results (D-019, Q-076).

/**
 * A published exam whose window has closed, with three 20-point problems (items 7–9): M6-TR-004 with a
 * barem 6 + 6 + 8, M6-UG-005 without one, M6-RP-006 with a barem 10 + 10; and `$candidates`
 * submitted Attempts, each with 25 Subject I points, answers to 7 and 8 and nothing for 9.
 */
function gradingSetup(int $candidates = 2, array $exam = []): array
{
    $examiner = User::factory()->examiner()->create();
    signInAs($examiner);
    $exam = Exam::factory()->published()->for($examiner, 'examiner')->create(array_merge([
        'title' => 'Evaluare Unitatea 3', 'available_from' => now()->subHours(3), 'available_until' => now()->subHour(),
    ], $exam));
    $competence = Competence::factory()->for($examiner, 'examiner')->create(['code' => 'C4']);
    $questions = [];
    foreach ([7 => ['M6-TR-004', [6, 6, 8]], 8 => ['M6-UG-005', null], 9 => ['M6-RP-006', [10, 10]]] as $position => [$code, $barem]) {
        $question = Question::factory()->subjectTwo()->ready()->for($examiner, 'examiner')->create(['code' => $code, 'points' => 20, 'uses_barem' => $barem !== null]);
        foreach ($barem ?? [] as $i => $points) {
            $question->baremSteps()->create(['position' => $i + 1, 'description' => 'Pasul '.($i + 1), 'points' => $points]);
        }
        $item = ExamItem::factory()->create(['exam_id' => $exam->id, 'position' => $position, 'section' => 'subject_2', 'points' => 20, 'competence_id' => $competence->id]);
        $questions[$position] = compact('question', 'item');
    }

    $attempts = [];
    foreach (range(1, $candidates) as $n) {
        $candidate = User::factory()->candidate()->create(['first_name' => "Candidat{$n}", 'last_name' => 'Pop']);
        $attempt = Attempt::factory()->submitted()->create(['exam_id' => $exam->id, 'candidate_id' => $candidate->id, 'subject_1_score' => 25]);
        foreach ($questions as $position => $q) {
            $attemptItem = AttemptItem::factory()->create([
                'attempt_id' => $attempt->id, 'exam_item_id' => $q['item']->id, 'question_id' => $q['question']->id, 'position' => $position,
                'question_snapshot' => ['section' => 'subject_2', 'type' => 'structured_problem', 'points' => 20, 'statement' => "Problema {$position}"],
                'expected_answer' => null,
            ]);
            if ($position !== 9) {
                Answer::factory()->create(['attempt_item_id' => $attemptItem->id, 'answer' => ['value' => "Rezolvarea {$position}"]]);
            }
        }
        $attempts[] = $attempt;
    }

    return compact('examiner', 'exam', 'questions', 'attempts');
}

function gradingItem(Attempt $attempt, int $position): AttemptItem
{
    return $attempt->items()->where('position', $position)->firstOrFail();
}

/** Grades all three problems of an Attempt: barem steps for 7 and 9, one score for 8. */
function gradeAll(array $s, Attempt $attempt, array $seven, float $eight, array $nine): void
{
    $steps = fn (int $position, array $points) => $s['questions'][$position]['question']->baremSteps()->get()
        ->map(fn ($step, $i) => ['id' => $step->id, 'points' => $points[$i]])->all();
    test()->putJson('/api/grading/items/'.gradingItem($attempt, 7)->id, ['steps' => $steps(7, $seven)])->assertOk();
    test()->putJson('/api/grading/items/'.gradingItem($attempt, 8)->id, ['points' => $eight])->assertOk();
    test()->putJson('/api/grading/items/'.gradingItem($attempt, 9)->id, ['steps' => $steps(9, $nine)])->assertOk();
}

it('shows the queue only to the exam\'s Examiner', function () {
    $s = gradingSetup();

    $this->getJson("/api/exams/{$s['exam']->id}/grading")->assertOk();

    signInAs(User::factory()->examiner()->create());
    $this->getJson("/api/exams/{$s['exam']->id}/grading")->assertNotFound();
    $this->putJson('/api/grading/items/'.gradingItem($s['attempts'][0], 8)->id, ['points' => 10])->assertNotFound();

    signInAs(User::factory()->candidate()->create());
    $this->getJson("/api/exams/{$s['exam']->id}/grading")->assertForbidden();
});

it('lists the Subject II answers per problem and per Candidate, unanswered ones included', function () {
    $s = gradingSetup();

    $queue = $this->getJson("/api/exams/{$s['exam']->id}/grading")->assertOk()->json();

    expect($queue['exam'])->toMatchArray(['id' => $s['exam']->id, 'title' => 'Evaluare Unitatea 3', 'submissions' => 2, 'results_published_at' => null])
        ->and($queue['items'])->toBe([
            ['position' => 7, 'competence' => 'C4', 'points' => 20, 'graded' => 0, 'total' => 2],
            ['position' => 8, 'competence' => 'C4', 'points' => 20, 'graded' => 0, 'total' => 2],
            ['position' => 9, 'competence' => 'C4', 'points' => 20, 'graded' => 0, 'total' => 2],
        ])
        ->and($queue['counts'])->toBe(['total' => 6, 'graded' => 0, 'to_grade' => 6, 'recheck' => 0])
        ->and($queue['answers'])->toHaveCount(6)
        ->and($queue['answers'][0])->toMatchArray([
            'attempt_item_id' => gradingItem($s['attempts'][0], 7)->id, 'candidate' => 'Candidat1 Pop', 'number' => 1,
            'position' => 7, 'question_code' => 'M6-TR-004', 'photos' => 0, 'answered' => true, 'status' => 'to_grade', 'awarded_points' => null,
        ])
        ->and(collect($queue['answers'])->firstWhere('attempt_item_id', gradingItem($s['attempts'][1], 9)->id))
        ->toMatchArray(['candidate' => 'Candidat2 Pop', 'number' => 2, 'answered' => false, 'status' => 'to_grade'])
        ->and($queue['publish'])->toMatchArray(['ready' => false, 'missing' => ['ungraded']]);
});

it('shows one answer with its statement, written steps, photos and the live barem', function () {
    Storage::fake();
    $s = gradingSetup(1);
    $item = gradingItem($s['attempts'][0], 7);
    AnswerImage::factory()->create(['answer_id' => $item->answer->id, 'position' => 1, 'original_name' => 'IMG_1.jpg']);

    $shown = $this->getJson("/api/grading/items/{$item->id}")->assertOk()->json('item');

    expect($shown)->toMatchArray([
        'attempt_item_id' => $item->id, 'position' => 7, 'question_code' => 'M6-TR-004', 'candidate' => 'Candidat1 Pop',
        'statement' => 'Problema 7', 'points' => 20, 'text' => 'Rezolvarea 7', 'uses_barem' => true,
        'scores' => [], 'adjustment' => null, 'comment' => null, 'awarded_points' => null, 'needs_recheck' => false,
    ])
        ->and(collect($shown['photos'])->pluck('name')->all())->toBe(['IMG_1.jpg'])
        ->and(collect($shown['barem'])->map(fn ($b) => ['description' => $b['description'], 'points' => $b['points'], 'modified' => $b['modified']])->all())->toBe([
            ['description' => 'Pasul 1', 'points' => 6, 'modified' => false],
            ['description' => 'Pasul 2', 'points' => 6, 'modified' => false],
            ['description' => 'Pasul 3', 'points' => 8, 'modified' => false],
        ]);
});

it('grades with the barem: no, part or all of each step, plus an adjustment and a comment', function () {
    $s = gradingSetup(1);
    $item = gradingItem($s['attempts'][0], 7);
    $steps = $s['questions'][7]['question']->baremSteps()->get();

    $this->putJson("/api/grading/items/{$item->id}", [
        'steps' => [['id' => $steps[0]->id, 'points' => 6], ['id' => $steps[1]->id, 'points' => 2.5], ['id' => $steps[2]->id, 'points' => 0]],
        'adjustment' => 1, 'comment' => 'La b) lipsește concluzia.',
    ])->assertOk()
        ->assertJsonPath('item.awarded_points', 9.5)
        ->assertJsonPath('item.scores', [(string) $steps[0]->id => 6, (string) $steps[1]->id => 2.5, (string) $steps[2]->id => 0])
        ->assertJsonPath('item.comment', 'La b) lipsește concluzia.');

    $answer = $item->answer->fresh();
    expect($answer->graded_by)->toBe($s['examiner']->id)
        ->and($answer->graded_at)->not->toBeNull()
        ->and($answer->baremScores()->count())->toBe(3);
});

it('refuses barem grades above a step, with a step missing, or a total outside 0..20', function () {
    $s = gradingSetup(1);
    $item = gradingItem($s['attempts'][0], 7);
    $steps = $s['questions'][7]['question']->baremSteps()->get();
    $all = fn (array $points) => collect($steps)->map(fn ($step, $i) => ['id' => $step->id, 'points' => $points[$i]])->all();

    $this->putJson("/api/grading/items/{$item->id}", ['steps' => $all([7, 0, 0])])->assertUnprocessable()->assertJsonPath('errors.steps.0', 'invalid');
    $this->putJson("/api/grading/items/{$item->id}", ['steps' => array_slice($all([6, 6, 8]), 0, 2)])->assertUnprocessable()->assertJsonPath('errors.steps.0', 'invalid');
    $this->putJson("/api/grading/items/{$item->id}", ['steps' => $all([6, 6, 8]), 'adjustment' => 1])->assertUnprocessable()->assertJsonPath('errors.adjustment.0', 'out_of_range');
    $this->putJson("/api/grading/items/{$item->id}", ['steps' => $all([1, 0, 0]), 'adjustment' => -2])->assertUnprocessable()->assertJsonPath('errors.adjustment.0', 'out_of_range');
    $this->putJson("/api/grading/items/{$item->id}", ['points' => 12])->assertUnprocessable()->assertJsonPath('errors.steps.0', 'required');

    expect($item->answer->fresh()->graded_at)->toBeNull();
});

it('grades without a barem with one score between 0 and 20, also an unanswered problem', function () {
    $s = gradingSetup(1);
    $eight = gradingItem($s['attempts'][0], 8);

    $this->putJson("/api/grading/items/{$eight->id}", ['points' => 21])->assertUnprocessable()->assertJsonPath('errors.points.0', 'invalid');
    $this->putJson("/api/grading/items/{$eight->id}", ['steps' => []])->assertUnprocessable()->assertJsonPath('errors.points.0', 'required');
    $this->putJson("/api/grading/items/{$eight->id}", ['points' => 14, 'comment' => 'Raționament bun.'])->assertOk()->assertJsonPath('item.awarded_points', 14);

    $nine = gradingItem($s['attempts'][0], 9);
    $steps = $s['questions'][9]['question']->baremSteps()->pluck('id');
    $this->putJson("/api/grading/items/{$nine->id}", ['steps' => [['id' => $steps[0], 'points' => 0], ['id' => $steps[1], 'points' => 0]]])->assertOk();
    expect($nine->fresh()->answer->awarded_points)->toBe('0.00')->and($nine->fresh()->answer->answer)->toBeNull();
});

it('marks the Attempt graded with its Subject II score and total once every problem is graded', function () {
    $s = gradingSetup(1);
    $attempt = $s['attempts'][0];
    $steps = $s['questions'][7]['question']->baremSteps()->pluck('id');

    $this->putJson('/api/grading/items/'.gradingItem($attempt, 7)->id, ['steps' => [['id' => $steps[0], 'points' => 6], ['id' => $steps[1], 'points' => 6], ['id' => $steps[2], 'points' => 4]]])->assertOk();
    expect($attempt->fresh()->status)->toBe(AttemptStatus::Submitted);

    gradeAll($s, $attempt, [6, 6, 4], 14, [10, 5]);

    $attempt->refresh();
    expect($attempt->status)->toBe(AttemptStatus::Graded)
        ->and($attempt->subject_2_score)->toBe('45.00')
        ->and($attempt->total_score)->toBe('80.00'); // 10 + 25 + 45

    $this->putJson('/api/grading/items/'.gradingItem($attempt, 8)->id, ['points' => 20])->assertOk();
    expect($attempt->fresh()->total_score)->toBe('86.00');
});

it('clears the re-check mark when an answer is graded again', function () {
    $s = gradingSetup(1);
    $item = gradingItem($s['attempts'][0], 8);
    $this->putJson("/api/grading/items/{$item->id}", ['points' => 10])->assertOk();
    $item->answer->forceFill(['needs_recheck' => true])->save();

    $this->getJson("/api/exams/{$s['exam']->id}/grading")->assertJsonPath('counts.recheck', 1);
    $this->putJson("/api/grading/items/{$item->id}", ['points' => 12])->assertOk()->assertJsonPath('item.needs_recheck', false);
});

it('marks barem steps changed since the answer was graded', function () {
    $s = gradingSetup(1);
    $item = gradingItem($s['attempts'][0], 7);
    $steps = $s['questions'][7]['question']->baremSteps()->get();
    $this->putJson("/api/grading/items/{$item->id}", ['steps' => $steps->map(fn ($step) => ['id' => $step->id, 'points' => 0])->all()])->assertOk();
    $this->travel(1)->minutes();
    $steps[1]->update(['points' => 5]);
    $steps[2]->update(['points' => 9]);

    expect(collect($this->getJson("/api/grading/items/{$item->id}")->json('item.barem'))->pluck('modified')->all())->toBe([false, true, true]);
});

it('publishes only when every Attempt is graded, none is running and the window has closed (Q-076)', function () {
    $s = gradingSetup(1, ['available_until' => now()->addHour()]);
    $results = fn (array $body = []) => $this->postJson("/api/exams/{$s['exam']->id}/results", $body);

    $results()->assertUnprocessable()->assertJsonPath('errors.status.0', 'results_not_ready')->assertJsonPath('missing', ['ungraded', 'window_open']);

    gradeAll($s, $s['attempts'][0], [6, 6, 8], 20, [10, 10]);
    $open = Attempt::factory()->create(['exam_id' => $s['exam']->id, 'status' => AttemptStatus::InProgress, 'expires_at' => now()->addMinutes(30)]);
    $results()->assertUnprocessable()->assertJsonPath('missing', ['open_attempts', 'window_open']);

    $s['exam']->update(['available_until' => now()->subMinute()]);
    $open->forceFill(['started_at' => now()->subHour(), 'expires_at' => now()->subMinutes(5)])->save(); // past the grace: sealed first, then it needs grading
    $results()->assertUnprocessable()->assertJsonPath('missing', ['ungraded']);
    expect($open->fresh()->status)->toBe(AttemptStatus::Submitted);
});

it('does not publish while an answer is marked for re-check, until it is graded again (Q-079)', function () {
    $s = gradingSetup(1);
    gradeAll($s, $s['attempts'][0], [6, 6, 8], 20, [10, 10]);
    $item = gradingItem($s['attempts'][0], 8);
    $item->answer->forceFill(['needs_recheck' => true])->save();

    $this->getJson("/api/exams/{$s['exam']->id}/grading")->assertJsonPath('publish.ready', false)->assertJsonPath('publish.missing', ['recheck']);
    $this->postJson("/api/exams/{$s['exam']->id}/results")->assertUnprocessable()->assertJsonPath('missing', ['recheck']);

    $this->putJson("/api/grading/items/{$item->id}", ['points' => 18])->assertOk();
    $this->postJson("/api/exams/{$s['exam']->id}/results")->assertOk();
});

it('publishes the results with the cohort note, once', function () {
    $s = gradingSetup(1);
    gradeAll($s, $s['attempts'][0], [6, 6, 8], 20, [10, 10]);

    $this->postJson("/api/exams/{$s['exam']->id}/results", ['cohort_note' => 'Nu uitați concluzia fiecărei demonstrații.'])->assertOk()
        ->assertJsonPath('exam.cohort_note', 'Nu uitați concluzia fiecărei demonstrații.');

    expect($s['exam']->fresh()->results_published_at)->not->toBeNull();
    $this->postJson("/api/exams/{$s['exam']->id}/results")->assertConflict()->assertJsonPath('code', 'results_published');
    $this->putJson('/api/grading/items/'.gradingItem($s['attempts'][0], 8)->id, ['points' => 10])->assertConflict()->assertJsonPath('code', 'results_published');
});

it('refuses a grade when the results are published while it is being saved (D-019, PATTERN-007)', function () {
    $s = gradingSetup(1);
    gradeAll($s, $s['attempts'][0], [6, 6, 8], 20, [10, 10]);
    $item = gradingItem($s['attempts'][0], 8);

    // The race: another request publishes right after this one's first check, as its transaction starts.
    $outside = DB::transactionLevel();
    $published = false;
    DB::beforeExecuting(function () use (&$published, $outside, $s) {
        if (! $published && DB::transactionLevel() > $outside) {
            $published = true;
            DB::table('exams')->where('id', $s['exam']->id)->update(['results_published_at' => now()]);
        }
    });

    $this->putJson("/api/grading/items/{$item->id}", ['points' => 5])->assertConflict()->assertJsonPath('code', 'results_published');
    expect((float) $item->answer->fresh()->awarded_points)->toBe(20.0)
        ->and($s['attempts'][0]->fresh()->total_score)->toBe('95.00');
});

it('gives the mean and median of the grades, counting each Candidate\'s Attempt by the score policy (D-012)', function (string $policy, int|float $mean) {
    $s = gradingSetup(2, ['score_policy' => $policy, 'max_attempts' => 2]);
    gradeAll($s, $s['attempts'][0], [6, 6, 8], 20, [10, 10]); // 10 + 25 + 60 = 95
    gradeAll($s, $s['attempts'][1], [0, 0, 0], 5, [0, 0]);    // 10 + 25 + 5 = 40
    Attempt::factory()->create([
        'exam_id' => $s['exam']->id, 'candidate_id' => $s['attempts'][0]->candidate_id, 'attempt_number' => 2,
        'status' => AttemptStatus::Graded, 'submitted_at' => now(), 'subject_1_score' => 25, 'subject_2_score' => 25, 'total_score' => 60,
    ]);

    $this->getJson("/api/exams/{$s['exam']->id}/grading")->assertOk()
        ->assertJsonPath('publish.mean', $mean)
        ->assertJsonPath('publish.median', $mean);
})->with([
    'highest' => ['highest', 6.75], // (9.5 + 4) / 2
    'latest' => ['latest', 5],      // (6 + 4) / 2; JSON has no 5.0
]);

it('streams a photo of an answer only to the exam\'s Examiner', function () {
    Storage::fake();
    $s = gradingSetup(1);
    $image = AnswerImage::factory()->create(['answer_id' => gradingItem($s['attempts'][0], 7)->answer->id, 'path' => 'answers/a.jpg']);
    Storage::put('answers/a.jpg', 'jpeg-bytes');

    expect($this->get("/api/grading/images/{$image->id}")->assertOk()->streamedContent())->toBe('jpeg-bytes');

    signInAs(User::factory()->examiner()->create());
    $this->get("/api/grading/images/{$image->id}")->assertNotFound();
});

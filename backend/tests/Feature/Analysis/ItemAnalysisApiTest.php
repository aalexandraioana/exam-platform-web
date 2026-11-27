<?php

use App\Enums\AttemptStatus;
use App\Models\Answer;
use App\Models\Attempt;
use App\Models\AttemptItem;
use App\Models\Competence;
use App\Models\Exam;
use App\Models\ExamItem;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// C-008 (P10): Item Analysis of an exam, from each Candidate's counted, graded Attempt (D-047, Q-093–Q-097).

/**
 * A published exam with two competences: C1 holds Item 1 (single choice, 5 points, drawn from
 * M6-A or M6-B) and Item 2 (short answer, 5 points); C2 holds Item 7 (a 20-point problem).
 */
function analysisSetup(array $exam = []): array
{
    $examiner = User::factory()->examiner()->create();
    signInAs($examiner);
    $exam = Exam::factory()->published()->for($examiner, 'examiner')->create(array_merge(['title' => 'Evaluare Unitatea 3'], $exam));
    $c1 = Competence::factory()->for($examiner, 'examiner')->create(['code' => 'C1', 'description' => 'Calculează fracții']);
    $c2 = Competence::factory()->for($examiner, 'examiner')->create(['code' => 'C2', 'description' => 'Rezolvă probleme']);
    $items = [
        1 => ExamItem::factory()->create(['exam_id' => $exam->id, 'position' => 1, 'section' => 'subject_1', 'points' => 5, 'competence_id' => $c1->id]),
        2 => ExamItem::factory()->create(['exam_id' => $exam->id, 'position' => 2, 'section' => 'subject_1', 'points' => 5, 'competence_id' => $c1->id]),
        7 => ExamItem::factory()->create(['exam_id' => $exam->id, 'position' => 7, 'section' => 'subject_2', 'points' => 20, 'competence_id' => $c2->id]),
    ];
    $single = ['options' => ['12', '36', '32', '64'], 'correct' => 2];
    $questions = [
        'A' => Question::factory()->ready()->for($examiner, 'examiner')->create(['code' => 'M6-A', 'type' => 'single_choice', 'answer_key' => $single]),
        'B' => Question::factory()->ready()->for($examiner, 'examiner')->create(['code' => 'M6-B', 'type' => 'single_choice', 'answer_key' => $single]),
        'S' => Question::factory()->ready()->for($examiner, 'examiner')->create(['code' => 'M6-S', 'type' => 'short_answer']),
        'P' => Question::factory()->subjectTwo()->ready()->for($examiner, 'examiner')->create(['code' => 'M6-P', 'points' => 20]),
    ];

    return compact('examiner', 'exam', 'items', 'questions');
}

/**
 * One Attempt with its answers. `$scores` = [item 1 points, item 2 points, item 7 points]; item 1
 * is drawn from question `$q1` with options shown in `$order`, the Candidate choosing shown
 * position `$shown`. A graded Attempt gets the matching scores and total (10 baseline points).
 */
function analysisAttempt(array $s, ?User $candidate, array $scores, string $q1 = 'A', ?int $shown = null, int $number = 1, AttemptStatus $status = AttemptStatus::Graded, bool $recheck = false): Attempt
{
    [$one, $two, $seven] = $scores;
    $graded = $status === AttemptStatus::Graded;
    $attempt = Attempt::factory()->create([
        'exam_id' => $s['exam']->id, 'candidate_id' => ($candidate ?? User::factory()->candidate()->create())->id,
        'attempt_number' => $number, 'status' => $status, 'submitted_at' => now(),
        'subject_1_score' => $one + $two, 'subject_2_score' => $graded ? $seven : null, 'total_score' => $graded ? 10 + $one + $two + $seven : null,
    ]);
    $order = [2, 1, 3, 4];
    $rows = [
        1 => [$s['questions'][$q1], ['section' => 'subject_1', 'type' => 'single_choice', 'points' => 5], ['option_order' => $order], $shown, $one],
        2 => [$s['questions']['S'], ['section' => 'subject_1', 'type' => 'short_answer', 'points' => 5], ['answer' => '36'], '36', $two],
        7 => [$s['questions']['P'], ['section' => 'subject_2', 'type' => 'structured_problem', 'points' => 20], null, 'Rezolvare', $graded ? $seven : null],
    ];
    foreach ($rows as $position => [$question, $snapshot, $expected, $value, $points]) {
        $item = AttemptItem::factory()->create([
            'attempt_id' => $attempt->id, 'exam_item_id' => $s['items'][$position]->id, 'question_id' => $question->id,
            'position' => $position, 'question_snapshot' => $snapshot, 'expected_answer' => $expected,
        ]);
        Answer::factory()->create([
            'attempt_item_id' => $item->id, 'answer' => $value === null ? null : ['value' => $value],
            'awarded_points' => $points, 'graded_at' => $points === null ? null : now(), 'needs_recheck' => $position === 7 && $recheck,
        ]);
    }

    return $attempt;
}

function analysisItem(array $body, int $position): array
{
    return collect($body['competences'])->flatMap(fn ($c) => $c['items'])->firstWhere('position', $position);
}

it('shows the analysis only to the exam\'s Examiner', function () {
    $s = analysisSetup();

    $this->getJson("/api/exams/{$s['exam']->id}/analysis")->assertOk();

    signInAs(User::factory()->examiner()->create());
    $this->getJson("/api/exams/{$s['exam']->id}/analysis")->assertNotFound();

    signInAs(User::factory()->candidate()->create());
    $this->getJson("/api/exams/{$s['exam']->id}/analysis")->assertForbidden();
});

it('has nothing to measure before any Attempt is graded', function () {
    $s = analysisSetup(['published_at' => null]);

    $body = $this->getJson("/api/exams/{$s['exam']->id}/analysis")->assertOk()->json();

    expect($body)->toMatchArray(['graded' => 0, 'submissions' => 0, 'recheck' => 0, 'mean' => null, 'median' => null])
        ->and(analysisItem($body, 1))->toMatchArray(['n' => 0, 'p' => null, 'r' => null, 'flags' => [], 'questions' => []]);
});

it('measures each Item, groups by competence and counts its weak Items (Q-096)', function () {
    $s = analysisSetup();
    // Item 1 is answered right by the two strongest Candidates; item 2 by everyone; item 7 rises with the total.
    analysisAttempt($s, null, [5, 5, 18], shown: 1);
    analysisAttempt($s, null, [5, 5, 12], shown: 1);
    analysisAttempt($s, null, [0, 5, 6], shown: 2);
    analysisAttempt($s, null, [0, 5, 2], shown: 3);

    $body = $this->getJson("/api/exams/{$s['exam']->id}/analysis")->assertOk()->json();

    expect($body)->toMatchArray(['exam' => ['id' => $s['exam']->id, 'title' => 'Evaluare Unitatea 3'], 'graded' => 4, 'submissions' => 4, 'recheck' => 0])
        ->and(collect($body['competences'])->map(fn ($c) => [$c['code'], $c['description'], $c['p'], $c['weak']])->all())->toBe([
            ['C1', 'Calculează fracții', 0.75, 1], // (10 + 20) / 40; item 2 is too easy
            ['C2', 'Rezolvă probleme', 0.475, 0],  // 38 / 80
        ])
        ->and(analysisItem($body, 1))->toMatchArray(['section' => 'subject_1', 'points' => 5, 'n' => 4, 'p' => 0.5, 'flags' => []])
        ->and(analysisItem($body, 2))->toMatchArray(['n' => 4, 'p' => 1.0, 'r' => null, 'flags' => ['too_easy'], 'not_enough_data' => true])
        ->and(analysisItem($body, 7)['p'])->toBe(0.475);
    // Item 1's rest scores are 23, 17, 11, 7: r with 5, 5, 0, 0.
    expect(analysisItem($body, 1)['r'])->toBe(0.9073);
});

it('measures each question on the Attempts that drew it, with its options counted in their original order', function () {
    $s = analysisSetup();
    // Shown 1 is original 2 (the correct one, "36"); shown 2 is original 1; shown 3 is original 3.
    analysisAttempt($s, null, [5, 5, 18], 'A', shown: 1);
    analysisAttempt($s, null, [0, 5, 6], 'A', shown: 2);
    analysisAttempt($s, null, [5, 0, 12], 'B', shown: 1);
    analysisAttempt($s, null, [0, 0, 2], 'B', shown: null);

    $questions = collect(analysisItem($this->getJson("/api/exams/{$s['exam']->id}/analysis")->assertOk()->json(), 1)['questions'])->keyBy('code');

    expect($questions->keys()->all())->toBe(['M6-A', 'M6-B'])
        ->and($questions['M6-A'])->toMatchArray(['id' => $s['questions']['A']->id, 'n' => 2, 'p' => 0.5, 'r' => 1.0])
        ->and($questions['M6-B'])->toMatchArray(['n' => 2, 'p' => 0.5])
        ->and($questions['M6-A']['options'])->toBe([
            ['option' => 1, 'label' => '12', 'correct' => false, 'count' => 1, 'share' => 0.5, 'unused' => false],
            ['option' => 2, 'label' => '36', 'correct' => true, 'count' => 1, 'share' => 0.5, 'unused' => false],
            ['option' => 3, 'label' => '32', 'correct' => false, 'count' => 0, 'share' => 0.0, 'unused' => true],
            ['option' => 4, 'label' => '64', 'correct' => false, 'count' => 0, 'share' => 0.0, 'unused' => true],
        ])
        ->and(array_column($questions['M6-B']['options'], 'count'))->toBe([0, 1, 0, 0]); // the unanswered one chose nothing
    expect(collect(analysisItem($this->getJson("/api/exams/{$s['exam']->id}/analysis")->json(), 2)['questions'])->first()['options'])->toBeNull();
});

it('uses only each Candidate\'s counted Attempt and leaves ungraded ones out (Q-093, Q-094)', function (string $policy, float $p) {
    $s = analysisSetup(['score_policy' => $policy, 'max_attempts' => 2]);
    $ana = User::factory()->candidate()->create();
    analysisAttempt($s, $ana, [5, 5, 18], number: 1);                    // total 38
    analysisAttempt($s, $ana, [0, 5, 6], number: 2);                     // total 21, the latest
    analysisAttempt($s, null, [0, 0, 2]);
    analysisAttempt($s, null, [5, 5, 0], status: AttemptStatus::Submitted); // not graded yet

    $body = $this->getJson("/api/exams/{$s['exam']->id}/analysis")->assertOk()->json();

    expect($body)->toMatchArray(['graded' => 3, 'submissions' => 4])
        ->and(analysisItem($body, 1))->toMatchArray(['n' => 2, 'p' => $p]);
})->with([
    'highest' => ['highest', 0.5],
    'latest' => ['latest', 0.0],
]);

it('counts the later Attempt when a Candidate\'s best totals are tied (Q-097)', function () {
    $s = analysisSetup(['score_policy' => 'highest', 'max_attempts' => 2]);
    $ana = User::factory()->candidate()->create();
    // Same total (20), different answers: the later one, 0 on item 1, counts.
    $earlier = analysisAttempt($s, $ana, [5, 0, 5], number: 1);
    $later = analysisAttempt($s, $ana, [0, 5, 5], number: 2);
    analysisAttempt($s, null, [5, 5, 18]);
    $read = fn () => analysisItem($this->getJson("/api/exams/{$s['exam']->id}/analysis")->assertOk()->json(), 1)['p'];

    expect($read())->toBe(0.5);
    // An unrelated update rewrites the earlier Attempt's row; the choice stays the same.
    $earlier->touch();
    $later->fresh()->touch();
    $earlier->fresh()->touch();
    expect($read())->toBe(0.5);
});

it('counts the answers marked for re-check in the counted Attempts', function () {
    $s = analysisSetup(['score_policy' => 'latest', 'max_attempts' => 2]);
    $ana = User::factory()->candidate()->create();
    analysisAttempt($s, $ana, [5, 5, 18], number: 1, recheck: true); // not counted under latest
    analysisAttempt($s, $ana, [0, 5, 6], number: 2, recheck: true);
    analysisAttempt($s, null, [0, 0, 2]);

    expect($this->getJson("/api/exams/{$s['exam']->id}/analysis")->assertOk()->json('recheck'))->toBe(1);
});

it('gives the same mean and median as the grading screen', function () {
    $s = analysisSetup();
    analysisAttempt($s, null, [5, 5, 50]); // grade 7
    analysisAttempt($s, null, [5, 5, 20]); // grade 4

    $this->getJson("/api/exams/{$s['exam']->id}/analysis")->assertOk()
        ->assertJsonPath('mean', 5.5)->assertJsonPath('median', 5.5);
    $this->getJson("/api/exams/{$s['exam']->id}/grading")->assertOk()
        ->assertJsonPath('publish.mean', 5.5)->assertJsonPath('publish.median', 5.5);
});

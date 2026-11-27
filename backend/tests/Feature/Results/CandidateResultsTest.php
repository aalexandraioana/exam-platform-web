<?php

use App\Enums\MembershipStatus;
use App\Models\AttemptItem;
use App\Models\ClassMembership;
use App\Models\ExamItem;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

// P8b · C-006: the Candidate's results, only after publication (D-019): every submitted Attempt with
// its grade and the counted one by the score policy (D-012, Q-084); Subject I with the answer, the
// correct answer in the shown order (D-045), the points and the explanation (Q-082); Subject II with
// the written steps, own photos, points, comment and barem steps earned (Q-083); no class statistics
// (Q-085). Items: 1 single choice ("36" correct, original 2), 2 short answer {a} + 10, 3 true/false,
// 4 multiple choice (originals 2 and 3 correct), 5 a problem with a barem 6 + 6 + 8, 6 one without.

beforeEach(fn () => Storage::fake());

function resultsSetup(array $exam = []): array
{
    $s = attemptSetup(array_merge(['max_attempts' => 2], $exam));
    $pool = $s['exam']->items()->first()->pool;
    $common = ['competence_id' => $s['questions']['single']->competence_id, 'topic_id' => $s['questions']['single']->topic_id];
    $s['questions']['single']->update(['explanation' => 'Un sfert din 48 este 12, deci trei sferturi sunt 36.']);
    $s['questions']['multi'] = poolQuestion($s['examiner'], $pool, [...$common, 'type' => 'multiple_choice', 'statement' => 'Care numere sunt prime?',
        'answer_key' => ['options' => ['1', '2', '3', '4'], 'correct' => [2, 3]]]);
    $s['questions']['barem'] = poolQuestion($s['examiner'], $pool, [...$common, 'section' => 'subject_2', 'type' => 'structured_problem', 'points' => 20,
        'statement' => 'În triunghiul ABC, AB = AC și ∢A = 40°. Calculează ∢B.', 'answer_key' => null, 'uses_barem' => true]);
    foreach ([6, 6, 8] as $i => $points) {
        $s['questions']['barem']->baremSteps()->create(['position' => $i + 1, 'description' => 'Pasul '.($i + 1), 'points' => $points]);
    }
    $s['questions']['holistic'] = poolQuestion($s['examiner'], $pool, [...$common, 'section' => 'subject_2', 'type' => 'structured_problem', 'points' => 20,
        'statement' => 'Calculează unghiurile.', 'answer_key' => null, 'uses_barem' => false]);
    foreach ([4 => ['subject_1', 5, 'multiple_choice'], 5 => ['subject_2', 20, 'structured_problem'], 6 => ['subject_2', 20, 'structured_problem']] as $position => [$section, $points, $type]) {
        ExamItem::factory()->create([
            'exam_id' => $s['exam']->id, 'position' => $position, 'section' => $section, 'points' => $points,
            'pool_id' => $pool->id, 'competence_id' => $common['competence_id'], 'difficulty' => 'easy', 'type' => $type,
        ]);
    }
    // The two problems share a type: Item 5 draws the barem one by its own topic.
    $topic = Topic::factory()->for($s['examiner'], 'examiner')->create();
    $s['questions']['barem']->update(['topic_id' => $topic->id]);
    ExamItem::where('exam_id', $s['exam']->id)->where('position', 5)->update(['topic_id' => $topic->id]);
    ExamItem::where('exam_id', $s['exam']->id)->where('position', 6)->update(['topic_id' => $common['topic_id']]);

    return $s;
}

function resultsItem(int $attemptId, int $position): AttemptItem
{
    return AttemptItem::where('attempt_id', $attemptId)->where('position', $position)->sole();
}

/** The shown positions of original option positions in this Attempt. */
function resultsShown(int $attemptId, int $position, array $originals): array
{
    $order = resultsItem($attemptId, $position)->expected_answer['option_order'];
    $shown = array_map(fn ($o) => array_search($o, $order, true) + 1, $originals);
    sort($shown);

    return $shown;
}

/** Starts, answers and submits an Attempt as $candidate; `right` answers Subject I correctly. */
function resultsTake(array $s, User $candidate, bool $right, bool $photo = false): int
{
    signInAs($candidate);
    $id = test()->postJson("/api/candidate/exams/{$s['exam']->id}/attempts")->assertCreated()->json('attempt.id');
    $values = resultsItem($id, 2)->expected_answer['answer'];
    $answers = [
        1 => resultsShown($id, 1, [$right ? 2 : 1])[0],
        2 => (string) ($right ? $values : $values + 1),
        3 => $right,
        4 => resultsShown($id, 4, $right ? [2, 3] : [1]),
        5 => 'a) ∢B = 70°',
    ];
    foreach ($answers as $position => $value) {
        test()->putJson("/api/attempts/{$id}/items/{$position}/answer", ['answer' => $value, 'version' => 1])->assertOk();
    }
    if ($photo) {
        test()->post("/api/attempts/{$id}/items/5/images", ['image' => UploadedFile::fake()->createWithContent('pagina-1.jpg', file_get_contents(base_path('tests/fixtures/photos/page.jpg')))], ['Accept' => 'application/json'])->assertCreated();
    }
    test()->postJson("/api/attempts/{$id}/submit")->assertOk();

    return $id;
}

/** Grades both problems as the Examiner: barem 6 + 3 + 0 with +1, and 14 without a barem. */
function resultsGrade(array $s, int $attemptId, float $holistic = 14): void
{
    signInAs($s['examiner']);
    $steps = $s['questions']['barem']->baremSteps()->orderBy('position')->get();
    test()->putJson('/api/grading/items/'.resultsItem($attemptId, 5)->id, [
        'steps' => [['id' => $steps[0]->id, 'points' => 6], ['id' => $steps[1]->id, 'points' => 3], ['id' => $steps[2]->id, 'points' => 0]],
        'adjustment' => 1, 'comment' => 'La b) lipsește concluzia.',
    ])->assertOk();
    test()->putJson('/api/grading/items/'.resultsItem($attemptId, 6)->id, ['points' => $holistic])->assertOk();
}

function resultsPublish(array $s, ?string $note = 'Scrieți concluzia fiecărei demonstrații.'): void
{
    $s['exam']->forceFill(['results_published_at' => now(), 'cohort_note' => $note])->save();
}

function resultsOf(array $s, ?User $as = null)
{
    signInAs($as ?? $s['candidate']);

    return test()->getJson("/api/candidate/exams/{$s['exam']->id}/results");
}

it('shows nothing before the results are published (D-019)', function () {
    $s = resultsSetup();
    $id = resultsTake($s, $s['candidate'], true);
    resultsGrade($s, $id);

    $response = resultsOf($s)->assertStatus(409)->assertJsonPath('code', 'results_not_published');
    expect($response->json())->not->toHaveKeys(['attempts', 'exam']);
    signInAs($s['candidate']);
    $this->getJson('/api/candidate/exams')->assertJsonPath('exams.0.grade', null);
});

it('refuses another class\'s exam and never shows a classmate\'s Attempt', function () {
    $s = resultsSetup();
    $classmate = User::factory()->candidate()->create();
    $membership = new ClassMembership;
    $membership->class_id = $s['class']->id;
    $membership->candidate_id = $classmate->id;
    $membership->status = MembershipStatus::Accepted;
    $membership->save();
    $mine = resultsTake($s, $s['candidate'], true);
    $theirs = resultsTake($s, $classmate, false);
    resultsGrade($s, $mine);
    resultsGrade($s, $theirs);
    resultsPublish($s);

    expect(resultsOf($s)->assertOk()->json('attempts.*.id'))->toBe([$mine]);
    resultsOf($s, User::factory()->candidate()->create())->assertNotFound();
    resultsOf($s, $s['examiner'])->assertForbidden();
});

it('shows each Subject I item with the answer, the correct answer in the shown order, the points and the explanation (Q-082)', function () {
    $s = resultsSetup();
    $id = resultsTake($s, $s['candidate'], false);
    resultsGrade($s, $id);
    resultsPublish($s);

    $items = collect(resultsOf($s)->assertOk()->json('attempts.0.items'))->keyBy('position');
    $values = resultsItem($id, 2)->expected_answer['answer'];

    expect($items[1])->toMatchArray([
        'section' => 'subject_1', 'type' => 'single_choice', 'points' => 5, 'statement' => 'Trei sferturi din 48 reprezintă …',
        'answer' => resultsShown($id, 1, [1])[0], 'correct' => resultsShown($id, 1, [2])[0], 'awarded_points' => 0,
        'explanation' => 'Un sfert din 48 este 12, deci trei sferturi sunt 36.',
    ])
        ->and($items[1]['options'])->toBe(resultItemOptions($id, 1))
        ->and($items[2])->toMatchArray(['answer' => (string) ($values + 1), 'correct' => (string) $values, 'awarded_points' => 0, 'explanation' => null])
        ->and($items[3])->toMatchArray(['answer' => false, 'correct' => true, 'awarded_points' => 0])
        ->and($items[4])->toMatchArray(['answer' => resultsShown($id, 4, [1]), 'correct' => resultsShown($id, 4, [2, 3]), 'awarded_points' => 0]);
});

function resultItemOptions(int $attemptId, int $position): array
{
    return resultsItem($attemptId, $position)->question_snapshot['options'];
}

it('shows each Subject II problem with the written steps, own photos, points, comment and barem steps earned (Q-083)', function () {
    $s = resultsSetup();
    $id = resultsTake($s, $s['candidate'], true, photo: true);
    resultsGrade($s, $id);
    resultsPublish($s);

    $items = collect(resultsOf($s)->assertOk()->json('attempts.0.items'))->keyBy('position');

    expect($items[5])->toMatchArray([
        'section' => 'subject_2', 'points' => 20, 'answer' => 'a) ∢B = 70°', 'awarded_points' => 10, 'adjustment' => 1,
        'comment' => 'La b) lipsește concluzia.', 'uses_barem' => true,
        'barem' => [['description' => 'Pasul 1', 'points' => 6, 'earned' => 6], ['description' => 'Pasul 2', 'points' => 6, 'earned' => 3], ['description' => 'Pasul 3', 'points' => 8, 'earned' => 0]],
    ])
        ->and($items[5]['images'])->toHaveCount(1)
        ->and($items[5]['images'][0])->toHaveKeys(['id', 'name', 'size'])
        ->and($items[5])->not->toHaveKeys(['correct', 'explanation'])
        ->and($items[6])->toMatchArray(['answer' => null, 'awarded_points' => 14, 'adjustment' => null, 'comment' => null, 'uses_barem' => false, 'barem' => [], 'images' => []]);
});

it('lists every submitted Attempt with its grade and marks the counted one by the score policy (D-012, Q-084)', function (string $policy, int $counted) {
    $s = resultsSetup(['score_policy' => $policy]);
    $better = resultsTake($s, $s['candidate'], true);
    resultsGrade($s, $better, 14);
    $worse = resultsTake($s, $s['candidate'], false);
    resultsGrade($s, $worse, 4);
    resultsPublish($s);

    $attempts = resultsOf($s)->assertOk()->json('attempts');

    // 10 + 20 (Subject I) + 10 + 14 = 54 → 5,4; 10 + 0 + 10 + 4 = 24 → 2,4.
    expect(array_map(fn ($a) => [$a['attempt_number'], $a['total_score'], $a['grade'], $a['counted']], $attempts))->toBe([
        [1, 54, 5.4, $counted === 1],
        [2, 24, 2.4, $counted === 2],
    ])
        ->and($attempts[0])->toMatchArray(['subject_1_score' => 20, 'subject_2_score' => 24]);
    signInAs($s['candidate']);
    $this->getJson('/api/candidate/exams')->assertJsonPath('exams.0.grade', $counted === 1 ? 5.4 : 2.4);
})->with([['highest', 1], ['latest', 2]]);

it('gives the cohort note and no class statistics (D-019, Q-085)', function () {
    $s = resultsSetup();
    resultsGrade($s, resultsTake($s, $s['candidate'], true));
    resultsPublish($s);

    $body = resultsOf($s)->assertOk()->json();

    expect(array_keys($body))->toBe(['exam', 'attempts'])
        ->and(array_keys($body['exam']))->toBe(['id', 'title', 'score_policy', 'results_published_at', 'cohort_note'])
        ->and($body['exam']['cohort_note'])->toBe('Scrieți concluzia fiecărei demonstrații.');
});

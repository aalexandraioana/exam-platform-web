<?php

use App\Models\Attempt;
use App\Models\Exam;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

// C-009 (P11): the Administrator's read-only list of every exam on the platform (DS-012, Q-098).

function adminSignIn(): User
{
    $admin = User::factory()->administrator()->create();
    signInAs($admin);

    return $admin;
}

it('lists every Examiner\'s exams, drafts included, newest first', function () {
    $ana = User::factory()->examiner()->create(['first_name' => 'Ana', 'last_name' => 'Popa']);
    $ion = User::factory()->examiner()->create(['first_name' => 'Ion', 'last_name' => 'Rusu']);
    $draft = Exam::factory()->for($ana, 'examiner')->create(['title' => 'Ciornă']);
    $published = Exam::factory()->published()->for($ion, 'examiner')->create(['title' => 'Publicat']);
    adminSignIn();

    $exams = $this->getJson('/api/admin/exams')->assertOk()->json('exams');

    expect(array_column($exams, 'id'))->toBe([$published->id, $draft->id])
        ->and($exams[0]['examiner'])->toBe(['id' => $ion->id, 'name' => 'Ion Rusu'])
        ->and($exams[1]['examiner'])->toBe(['id' => $ana->id, 'name' => 'Ana Popa']);
});

it('gives each exam its status, state, window, classes and Attempt counts', function () {
    $examiner = User::factory()->examiner()->create();
    $from = now()->subDay()->startOfMinute();
    $until = now()->addDay()->startOfMinute();
    $exam = Exam::factory()->published()->for($examiner, 'examiner')->create(['title' => 'Evaluare', 'available_from' => $from, 'available_until' => $until]);
    $b = SchoolClass::factory()->for($examiner, 'examiner')->create(['name' => '6B']);
    $a = SchoolClass::factory()->for($examiner, 'examiner')->create(['name' => '6A']);
    $exam->classes()->attach([$b->id, $a->id]);
    Attempt::factory()->create(['exam_id' => $exam->id]); // started: not counted
    Attempt::factory()->submitted()->create(['exam_id' => $exam->id]);
    Attempt::factory()->graded()->create(['exam_id' => $exam->id]);
    Attempt::factory()->graded()->create(['exam_id' => $exam->id]);
    adminSignIn();

    $row = $this->getJson('/api/admin/exams')->assertOk()->json('exams.0');

    expect($row)->toBe([
        'id' => $exam->id,
        'title' => 'Evaluare',
        'examiner' => ['id' => $examiner->id, 'name' => $examiner->name],
        'status' => 'published',
        'state' => 'open',
        'available_from' => $from->toIso8601String(),
        'available_until' => $until->toIso8601String(),
        'results_published_at' => null,
        'classes' => [['id' => $a->id, 'name' => '6A'], ['id' => $b->id, 'name' => '6B']],
        'attempts' => ['submitted' => 3, 'graded' => 2],
    ]);
});

it('gives the state of published exams and none for drafts', function () {
    $examiner = User::factory()->examiner()->create();
    $draft = Exam::factory()->for($examiner, 'examiner')->create();
    $upcoming = Exam::factory()->published()->for($examiner, 'examiner')->create(['available_from' => now()->addDay()]);
    $closed = Exam::factory()->resultsPublished()->for($examiner, 'examiner')->create(['available_until' => now()->subDay()]);
    adminSignIn();

    $rows = collect($this->getJson('/api/admin/exams')->assertOk()->json('exams'))->keyBy('id');

    expect($rows[$draft->id])->toMatchArray(['status' => 'draft', 'state' => null])
        ->and($rows[$upcoming->id])->toMatchArray(['status' => 'published', 'state' => 'upcoming'])
        ->and($rows[$closed->id]['state'])->toBe('closed')
        ->and($rows[$closed->id]['results_published_at'])->not->toBeNull();
});

it('sends no Candidate data and no scores', function () {
    $candidate = User::factory()->candidate()->create(['first_name' => 'Maria', 'last_name' => 'Ionescu', 'email' => 'maria@exemplu.ro']);
    $exam = Exam::factory()->published()->create();
    Attempt::factory()->graded()->create(['exam_id' => $exam->id, 'candidate_id' => $candidate->id, 'total_score' => 87.5]);
    adminSignIn();

    $body = $this->getJson('/api/admin/exams')->assertOk()->getContent();

    expect($body)->not->toContain('Maria')->not->toContain('maria@exemplu.ro')->not->toContain('87.5')->not->toContain('score');
});

it('is for Administrators only', function (string $role) {
    signInAs(User::factory()->{$role}()->create());

    $this->getJson('/api/admin/exams')->assertForbidden();
})->with(['examiner', 'candidate']);

it('uses the same number of queries however many exams there are', function () {
    adminSignIn();
    $count = function () {
        DB::flushQueryLog();
        DB::enableQueryLog();
        $this->getJson('/api/admin/exams')->assertOk();

        return count(DB::getQueryLog());
    };
    $exam = Exam::factory()->published()->create();
    $exam->classes()->attach(SchoolClass::factory()->for($exam->examiner, 'examiner')->create());
    Attempt::factory()->submitted()->create(['exam_id' => $exam->id]);
    $count(); // the first request also loads the signed-in user's token
    $one = $count();
    foreach (range(1, 4) as $i) {
        $more = Exam::factory()->published()->create();
        $more->classes()->attach(SchoolClass::factory()->for($more->examiner, 'examiner')->create());
        Attempt::factory()->graded()->create(['exam_id' => $more->id]);
    }

    expect($count())->toBe($one);
});

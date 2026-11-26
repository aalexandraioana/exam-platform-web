<?php

use App\Enums\ScorePolicy;
use App\Models\Competence;
use App\Models\Exam;
use App\Models\ExamItem;
use App\Models\Pool;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

it('creates an Exam draft with only a title and the default attempt rules', function () {
    $examiner = User::factory()->examiner()->create();
    $id = DB::table('exams')->insertGetId(['examiner_id' => $examiner->id, 'title' => 'Evaluare Unitatea 3']);

    $exam = Exam::find($id);
    expect($exam->published_at)->toBeNull()
        ->and($exam->results_published_at)->toBeNull()
        ->and($exam->max_attempts)->toBe(1)
        ->and($exam->score_policy)->toBe(ScorePolicy::Highest);
});

it('refuses impossible durations, attempts, grades, policies, windows and result publication', function () {
    $examiner = User::factory()->examiner()->create();
    $row = fn (array $values) => array_merge(['examiner_id' => $examiner->id, 'title' => 'Evaluare'], $values);

    expectRefused(fn () => DB::table('exams')->insert($row(['duration_minutes' => 0])));
    expectRefused(fn () => DB::table('exams')->insert($row(['max_attempts' => 0])));
    expectRefused(fn () => DB::table('exams')->insert($row(['grade_level' => 9])));
    expectRefused(fn () => DB::table('exams')->insert($row(['score_policy' => 'average'])));
    expectRefused(fn () => DB::table('exams')->insert($row([
        'available_from' => '2026-11-24 14:00:00',
        'available_until' => '2026-11-24 10:00:00',
    ])));
    expectRefused(fn () => DB::table('exams')->insert($row(['results_published_at' => now()])));

    expect(Exam::factory()->resultsPublished()->create()->results_published_at)->not->toBeNull();
});

it('publishes an Exam to several classes once each and refuses to delete a class it is linked to', function () {
    $exam = Exam::factory()->published()->create();
    [$classA, $classB] = SchoolClass::factory()->count(2)->create(['examiner_id' => $exam->examiner_id]);
    $exam->classes()->attach([$classA->id, $classB->id]);

    expect($exam->classes()->count())->toBe(2);
    expectRefused(fn () => $exam->classes()->attach($classA->id));

    // Q-038: a class linked to an Exam can't be deleted; P3 unlinks draft Exams before deleting.
    expectRefused(fn () => $classA->delete());

    $exam->classes()->detach($classA->id);
    $classA->delete();
    expect($exam->classes()->pluck('classes.id')->all())->toBe([$classB->id]);

    $exam->delete();
    expect($classB->fresh())->not->toBeNull()
        ->and(DB::table('class_exam')->count())->toBe(0);
});

it('keeps Item positions unique, points positive and values known', function () {
    $exam = Exam::factory()->create();
    ExamItem::factory()->for($exam)->create(['position' => 1]);

    expectRefused(fn () => ExamItem::factory()->for($exam)->create(['position' => 1]));
    expectRefused(fn () => ExamItem::factory()->for($exam)->create(['position' => 2, 'points' => 0]));
    expectRefused(fn () => DB::table('exam_items')->insert(['exam_id' => $exam->id, 'position' => 3, 'section' => 'subject_3']));
    expectRefused(fn () => DB::table('exam_items')->insert([
        'exam_id' => $exam->id, 'position' => 4, 'section' => 'subject_1', 'difficulty' => 'trivial',
    ]));

    expect(ExamItem::factory()->for($exam)->create(['position' => 5, 'competence_id' => null, 'pool_id' => null])->pool_id)
        ->toBeNull();
});

it('deletes Items with their Exam and refuses to delete a pool or competence an Item uses', function () {
    $item = ExamItem::factory()->create();

    expectRefused(fn () => $item->pool->delete());
    expectRefused(fn () => $item->competence->delete());

    $item->exam->delete();
    expect(ExamItem::count())->toBe(0);
});

it('navigates examiner, exams, items, pools, competences and classes', function () {
    $examiner = User::factory()->examiner()->create();
    $exam = Exam::factory()->for($examiner, 'examiner')->create();
    $pool = Pool::factory()->for($examiner, 'examiner')->create();
    $competence = Competence::factory()->for($examiner, 'examiner')->create();
    $item = ExamItem::factory()->for($exam)->create(['pool_id' => $pool->id, 'competence_id' => $competence->id]);
    $class = SchoolClass::factory()->for($examiner, 'examiner')->create();
    $exam->classes()->attach($class);

    expect($examiner->exams->first()->is($exam))->toBeTrue()
        ->and($exam->items->first()->is($item))->toBeTrue()
        ->and($item->pool->is($pool))->toBeTrue()
        ->and($item->competence->is($competence))->toBeTrue()
        ->and($pool->examItems->first()->is($item))->toBeTrue()
        ->and($competence->examItems->first()->is($item))->toBeTrue()
        ->and($class->exams->first()->is($exam))->toBeTrue();
});

it('indexes the foreign keys that no unique key covers', function () {
    expect(hasIndexOn('exams', 'examiner_id'))->toBeTrue()
        ->and(hasIndexOn('class_exam', 'class_id'))->toBeTrue()
        ->and(hasIndexOn('exam_items', 'pool_id'))->toBeTrue()
        ->and(hasIndexOn('exam_items', 'competence_id'))->toBeTrue();
});

it('keeps a Subject II Item at 20 points, or none yet (D-062)', function () {
    $exam = Exam::factory()->create();

    expectRefused(fn () => ExamItem::factory()->for($exam)->create(['position' => 1, 'section' => 'subject_2', 'points' => 30]));

    expect(ExamItem::factory()->for($exam)->create(['position' => 2, 'section' => 'subject_2', 'points' => 20])->points)->toBe('20.00')
        ->and(ExamItem::factory()->for($exam)->create(['position' => 3, 'section' => 'subject_2', 'points' => null])->points)->toBeNull();
});

<?php

use App\Enums\QuestionStatus;
use App\Models\BaremStep;
use App\Models\Competence;
use App\Models\Pool;
use App\Models\Question;
use App\Models\TopicLabel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

it('saves a Draft with only its subject and type', function () {
    $examiner = User::factory()->examiner()->create();
    $id = DB::table('questions')->insertGetId([
        'examiner_id' => $examiner->id,
        'code' => 'M6-UG-001',
        'section' => 'subject_1',
        'type' => 'short_answer',
    ]);

    $question = Question::find($id);
    expect($question->status)->toBe(QuestionStatus::Draft)
        ->and($question->published_to_library_at)->toBeNull()
        ->and($question->copied_from_id)->toBeNull()
        ->and($question->uses_barem)->toBeFalse();
});

it('refuses Ready unless statement, points, competence, grade level and difficulty are set', function () {
    foreach (['statement', 'points', 'competence_id', 'grade_level', 'difficulty'] as $field) {
        expectRefused(fn () => Question::factory()->ready()->create([$field => null]));
    }

    expect(Question::factory()->ready()->create()->status)->toBe(QuestionStatus::Ready);
});

it('keeps codes unique and refuses out-of-range or unknown values', function () {
    $question = Question::factory()->create(['code' => 'M6-RP-014']);
    $row = fn (array $values) => array_merge([
        'examiner_id' => $question->examiner_id,
        'code' => 'M6-RP-'.fake()->unique()->numerify('###'),
        'section' => 'subject_1',
        'type' => 'short_answer',
    ], $values);

    expectRefused(fn () => DB::table('questions')->insert($row(['code' => 'M6-RP-014'])));
    expectRefused(fn () => DB::table('questions')->insert($row(['grade_level' => 4])));
    expectRefused(fn () => DB::table('questions')->insert($row(['grade_level' => 9])));
    expectRefused(fn () => DB::table('questions')->insert($row(['points' => -1])));
    expectRefused(fn () => DB::table('questions')->insert($row(['difficulty' => 'impossible'])));
    expectRefused(fn () => DB::table('questions')->insert($row(['status' => 'archived'])));
});

it('ties the type to the subject and allows a barem only on Subject II', function () {
    expectRefused(fn () => Question::factory()->create(['section' => 'subject_2', 'type' => 'single_choice']));
    expectRefused(fn () => Question::factory()->create(['section' => 'subject_1', 'type' => 'structured_problem']));
    expectRefused(fn () => Question::factory()->create(['uses_barem' => true]));

    expect(Question::factory()->subjectTwo()->withBarem()->create()->uses_barem)->toBeTrue();
});

it('accepts only Ready questions in the library and keeps an entry when its source is deleted', function () {
    expectRefused(fn () => Question::factory()->create(['published_to_library_at' => now()]));

    $source = Question::factory()->ready()->create();
    $entry = Question::factory()->ready()->inLibrary()->create([
        'examiner_id' => $source->examiner_id,
        'competence_id' => $source->competence_id,
        'copied_from_id' => $source->id,
    ]);

    $source->delete();

    expect($entry->fresh())->not->toBeNull()
        ->and($entry->fresh()->copied_from_id)->toBeNull();
});

it('lets a question sit in several pools, once each, and keeps it when a pool is deleted', function () {
    $examiner = User::factory()->examiner()->create();
    $question = Question::factory()->for($examiner, 'examiner')->create();
    [$easy, $revision] = Pool::factory()->count(2)->for($examiner, 'examiner')->create();
    $easy->questions()->attach($question);
    $revision->questions()->attach($question);

    expect($question->pools()->count())->toBe(2);
    expectRefused(fn () => $easy->questions()->attach($question));
    expectRefused(fn () => Pool::factory()->for($examiner, 'examiner')->create(['name' => $easy->name]));
    expect(Pool::factory()->create(['name' => $easy->name])->name)->toBe($easy->name);

    $easy->delete();

    expect($question->fresh())->not->toBeNull()
        ->and($question->pools()->pluck('pools.id')->all())->toBe([$revision->id]);
});

it('gives a question several labels, unique per examiner ignoring case, and only detaches deleted ones', function () {
    $examiner = User::factory()->examiner()->create();
    $question = Question::factory()->for($examiner, 'examiner')->create();
    $angles = TopicLabel::factory()->for($examiner, 'examiner')->create(['name' => 'Unghiuri']);
    $lines = TopicLabel::factory()->for($examiner, 'examiner')->create(['name' => 'Drepte']);
    $question->topicLabels()->attach([$angles->id, $lines->id]);

    expect($question->topicLabels()->count())->toBe(2);
    expectRefused(fn () => TopicLabel::factory()->for($examiner, 'examiner')->create(['name' => 'unghiuri']));
    expect(TopicLabel::factory()->create(['name' => 'Unghiuri'])->name)->toBe('Unghiuri');

    $angles->delete();

    expect($question->fresh())->not->toBeNull()
        ->and($question->topicLabels()->pluck('topic_labels.id')->all())->toBe([$lines->id]);
});

it('keeps barem step positions unique, points non-negative, and deletes steps with their question', function () {
    $question = Question::factory()->subjectTwo()->withBarem()->create();
    BaremStep::factory()->for($question)->create(['position' => 1]);

    expectRefused(fn () => BaremStep::factory()->for($question)->create(['position' => 1]));
    expectRefused(fn () => BaremStep::factory()->for($question)->create(['position' => 2, 'points' => -1]));

    $question->delete();
    expect(BaremStep::count())->toBe(0);
});

it('refuses to delete a competence a question uses', function () {
    $question = Question::factory()->ready()->create();

    expectRefused(fn () => $question->competence->delete());
});

it('navigates examiner, pools, questions, labels, barem, competence and library source', function () {
    $examiner = User::factory()->examiner()->create();
    $competence = Competence::factory()->for($examiner, 'examiner')->create();
    $question = Question::factory()->subjectTwo()->withBarem()->ready()
        ->for($examiner, 'examiner')->create(['competence_id' => $competence->id]);
    $pool = Pool::factory()->for($examiner, 'examiner')->create();
    $pool->questions()->attach($question);
    $label = TopicLabel::factory()->for($examiner, 'examiner')->create();
    $question->topicLabels()->attach($label);
    $step = BaremStep::factory()->for($question)->create();
    $entry = Question::factory()->subjectTwo()->ready()->inLibrary()
        ->for($examiner, 'examiner')->create(['competence_id' => $competence->id, 'copied_from_id' => $question->id]);

    expect($examiner->pools->first()->questions->first()->is($question))->toBeTrue()
        ->and($examiner->questions()->count())->toBe(2)
        ->and($examiner->topicLabels->first()->questions->first()->is($question))->toBeTrue()
        ->and($question->baremSteps->first()->is($step))->toBeTrue()
        ->and($question->competence->is($competence))->toBeTrue()
        ->and($competence->questions()->count())->toBe(2)
        ->and($entry->copiedFrom->is($question))->toBeTrue();
});

it('indexes the foreign keys that no unique key covers', function () {
    expect(hasIndexOn('questions', 'examiner_id'))->toBeTrue()
        ->and(hasIndexOn('questions', 'competence_id'))->toBeTrue()
        ->and(hasIndexOn('questions', 'copied_from_id'))->toBeTrue()
        ->and(hasIndexOn('pool_question', 'question_id'))->toBeTrue()
        ->and(hasIndexOn('question_topic_label', 'topic_label_id'))->toBeTrue();
});

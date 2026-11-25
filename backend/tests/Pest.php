<?php

use App\Enums\MembershipStatus;
use App\Models\ClassMembership;
use App\Models\Competence;
use App\Models\Exam;
use App\Models\ExamItem;
use App\Models\Pool;
use App\Models\Question;
use App\Models\SchoolClass;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/*
| Feature tests run inside the Laravel application, against the PostgreSQL test
| database configured in phpunit.xml (never SQLite).
*/
pest()->extend(TestCase::class)
    ->in('Feature');

/**
 * Runs a statement the database must refuse. The inner transaction becomes a savepoint, so the
 * test's own transaction stays usable after the expected error.
 */
function expectRefused(callable $statement): void
{
    expect(fn () => DB::transaction($statement))->toThrow(QueryException::class);
}

/** Whether Postgres has an index whose definition starts with these columns. */
function hasIndexOn(string $table, string $columns): bool
{
    return DB::table('pg_indexes')
        ->where('tablename', $table)
        ->where('indexdef', 'like', "%USING btree ({$columns})%")
        ->exists();
}

/** A Ready short answer in $pool, matching the defaults of blueprintItem(). */
function poolQuestion(User $examiner, Pool $pool, array $attributes = []): Question
{
    $question = Question::factory()->ready()->for($examiner, 'examiner')->create(array_merge([
        'difficulty' => 'easy', 'grade_level' => 6, 'answer_key' => ['kind' => 'number', 'value' => '1'],
    ], $attributes));
    $pool->questions()->attach($question);

    return $question;
}

/**
 * A published Exam with three Items (single choice, a short answer with named values, true/false),
 * open now, and a Candidate accepted in its class (P6). `$exam` attributes override the defaults.
 *
 * @return array{examiner: User, candidate: User, class: SchoolClass, exam: Exam, questions: array<string, Question>}
 */
function attemptSetup(array $exam = []): array
{
    $examiner = User::factory()->examiner()->create();
    $candidate = User::factory()->candidate()->create();
    $class = SchoolClass::factory()->for($examiner, 'examiner')->create(['join_code' => strtoupper(fake()->unique()->bothify('??####'))]);
    $membership = new ClassMembership;
    $membership->class_id = $class->id;
    $membership->candidate_id = $candidate->id;
    $membership->status = MembershipStatus::Accepted;
    $membership->save();

    $pool = Pool::factory()->for($examiner, 'examiner')->create();
    $competence = Competence::factory()->for($examiner, 'examiner')->create();
    $topic = Topic::factory()->for($examiner, 'examiner')->create();
    $common = ['competence_id' => $competence->id, 'topic_id' => $topic->id];
    $questions = [
        'single' => poolQuestion($examiner, $pool, [...$common, 'type' => 'single_choice', 'statement' => 'Trei sferturi din 48 reprezintă …',
            'answer_key' => ['options' => ['12', '36', '32', '64'], 'correct' => 2]]),
        'values' => poolQuestion($examiner, $pool, [...$common, 'type' => 'short_answer', 'statement' => 'Cât face {a} + {b}?',
            'answer_key' => ['kind' => 'number'],
            'parameters' => ['values' => ['a' => ['random' => ['min' => 1, 'max' => 9]], 'b' => ['fixed' => 10]], 'answer' => 'a + b']]),
        'dual' => poolQuestion($examiner, $pool, [...$common, 'type' => 'dual_choice', 'statement' => 'Orice număr întreg negativ este mai mic decât 0.',
            'answer_key' => ['correct' => true]]),
    ];

    $exam = Exam::factory()->published()->for($examiner, 'examiner')->create(array_merge([
        'grade_level' => 6, 'duration_minutes' => 50,
        'available_from' => now()->subHour(), 'available_until' => now()->addHours(2),
    ], $exam));
    $exam->classes()->attach($class);
    foreach (['single_choice', 'short_answer', 'dual_choice'] as $i => $type) {
        ExamItem::factory()->create([
            'exam_id' => $exam->id, 'position' => $i + 1, 'section' => 'subject_1', 'points' => 5,
            'pool_id' => $pool->id, 'competence_id' => $competence->id, 'difficulty' => 'easy', 'type' => $type,
        ]);
    }

    return compact('examiner', 'candidate', 'class', 'exam', 'questions');
}

function signInAs(User $user): void
{
    app('auth')->forgetGuards();
    test()->withToken($user->createToken('spa')->plainTextToken);
}

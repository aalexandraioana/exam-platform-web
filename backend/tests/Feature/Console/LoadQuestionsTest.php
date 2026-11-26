<?php

use App\Enums\QuestionStatus;
use App\Models\Competence;
use App\Models\Pool;
use App\Models\Question;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/** Writes a question file for one test and returns its path. */
function questionFile(string $yaml): string
{
    $path = tempnam(sys_get_temp_dir(), 'questions').'.yaml';
    file_put_contents($path, $yaml);

    return $path;
}

/** A complete Subject I question, as the user writes it in questions.yaml. */
function choiceQuestion(string $code, string $extra = ''): string
{
    return <<<YAML
  - code: {$code}
    section: subject_1
    type: single_choice
    grade_level: 6
    difficulty: easy
    points: 5
    competence:
      code: C2
      description: Calculează o fracție dintr-un număr.
    topic: Rapoarte și proporții
    statement: Trei sferturi din numărul 48 reprezintă …
    answer:
      options: ["12", "36", "32", "64"]
      correct: 2
{$extra}
YAML."\n";
}

function load(User $examiner, string $path)
{
    return test()->artisan('app:load-questions', ['email' => $examiner->email, '--file' => $path]);
}

it('loads every type into the named Examiner\'s bank, complete questions as Ready', function () {
    $examiner = User::factory()->examiner()->create();
    $path = questionFile(<<<'YAML'
questions:
  - code: M6-TR-001
    section: subject_1
    type: dual_choice
    grade_level: 6
    difficulty: easy
    points: 5
    competence: { code: C4, description: Știe suma unghiurilor unui triunghi. }
    topic: Triunghiuri
    statement: Suma măsurilor unghiurilor unui triunghi este 180°.
    answer: { correct: true }
  - code: M6-MN-002
    section: subject_1
    type: multiple_choice
    grade_level: 6
    difficulty: medium
    points: 5
    competence: { code: C1, description: Recunoaște numerele divizibile cu 3. }
    topic: Mulțimi de numere întregi
    statement: Care dintre numerele următoare sunt divizibile cu 3?
    answer: { options: ["12", "14", "21", "25"], correct: [1, 3] }
    explanation: "12 = 3 · 4 și 21 = 3 · 7."
  - code: M6-RP-003
    section: subject_1
    type: short_answer
    grade_level: 6
    difficulty: medium
    points: 5
    competence: { code: C2, description: Rezolvă probleme cu mărimi direct proporționale. }
    topic: Rapoarte și proporții
    statement: Numerele a și b sunt direct proporționale cu {p} și {q}, iar a + b = {s}. Numărul a este egal cu …
    parameters:
      values:
        p: { random: { min: 2, max: 5 } }
        q: { random: { min: 6, max: 9 } }
        k: { fixed: 4 }
        s: { calculated: "(p + q) · k" }
      conditions: ["p < q"]
      answer: "p · k"
    answer: { kind: number }
  - code: M6-TR-004
    section: subject_2
    type: structured_problem
    grade_level: 6
    difficulty: medium
    points: 20
    competence: { code: C5, description: Calculează unghiurile unui triunghi isoscel. }
    topic: Triunghiuri
    statement: |
      În triunghiul ABC, AB = AC și ∢A = 40°.
      Calculează ∢B.
    barem:
      - { step: "Triunghi isoscel ⇒ ∢B = ∢C", points: 4 }
      - { step: "∢B = 70°", points: 16 }
YAML);

    load($examiner, $path)->assertSuccessful();

    $questions = Question::with('baremSteps')->orderBy('code')->get()->keyBy('code');
    expect($questions)->toHaveCount(4)
        ->and($questions->every(fn ($q) => $q->examiner_id === $examiner->id))->toBeTrue()
        ->and($questions->every(fn ($q) => $q->status === QuestionStatus::Ready))->toBeTrue()
        ->and($questions['M6-TR-001']->answer_key)->toBe(['correct' => true])
        ->and($questions['M6-MN-002']->answer_key)->toEqual(['options' => ['12', '14', '21', '25'], 'correct' => [1, 3]])
        ->and($questions['M6-MN-002']->explanation)->toBe('12 = 3 · 4 și 21 = 3 · 7.')
        ->and($questions['M6-RP-003']->parameters['answer'])->toBe('p · k')
        ->and($questions['M6-RP-003']->parameters['values']['k'])->toBe(['fixed' => 4])
        ->and($questions['M6-TR-004']->uses_barem)->toBeTrue()
        ->and($questions['M6-TR-004']->statement)->toBe("În triunghiul ABC, AB = AC și ∢A = 40°.\nCalculează ∢B.")
        ->and($questions['M6-TR-004']->baremSteps->map->only('position', 'description', 'points')->all())->toBe([
            ['position' => 1, 'description' => 'Triunghi isoscel ⇒ ∢B = ∢C', 'points' => '4.00'],
            ['position' => 2, 'description' => '∢B = 70°', 'points' => '16.00'], // 20 points since D-062 (user's OK, 2026-11-26)
        ]);
});

it('creates competences, topics and pools once and reuses the Examiner\'s own', function () {
    $examiner = User::factory()->examiner()->create();
    $kept = Competence::factory()->create(['examiner_id' => $examiner->id, 'code' => 'C2', 'description' => 'Descrierea din aplicație.']);
    $topic = Topic::factory()->create(['examiner_id' => $examiner->id, 'name' => 'rapoarte și proporții']);
    $path = questionFile("questions:\n"
        .choiceQuestion('M6-RP-001', '    pools: [Rapoarte – ușor]')
        .choiceQuestion('M6-RP-002', '    pools: [Rapoarte – ușor, Recapitulare]'));

    load($examiner, $path)
        ->expectsOutputToContain('C2')
        ->assertSuccessful();

    $questions = Question::with('pools')->get();
    expect(Competence::count())->toBe(1)
        ->and($kept->fresh()->description)->toBe('Descrierea din aplicație.')
        ->and(Topic::count())->toBe(1)
        ->and($questions->every(fn ($q) => $q->competence_id === $kept->id && $q->topic_id === $topic->id))->toBeTrue()
        ->and(Pool::where('examiner_id', $examiner->id)->orderBy('name')->pluck('name')->all())->toBe(['Rapoarte – ușor', 'Recapitulare'])
        ->and(Question::where('code', 'M6-RP-002')->first()->pools->pluck('name')->sort()->values()->all())->toBe(['Rapoarte – ușor', 'Recapitulare']);
});

it('skips loaded codes on a second run and never changes or deletes a question', function () {
    $examiner = User::factory()->examiner()->create();
    $path = questionFile("questions:\n".choiceQuestion('M6-RP-001'));
    load($examiner, $path)->assertSuccessful();
    Question::where('code', 'M6-RP-001')->update(['statement' => 'Editată în aplicație.']);
    $other = Question::factory()->create(['examiner_id' => $examiner->id]);

    load($examiner, $path)
        ->expectsOutputToContain('Skipped M6-RP-001')
        ->assertSuccessful();

    expect(Question::count())->toBe(2)
        ->and(Question::where('code', 'M6-RP-001')->value('statement'))->toBe('Editată în aplicație.')
        ->and($other->fresh())->not->toBeNull();
});

it('skips a code another bank or a library entry already uses', function () {
    $examiner = User::factory()->examiner()->create();
    $theirs = Question::factory()->create(['code' => 'M6-RP-001']);
    $entry = Question::factory()->ready()->inLibrary()->create(['code' => 'LIB-RP-002']);
    $path = questionFile("questions:\n".choiceQuestion('M6-RP-001').choiceQuestion('LIB-RP-002').choiceQuestion('M6-RP-003'));

    load($examiner, $path)
        ->expectsOutputToContain('Skipped M6-RP-001')
        ->expectsOutputToContain('Skipped LIB-RP-002')
        ->assertSuccessful();

    expect(Question::where('examiner_id', $examiner->id)->pluck('code')->all())->toBe(['M6-RP-003'])
        ->and($theirs->fresh()->examiner_id)->not->toBe($examiner->id)
        ->and($entry->fresh()->published_to_library_at)->not->toBeNull();
});

it('loads a well-formed but incomplete question as Draft and lists what it needs', function () {
    $examiner = User::factory()->examiner()->create();
    $path = questionFile(<<<'YAML'
questions:
  - code: M6-RP-001
    section: subject_1
    type: single_choice
    grade_level: 6
    difficulty: easy
    competence: { code: C2, description: Calculează o fracție dintr-un număr. }
    topic: Rapoarte și proporții
    statement: Trei sferturi din numărul 48 reprezintă …
  - code: M6-TR-002
    section: subject_2
    type: structured_problem
    grade_level: 6
    difficulty: medium
    points: 10
    competence: { code: C5, description: Calculează unghiuri. }
    topic: Triunghiuri
    statement: Calculează ∢B.
    barem:
      - { step: "∢B = 70°", points: 4 }
YAML);

    load($examiner, $path)
        ->expectsOutputToContain('points')
        ->expectsOutputToContain('answer_key')
        ->expectsOutputToContain('barem')
        ->assertSuccessful();

    expect(Question::pluck('status')->all())->each->toBe(QuestionStatus::Draft)
        ->and(Question::count())->toBe(2);
});

it('refuses a broken file and writes nothing', function (string $yaml, string $named) {
    $examiner = User::factory()->examiner()->create();
    $path = questionFile("questions:\n".choiceQuestion('M6-OK-001').$yaml);

    load($examiner, $path)
        ->expectsOutputToContain($named)
        ->assertFailed();

    expect(Question::count())->toBe(0)
        ->and(Competence::count())->toBe(0)
        ->and(Topic::count())->toBe(0);
})->with([
    'unknown type' => [str_replace('single_choice', 'essay', choiceQuestion('M6-BAD-001')), 'M6-BAD-001'],
    'type not fitting the section' => [str_replace('subject_1', 'subject_2', choiceQuestion('M6-BAD-002')), 'M6-BAD-002'],
    'repeated code' => [choiceQuestion('M6-OK-001'), 'M6-OK-001'],
    'bad code' => [choiceQuestion('M6 BAD 003'), 'M6 BAD 003'],
    'missing competence' => [preg_replace('/    competence:\n.*\n.*\n/', '', choiceQuestion('M6-BAD-004')), 'M6-BAD-004'],
    'missing topic' => [str_replace("    topic: Rapoarte și proporții\n", '', choiceQuestion('M6-BAD-005')), 'M6-BAD-005'],
    'barem on a Subject I question' => [choiceQuestion('M6-BAD-006', "    barem:\n      - { step: Pas, points: 5 }"), 'M6-BAD-006'],
    'grade level out of range' => [str_replace('grade_level: 6', 'grade_level: 12', choiceQuestion('M6-BAD-007')), 'M6-BAD-007'],
    'invalid YAML' => ["  - code: [unclosed\n", 'YAML'],
]);

it('refuses an email that is not an active Examiner', function (string $kind) {
    $user = match ($kind) {
        'candidate' => User::factory()->candidate()->create(),
        'administrator' => User::factory()->administrator()->create(),
        'deactivated examiner' => User::factory()->examiner()->create(['is_active' => false]),
    };

    load($user, questionFile("questions:\n".choiceQuestion('M6-RP-001')))->assertFailed();
    $this->artisan('app:load-questions', ['email' => 'nobody@exemplu.ro', '--file' => questionFile("questions:\n")])->assertFailed();

    expect(Question::count())->toBe(0);
})->with(['candidate', 'administrator', 'deactivated examiner']);

it('loads every example in questions.template.yaml as Ready', function () {
    $examiner = User::factory()->examiner()->create();

    load($examiner, base_path('database/seeders/data/questions.template.yaml'))->assertSuccessful();

    expect(Question::count())->toBe(9)
        ->and(Question::where('status', '!=', QuestionStatus::Ready->value)->pluck('code')->all())->toBe([]);
});

it('loads nothing from an empty list and succeeds', function () {
    $examiner = User::factory()->examiner()->create();

    load($examiner, questionFile("questions:\n"))->assertSuccessful();

    expect(Question::count())->toBe(0);
});

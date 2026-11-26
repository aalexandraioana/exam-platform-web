<?php

namespace App\Console\Commands;

use App\Enums\Difficulty;
use App\Enums\QuestionStatus;
use App\Enums\QuestionType;
use App\Enums\Role;
use App\Enums\Section;
use App\Http\Requests\Questions\CodeRules;
use App\Http\Requests\Questions\TypeFitsSection;
use App\Models\BaremStep;
use App\Models\Competence;
use App\Models\Pool;
use App\Models\Question;
use App\Models\Topic;
use App\Models\User;
use App\Support\Questions\Readiness;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Symfony\Component\Yaml\Exception\ParseException;
use Symfony\Component\Yaml\Yaml;

/**
 * Loads the initial question pool from questions.yaml into one Examiner's bank (D-029, Q-074).
 * Insert-only: a question whose code is already in the database is skipped, never updated or
 * deleted. The whole file is checked first; one broken question stops the run with nothing
 * written. Complete questions become Ready, incomplete ones Draft with what they still need (D-059).
 */
class LoadQuestions extends Command
{
    protected $signature = 'app:load-questions {email : the Examiner whose bank receives the questions}
        {--file= : the question file (default: database/seeders/data/questions.yaml)}';

    protected $description = 'Load questions.yaml into an Examiner\'s bank (insert-only)';

    public function handle(): int
    {
        $examiner = User::where('email', strtolower(trim($this->argument('email'))))
            ->where('role', Role::Examiner)->where('is_active', true)->first();
        if ($examiner === null) {
            $this->error('There is no active Examiner with this email.');

            return self::FAILURE;
        }

        $path = $this->option('file') ?: database_path('seeders/data/questions.yaml');
        if (! is_file($path)) {
            $this->error("The file {$path} does not exist.");

            return self::FAILURE;
        }
        try {
            $data = Yaml::parse((string) file_get_contents($path));
        } catch (ParseException $e) {
            $this->error('The file is not valid YAML: '.$e->getMessage());

            return self::FAILURE;
        }

        $questions = is_array($data) ? ($data['questions'] ?? null) : null;
        if (! is_array($data) || ! array_key_exists('questions', $data) || ($questions !== null && ! array_is_list($questions))) {
            $this->error('The file must have a `questions:` list.');

            return self::FAILURE;
        }
        $questions ??= [];

        if ($errors = $this->problems($questions)) {
            $this->error('Nothing was loaded. Fix these questions first:');
            foreach ($errors as $error) {
                $this->line("  {$error}");
            }

            return self::FAILURE;
        }

        $counts = DB::transaction(fn () => $this->insert($examiner, $questions));
        $this->info("Loaded {$counts['ready']} Ready and {$counts['draft']} Draft; skipped {$counts['skipped']}.");

        return self::SUCCESS;
    }

    /**
     * The file's shape, per question: what can't become a question at all. What a question
     * still needs to be Ready is not an error here (Readiness decides, Q-074).
     *
     * @return list<string>
     */
    private function problems(array $questions): array
    {
        $errors = [];
        $seen = [];
        foreach ($questions as $i => $question) {
            $label = is_array($question) && is_scalar($question['code'] ?? null) ? (string) $question['code'] : 'question #'.($i + 1);
            if (! is_array($question)) {
                $errors[] = "{$label}: not a question block";

                continue;
            }

            $validator = Validator::make($question, [
                'code' => array_values(array_diff(CodeRules::rules(), ['unique:questions,code'])),
                'section' => ['required', Rule::enum(Section::class)],
                'type' => ['required', Rule::enum(QuestionType::class)],
                'grade_level' => ['nullable', 'integer', 'between:5,8'],
                'difficulty' => ['nullable', Rule::enum(Difficulty::class)],
                'points' => ['nullable', 'numeric', 'between:0,999.99'],
                'competence' => ['required', 'array'],
                'competence.code' => ['required', 'string', 'max:20'],
                'competence.description' => ['required', 'string', 'max:1000'],
                'topic' => ['required', 'string', 'max:100'],
                'pools' => ['nullable', 'array'],
                'pools.*' => ['required', 'string', 'max:100'],
                'statement' => ['nullable', 'string', 'max:10000'],
                'explanation' => ['nullable', 'string', 'max:5000'],
                'answer' => ['nullable', 'array'],
                'parameters' => ['nullable', 'array'],
                'barem' => ['nullable', 'array', 'max:30'],
                'barem.*.step' => ['required', 'string', 'max:2000'],
                'barem.*.points' => ['required', 'numeric', 'between:0,999.99'],
            ]);
            foreach ($validator->errors()->all() as $message) {
                $errors[] = "{$label}: {$message}";
            }

            $section = $question['section'] ?? null;
            $type = $question['type'] ?? null;
            if (is_string($section) && is_string($type) && ! TypeFitsSection::check($section, $type)) {
                $errors[] = "{$label}: the type {$type} doesn't fit {$section}";
            }
            if (isset($question['barem']) && $section !== Section::SubjectTwo->value) {
                $errors[] = "{$label}: only a subject_2 question can have a barem";
            }
            if (isset($seen[$label])) {
                $errors[] = "{$label}: this code appears more than once in the file";
            }
            $seen[$label] = true;
        }

        return $errors;
    }

    /** @return array{ready: int, draft: int, skipped: int} */
    private function insert(User $examiner, array $questions): array
    {
        $counts = ['ready' => 0, 'draft' => 0, 'skipped' => 0];
        foreach ($questions as $data) {
            $code = (string) $data['code'];
            if (Question::where('code', $code)->exists()) {
                $this->line("Skipped {$code}: the code is already in the database.");
                $counts['skipped']++;

                continue;
            }

            $question = new Question([
                'section' => $data['section'],
                'type' => $data['type'],
                'grade_level' => $data['grade_level'] ?? null,
                'difficulty' => $data['difficulty'] ?? null,
                'points' => $data['points'] ?? null,
                'statement' => isset($data['statement']) ? rtrim($data['statement'], "\n") : null,
                'explanation' => isset($data['explanation']) ? rtrim($data['explanation'], "\n") : null,
                'answer_key' => isset($data['answer']) ? self::answerKey($data['answer']) : null,
                'parameters' => $data['parameters'] ?? null,
                'uses_barem' => isset($data['barem']),
                'competence_id' => $this->competence($examiner, $data['competence'])->id,
                'topic_id' => $this->topic($examiner, $data['topic'])->id,
            ]);
            $question->examiner_id = $examiner->id;
            $question->code = $code;
            $steps = collect(array_values($data['barem'] ?? []))
                ->map(fn ($step, $i) => new BaremStep(['position' => $i + 1, 'description' => $step['step'], 'points' => $step['points']]));
            $question->setRelation('baremSteps', $steps);

            $problems = Readiness::problems($question);
            $question->status = $problems ? QuestionStatus::Draft : QuestionStatus::Ready;
            $question->save();
            $question->baremSteps()->saveMany($steps);
            $question->pools()->sync(collect($data['pools'] ?? [])->map(fn ($name) => $this->pool($examiner, $name)->id)->unique()->all());

            if ($problems) {
                $this->line("Loaded {$code} as Draft; to be Ready it still needs:");
                foreach ($problems as $p) {
                    $this->line('  - '.($p['field'] ?? '?').' ('.$p['code'].(isset($p['name']) ? ' '.$p['name'] : '').')');
                }
                $counts['draft']++;
            } else {
                $this->line("Loaded {$code} as Ready.");
                $counts['ready']++;
            }
        }

        return $counts;
    }

    /** YAML reads unquoted 12 as a number; options and accepted answers are text. */
    private static function answerKey(array $answer): array
    {
        $text = fn ($value) => is_int($value) || is_float($value) ? (string) $value : $value;
        foreach (['options', 'accepted'] as $list) {
            if (isset($answer[$list]) && is_array($answer[$list])) {
                $answer[$list] = array_map($text, $answer[$list]);
            }
        }
        if (array_key_exists('value', $answer)) {
            $answer['value'] = $text($answer['value']);
        }

        return $answer;
    }

    /** The Examiner's competence with this code; an existing description is kept (P4c plan). */
    private function competence(User $examiner, array $data): Competence
    {
        $code = trim($data['code']);
        $description = trim($data['description']);
        $competence = Competence::where('examiner_id', $examiner->id)->where('code', $code)->first();
        if ($competence === null) {
            $competence = new Competence(['code' => $code, 'description' => $description]);
            $competence->examiner_id = $examiner->id;
            $competence->save();
        } elseif ($competence->description !== $description) {
            $this->warn("Competence {$code} is already in your list with another description; kept: {$competence->description}");
        }

        return $competence;
    }

    /** Matched ignoring case, as the topics_examiner_id_name_unique index does. */
    private function topic(User $examiner, string $name): Topic
    {
        $name = trim($name);
        $topic = Topic::where('examiner_id', $examiner->id)->whereRaw('lower(name) = lower(?)', [$name])->first();
        if ($topic === null) {
            $topic = new Topic(['name' => $name]);
            $topic->examiner_id = $examiner->id;
            $topic->save();
        }

        return $topic;
    }

    private function pool(User $examiner, string $name): Pool
    {
        $name = trim($name);
        $pool = Pool::where('examiner_id', $examiner->id)->where('name', $name)->first();
        if ($pool === null) {
            $pool = new Pool(['name' => $name]);
            $pool->examiner_id = $examiner->id;
            $pool->save();
        }

        return $pool;
    }
}

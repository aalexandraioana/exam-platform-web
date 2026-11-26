<?php

namespace App\Http\Resources;

use App\Models\Question;
use App\Support\Questions\Readiness;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** C-004: a question with everything the editor needs (DS-007), and what Ready still needs (D-059). */
class QuestionResource extends JsonResource
{
    public static function number(mixed $value): int|float|null
    {
        if ($value === null) {
            return null;
        }
        $float = (float) $value;

        return floor($float) === $float ? (int) $float : $float;
    }

    /** The fields the list shows. */
    public static function summary(Question $q): array
    {
        return [
            'id' => $q->id,
            'code' => $q->code,
            'section' => $q->section->value,
            'type' => $q->type->value,
            'status' => $q->status->value,
            'grade_level' => $q->grade_level,
            'difficulty' => $q->difficulty?->value,
            'statement' => $q->statement,
            'competence' => $q->competence ? ['id' => $q->competence->id, 'code' => $q->competence->code] : null,
            'topic' => $q->topic ? ['id' => $q->topic->id, 'name' => $q->topic->name] : null,
            'pools' => $q->pools->sortBy('name')->values()->map(fn ($p) => ['id' => $p->id, 'name' => $p->name])->all(),
        ];
    }

    public function toArray(Request $request): array
    {
        /** @var Question $q */
        $q = $this->resource;

        return [
            ...self::summary($q),
            'competence' => $q->competence ? $q->competence->only('id', 'code', 'description') : null,
            'points' => self::number($q->points),
            'explanation' => $q->explanation,
            'answer_key' => $q->answer_key,
            'parameters' => $q->parameters,
            'uses_barem' => $q->uses_barem,
            'barem' => $q->baremSteps->map(fn ($s) => ['id' => $s->id, 'description' => $s->description, 'points' => self::number($s->points)])->all(),
            'copied_from' => $q->copiedFrom ? ['id' => $q->copiedFrom->id, 'code' => $q->copiedFrom->code] : null,
            'published' => Question::where('copied_from_id', $q->id)->whereNotNull('published_to_library_at')->exists(),
            'problems' => Readiness::problems($q),
        ];
    }
}

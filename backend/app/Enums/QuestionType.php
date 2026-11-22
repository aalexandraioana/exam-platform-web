<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

/** structured_problem is the only Subject II type; the others are Subject I (README §5). */
enum QuestionType: string
{
    use HasValues;

    case DualChoice = 'dual_choice';
    case SingleChoice = 'single_choice';
    case MultipleChoice = 'multiple_choice';
    case ShortAnswer = 'short_answer';
    case StructuredProblem = 'structured_problem';
}

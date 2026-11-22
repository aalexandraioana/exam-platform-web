<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

/** Which Attempt counts when an Exam allows several (D-012). */
enum ScorePolicy: string
{
    use HasValues;

    case Highest = 'highest';
    case Latest = 'latest';
}

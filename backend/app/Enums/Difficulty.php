<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

/** Difficulty of a question or of a blueprint Item. */
enum Difficulty: string
{
    use HasValues;

    case Easy = 'easy';
    case Medium = 'medium';
    case Hard = 'hard';
}

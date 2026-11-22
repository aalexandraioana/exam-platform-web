<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

/** The Attempt state machine's states; P6 validates the transitions between them. */
enum AttemptStatus: string
{
    use HasValues;

    case Started = 'started';
    case InProgress = 'in_progress';
    case Submitted = 'submitted';
    case Graded = 'graded';
}

<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum Role: string
{
    use HasValues;

    case Candidate = 'candidate';
    case Examiner = 'examiner';
    case Administrator = 'administrator';
}

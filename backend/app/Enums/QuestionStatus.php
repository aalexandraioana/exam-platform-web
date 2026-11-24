<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

/** Only Ready questions can be drawn for an Attempt or published to the library (D-059). */
enum QuestionStatus: string
{
    use HasValues;

    case Draft = 'draft';
    case Ready = 'ready';
}

<?php

namespace App\Support\Attempts;

use App\Enums\AttemptStatus;
use LogicException;

/** A status change the Attempt state machine doesn't allow (P6b). A bug, never a user error. */
final class InvalidTransition extends LogicException
{
    public function __construct(AttemptStatus $from, AttemptStatus $to)
    {
        parent::__construct("An Attempt can't go from {$from->value} to {$to->value}.");
    }
}

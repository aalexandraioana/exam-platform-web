<?php

namespace App\Support\Questions;

use RuntimeException;

/** Thrown inside a save to roll it back when a Ready question would become incomplete (Q-057). */
final class NotReady extends RuntimeException
{
    /** @param  list<array>  $problems */
    public function __construct(public readonly array $problems)
    {
        parent::__construct('not_ready');
    }
}

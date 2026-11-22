<?php

namespace App\Enums\Concerns;

/** Lets a migration list an enum's values for its CHECK constraint. */
trait HasValues
{
    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

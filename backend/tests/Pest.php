<?php

use Tests\TestCase;

/*
| Feature tests run inside the Laravel application, against the PostgreSQL test
| database configured in phpunit.xml (never SQLite).
*/
pest()->extend(TestCase::class)
    ->in('Feature');

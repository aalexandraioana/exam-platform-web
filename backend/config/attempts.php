<?php

return [
    // D-004: answers still arriving this many seconds after an Attempt's deadline are accepted
    // (network latency); later ones are refused. The catalog asks for it to be configurable.
    'grace_seconds' => (int) env('ATTEMPT_GRACE_SECONDS', 30),

    // D-044, Q-067: the external cron's secret for POST /api/cron/seal-expired. Set only in the
    // host's settings; with none, the endpoint doesn't exist.
    'cron_secret' => env('CRON_SECRET'),
];

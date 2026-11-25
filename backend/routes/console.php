<?php

use App\Support\Attempts\Sealer;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// D-044: seals every open Attempt past its deadline + Grace Period. Scheduled here; in production
// the external cron reaches the same Sealer through POST /api/cron/seal-expired (Q-067).
Artisan::command('attempts:seal-expired', function () {
    $this->info('Sealed '.Sealer::sealExpired().' expired attempt(s).');
})->purpose('Submit expired attempts at their deadline');

Schedule::command('attempts:seal-expired')->everyFiveMinutes();

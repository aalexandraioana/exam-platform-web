<?php

namespace App\Http\Controllers;

use App\Support\Attempts\Sealer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * D-044, Q-067: the external cron (cron-job.org) calls this every few minutes. It seals expired
 * Attempts and keeps the free API awake. Without a configured secret the endpoint doesn't exist.
 */
class CronController extends Controller
{
    public function sealExpired(Request $request): JsonResponse
    {
        $secret = (string) config('attempts.cron_secret');
        abort_if($secret === '', 404);
        if (! hash_equals($secret, (string) $request->header('X-Cron-Secret'))) {
            return response()->json(['code' => 'forbidden', 'message' => 'Wrong cron secret.'], 403);
        }

        return response()->json(['sealed' => Sealer::sealExpired()]);
    }
}

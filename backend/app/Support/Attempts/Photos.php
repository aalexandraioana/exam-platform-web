<?php

namespace App\Support\Attempts;

use App\Enums\AttemptStatus;
use App\Models\Answer;
use App\Models\AnswerImage;
use App\Models\Attempt;
use App\Models\AttemptItem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Subject II photos (P6d, D-026): up to 3 per problem, 10 MB each, JPG, PNG or HEIC; HEIC becomes
 * JPG on the server (`heif-convert`) so the Examiner's browser can show it. Stored on the default
 * disk: local in development, R2 (`s3`) in production (D-048). Adding and removing follow the same
 * deadline + Grace Period as answers, under the Attempt's row lock (D-004, PATTERN-007).
 */
final class Photos
{
    public const MAX = 3;

    public const MAX_BYTES = 10 * 1024 * 1024;

    private const TYPES = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/heic' => 'heic', 'image/heif' => 'heic'];

    /**
     * Production keeps photos only in object storage, and only once its keys are set: Render's disk
     * is wiped on every deploy (D-048).
     */
    public static function enabled(): bool
    {
        if (! app()->isProduction()) {
            return true;
        }
        $s3 = config('filesystems.disks.s3');

        return config('filesystems.default') === 's3'
            && filled($s3['key'] ?? null) && filled($s3['secret'] ?? null) && filled($s3['bucket'] ?? null) && filled($s3['endpoint'] ?? null);
    }

    public static function add(Attempt $attempt, AttemptItem $item, UploadedFile $file): AnswerImage
    {
        if (! self::enabled()) {
            throw new PhotoRefused('storage_unavailable', 503);
        }
        if (($item->question_snapshot['type'] ?? null) !== 'structured_problem') {
            throw new PhotoRefused('not_a_problem', 422);
        }
        if (! $file->isValid() || $file->getSize() > self::MAX_BYTES) {
            throw new PhotoRefused($file->getError() === UPLOAD_ERR_INI_SIZE || $file->getSize() > self::MAX_BYTES ? 'image_too_large' : 'image_type', 422);
        }
        [$contents, $mime] = self::readable($file);

        return self::locked($attempt, function (Attempt $attempt) use ($item, $file, $contents, $mime) {
            $answer = Answer::where('attempt_item_id', $item->id)->first();
            if (! $answer) {
                $answer = new Answer;
                $answer->attempt_item_id = $item->id; // not fillable
                $answer->save();
            }
            $taken = $answer->images()->pluck('position')->all();
            if (count($taken) >= self::MAX) {
                throw new PhotoRefused('images_full', 409);
            }
            $position = min(array_diff(range(1, self::MAX), $taken));
            $path = "attempts/{$attempt->id}/{$item->id}/".Str::uuid().'.'.self::TYPES[$mime];
            Storage::put($path, $contents);

            $image = new AnswerImage;
            $image->answer_id = $answer->id;
            $image->position = $position;
            $image->path = $path;
            $image->original_name = mb_substr($file->getClientOriginalName(), 0, 255);
            $image->mime_type = $mime;
            $image->size_bytes = strlen($contents);
            $image->save();
            if ($attempt->status === AttemptStatus::Started) {
                $attempt->moveTo(AttemptStatus::InProgress); // Q-068: the first saved answer
                $attempt->save();
            }

            return $image;
        });
    }

    public static function remove(Attempt $attempt, AnswerImage $image): void
    {
        self::locked($attempt, function () use ($image) {
            Storage::delete($image->path);
            $image->delete();
        });
    }

    /** A JPG or PNG as sent, or a HEIC converted to JPG; else `image_type`. @return array{string, string} */
    private static function readable(UploadedFile $file): array
    {
        $mime = $file->getMimeType();
        $isHeic = in_array($mime, ['image/heic', 'image/heif'], true)
            || ($mime === 'application/octet-stream' && preg_match('/\.(heic|heif)$/i', $file->getClientOriginalName()));
        if ($isHeic) {
            $out = tempnam(sys_get_temp_dir(), 'heic').'.jpg';
            $result = Process::timeout(30)->run(['heif-convert', '-q', '90', $file->getRealPath(), $out]);
            if (! $result->successful() || ! is_file($out) || filesize($out) === 0) {
                @unlink($out);
                throw new PhotoRefused('image_type', 422);
            }
            $contents = file_get_contents($out);
            @unlink($out);

            return [$contents, 'image/jpeg'];
        }
        if (! isset(self::TYPES[$mime]) || @getimagesize($file->getRealPath()) === false) {
            throw new PhotoRefused('image_type', 422);
        }

        return [file_get_contents($file->getRealPath()), $mime];
    }

    /** Runs `$change` with the Attempt's row locked, once it is known to take changes. */
    private static function locked(Attempt $attempt, callable $change): mixed
    {
        $result = DB::transaction(function () use ($attempt, $change) {
            $attempt = Attempt::lockForUpdate()->findOrFail($attempt->id);
            if (Sealer::sealIfExpired($attempt)) {
                return new PhotoRefused('time_up', 409); // committed: the seal stays
            }
            if (! $attempt->isOpen()) {
                return new PhotoRefused($attempt->auto_submitted ? 'time_up' : 'attempt_submitted', 409);
            }

            return $change($attempt);
        });
        if ($result instanceof PhotoRefused) {
            throw $result;
        }

        return $result;
    }
}

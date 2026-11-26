<?php

use App\Models\AnswerImage;
use App\Models\Attempt;
use App\Models\AttemptItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

// P6d · Subject II photos (D-026, D-048): up to 3 per problem, 10 MB, JPG/PNG/HEIC (HEIC converted
// to JPG on the server), on the default disk (local; R2 in production), under the same deadline.

function photo(string $name, ?string $as = null): UploadedFile
{
    return UploadedFile::fake()->createWithContent($as ?? $name, file_get_contents(base_path("tests/fixtures/photos/{$name}")));
}

/** An Attempt whose Item 2 is a Subject II problem. */
function problemAttempt(array $exam = []): array
{
    $s = attemptSetup($exam);
    $id = startAttempt($s);
    $item = AttemptItem::where('attempt_id', $id)->where('position', 2)->sole();
    $item->question_snapshot = [...$item->question_snapshot, 'section' => 'subject_2', 'type' => 'structured_problem', 'options' => []];
    $item->save();

    return [$s, $id];
}

function upload(int $id, UploadedFile $file, int $position = 2)
{
    return test()->post("/api/attempts/{$id}/items/{$position}/images", ['image' => $file], ['Accept' => 'application/json']);
}

beforeEach(fn () => Storage::fake());

it('stores a JPG and a PNG as sent, and lists them in the read', function () {
    [, $id] = problemAttempt();

    upload($id, photo('page.jpg'))->assertCreated()
        ->assertJsonPath('image.position', 1)
        ->assertJsonPath('image.name', 'page.jpg');
    upload($id, photo('page.png'))->assertCreated()->assertJsonPath('image.position', 2);

    $files = Storage::allFiles();
    expect($files)->toHaveCount(2);
    $this->getJson("/api/attempts/{$id}")->assertOk()
        ->assertJsonPath('attempt.photos_enabled', true)
        ->assertJsonCount(2, 'attempt.items.1.images')
        ->assertJsonPath('attempt.items.1.images.1.name', 'page.png')
        ->assertJsonPath('attempt.items.0.images', null);
    expect(Attempt::find($id)->status->value)->toBe('in_progress');
});

it('converts a HEIC photo to JPG on the server (D-026)', function () {
    [, $id] = problemAttempt();

    upload($id, photo('page.heic', 'IMG_2041.HEIC'))->assertCreated()->assertJsonPath('image.name', 'IMG_2041.HEIC');

    $stored = Storage::get(Storage::allFiles()[0]);
    expect(substr($stored, 0, 3))->toBe("\xFF\xD8\xFF")
        ->and(AnswerImage::sole()->mime_type)->toBe('image/jpeg');
});

it('refuses other files, large files, a fourth photo and Subject I items', function () {
    [, $id] = problemAttempt();

    upload($id, UploadedFile::fake()->createWithContent('notes.txt', 'Pasul 1'))->assertUnprocessable()->assertJsonPath('code', 'image_type');
    upload($id, UploadedFile::fake()->createWithContent('fake.jpg', 'not an image'))->assertUnprocessable()->assertJsonPath('code', 'image_type');
    upload($id, UploadedFile::fake()->create('big.jpg', 10 * 1024 + 1, 'image/jpeg'))->assertUnprocessable()->assertJsonPath('code', 'image_too_large');
    upload($id, photo('page.jpg'), 1)->assertUnprocessable()->assertJsonPath('code', 'not_a_problem');

    foreach (range(1, 3) as $i) {
        upload($id, photo('page.jpg'))->assertCreated();
    }
    upload($id, photo('page.jpg'))->assertConflict()->assertJsonPath('code', 'images_full');
    expect(Storage::allFiles())->toHaveCount(3);
});

it('gives a new photo the lowest free position after a delete', function () {
    [, $id] = problemAttempt();
    $ids = collect(range(1, 3))->map(fn () => upload($id, photo('page.jpg'))->json('image.id'));

    $this->deleteJson("/api/attempts/{$id}/items/2/images/{$ids[1]}")->assertNoContent();
    expect(Storage::allFiles())->toHaveCount(2);

    upload($id, photo('page.png'))->assertCreated()->assertJsonPath('image.position', 2);
});

it('serves a photo to its Candidate only', function () {
    [$s, $id] = problemAttempt();
    $image = upload($id, photo('page.jpg'))->json('image.id');

    $response = $this->get("/api/attempts/{$id}/images/{$image}");
    $response->assertOk();
    expect($response->streamedContent() ?: $response->getContent())->toBe(file_get_contents(base_path('tests/fixtures/photos/page.jpg')));

    signInAs(User::factory()->candidate()->create());
    $this->get("/api/attempts/{$id}/images/{$image}", ['Accept' => 'application/json'])->assertNotFound();
    upload($id, photo('page.jpg'))->assertNotFound();
    $this->deleteJson("/api/attempts/{$id}/items/2/images/{$image}")->assertNotFound();
});

it('refuses uploads and deletes after the deadline + grace, and after submitting (D-004)', function () {
    $this->freezeSecond();
    [, $id] = problemAttempt();
    $image = upload($id, photo('page.jpg'))->json('image.id');

    $this->travelTo(Attempt::find($id)->expires_at->copy()->addSeconds(31));
    upload($id, photo('page.jpg'))->assertConflict()->assertJsonPath('code', 'time_up');
    expect(Attempt::find($id)->status->value)->toBe('submitted');
    $this->deleteJson("/api/attempts/{$id}/items/2/images/{$image}")->assertConflict()->assertJsonPath('code', 'time_up');

    [, $other] = problemAttempt();
    $this->postJson("/api/attempts/{$other}/submit")->assertOk();
    upload($other, photo('page.jpg'))->assertConflict()->assertJsonPath('code', 'attempt_submitted');
});

it('refuses uploads in production until the object storage is set up (D-048)', function () {
    [, $id] = problemAttempt();
    app()->detectEnvironment(fn () => 'production');
    config(['filesystems.default' => 'local']);

    upload($id, photo('page.jpg'))->assertStatus(503)->assertJsonPath('code', 'storage_unavailable');
    $this->getJson("/api/attempts/{$id}")->assertJsonPath('attempt.photos_enabled', false);

    config(['filesystems.default' => 's3']); // the disk set, but no keys yet
    $this->getJson("/api/attempts/{$id}")->assertJsonPath('attempt.photos_enabled', false);
    upload($id, photo('page.jpg'))->assertStatus(503);

    config(['filesystems.disks.s3' => [...config('filesystems.disks.s3'), 'key' => 'k', 'secret' => 's', 'bucket' => 'b', 'endpoint' => 'https://example.r2.cloudflarestorage.com']]);
    $this->getJson("/api/attempts/{$id}")->assertJsonPath('attempt.photos_enabled', true);
});

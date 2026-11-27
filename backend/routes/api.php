<?php

use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\AttemptController;
use App\Http\Controllers\AttemptImageController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\BankListController;
use App\Http\Controllers\CandidateExamController;
use App\Http\Controllers\CandidateResultsController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\CronController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\ExamItemController;
use App\Http\Controllers\GradingController;
use App\Http\Controllers\ItemAnalysisController;
use App\Http\Controllers\LibraryController;
use App\Http\Controllers\MembershipController;
use App\Http\Controllers\QuestionController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json(['status' => 'healthy', 'service' => 'exam-platform-api']);
});

// D-044, Q-067: the external cron seals expired Attempts (secret header; no secret → 404).
Route::post('/cron/seal-expired', [CronController::class, 'sealExpired'])->middleware('throttle:30,1');

// C-001 (docs/API.md → Users). Login throttles failed attempts itself, per email and IP.
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::middleware('active')->group(function () {
        Route::get('/user', [AuthController::class, 'user']);

        // D-054: the only route that is open while the password is temporary (besides the two above).
        Route::put('/user/password', [AuthController::class, 'changePassword']);

        Route::middleware('password.current')->group(function () {
            // C-002 (docs/API.md → Classes): the Examiner's own classes and join requests.
            Route::middleware('role:examiner')->group(function () {
                Route::get('/classes', [ClassController::class, 'index']);
                Route::post('/classes', [ClassController::class, 'store']);
                Route::get('/classes/{id}', [ClassController::class, 'show'])->whereNumber('id');
                Route::patch('/classes/{id}', [ClassController::class, 'update'])->whereNumber('id');
                Route::post('/classes/{id}/join-code', [ClassController::class, 'regenerateCode'])->whereNumber('id');
                Route::delete('/classes/{id}', [ClassController::class, 'destroy'])->whereNumber('id');
                Route::post('/memberships/{id}/accept', [MembershipController::class, 'accept'])->whereNumber('id');
                Route::post('/memberships/{id}/decline', [MembershipController::class, 'decline'])->whereNumber('id');

                // C-004 (docs/API.md → Question bank): the Examiner's own bank and the shared library.
                Route::get('/questions', [QuestionController::class, 'index']);
                Route::post('/questions', [QuestionController::class, 'store']);
                Route::post('/questions/preview', [QuestionController::class, 'preview']);
                Route::post('/questions/check-answer', [QuestionController::class, 'checkAnswer']);
                Route::get('/questions/{id}', [QuestionController::class, 'show'])->whereNumber('id');
                Route::patch('/questions/{id}', [QuestionController::class, 'update'])->whereNumber('id');
                Route::delete('/questions/{id}', [QuestionController::class, 'destroy'])->whereNumber('id');
                Route::post('/questions/{id}/ready', [QuestionController::class, 'ready'])->whereNumber('id');
                Route::post('/questions/{id}/draft', [QuestionController::class, 'draft'])->whereNumber('id');
                Route::post('/questions/{id}/publish', [LibraryController::class, 'publish'])->whereNumber('id');
                Route::get('/library', [LibraryController::class, 'index']);
                Route::post('/library/{id}/copy', [LibraryController::class, 'copy'])->whereNumber('id');
                Route::get('/competences', [BankListController::class, 'competences']);
                Route::post('/competences', [BankListController::class, 'storeCompetence']);
                Route::get('/topics', [BankListController::class, 'topics']);
                Route::post('/topics', [BankListController::class, 'storeTopic']);
                Route::get('/pools', [BankListController::class, 'pools']);
                Route::post('/pools', [BankListController::class, 'storePool']);

                // C-005 (docs/API.md → Exams): the Examiner's exams and their blueprint.
                Route::get('/exams', [ExamController::class, 'index']);
                Route::post('/exams', [ExamController::class, 'store']);
                Route::get('/exams/{id}', [ExamController::class, 'show'])->whereNumber('id');
                Route::patch('/exams/{id}', [ExamController::class, 'update'])->whereNumber('id');
                Route::delete('/exams/{id}', [ExamController::class, 'destroy'])->whereNumber('id');
                Route::post('/exams/{id}/publish', [ExamController::class, 'publish'])->whereNumber('id');
                Route::get('/exams/{id}/preview', [ExamController::class, 'preview'])->whereNumber('id');
                Route::post('/exams/{id}/match', [ExamItemController::class, 'match'])->whereNumber('id');
                Route::post('/exams/{id}/items', [ExamItemController::class, 'store'])->whereNumber('id');
                Route::put('/exams/{id}/items/order', [ExamItemController::class, 'order'])->whereNumber('id');
                Route::patch('/exams/{id}/items/{itemId}', [ExamItemController::class, 'update'])->whereNumber(['id', 'itemId']);
                Route::delete('/exams/{id}/items/{itemId}', [ExamItemController::class, 'destroy'])->whereNumber(['id', 'itemId']);
                // C-007 (P8a): Subject II grading and published results.
                Route::get('/exams/{id}/grading', [GradingController::class, 'queue'])->whereNumber('id');
                Route::post('/exams/{id}/results', [GradingController::class, 'publish'])->whereNumber('id');
                Route::get('/grading/items/{id}', [GradingController::class, 'show'])->whereNumber('id');
                Route::put('/grading/items/{id}', [GradingController::class, 'grade'])->whereNumber('id');
                Route::get('/grading/images/{id}', [GradingController::class, 'image'])->whereNumber('id');

                // C-008 (docs/API.md → Item Analysis): difficulty, discrimination, distractors (P10).
                Route::get('/exams/{id}/analysis', [ItemAnalysisController::class, 'show'])->whereNumber('id');
            });

            // C-002 (docs/API.md → Joining a class) and C-006 (docs/API.md → Attempts): the Candidate.
            Route::middleware('role:candidate')->group(function () {
                Route::post('/memberships', [MembershipController::class, 'join']);
                Route::get('/candidate/exams', [CandidateExamController::class, 'index']);
                Route::post('/candidate/exams/{id}/attempts', [CandidateExamController::class, 'start'])->whereNumber('id');
                Route::get('/candidate/exams/{id}/results', [CandidateResultsController::class, 'show'])->whereNumber('id');
                Route::get('/attempts/{id}', [AttemptController::class, 'show'])->whereNumber('id');
                Route::put('/attempts/{id}/items/{position}/answer', [AttemptController::class, 'save'])->whereNumber(['id', 'position']);
                Route::post('/attempts/{id}/submit', [AttemptController::class, 'submit'])->whereNumber('id');
                // P6d: Subject II photos (D-026, D-048).
                Route::post('/attempts/{id}/items/{position}/images', [AttemptImageController::class, 'store'])->whereNumber(['id', 'position']);
                Route::delete('/attempts/{id}/items/{position}/images/{imageId}', [AttemptImageController::class, 'destroy'])->whereNumber(['id', 'position', 'imageId']);
                Route::get('/attempts/{id}/images/{imageId}', [AttemptImageController::class, 'show'])->whereNumber(['id', 'imageId']);
            });

            // C-003 (docs/API.md → Administrator): users, temporary passwords, Examiners, deactivation.
            Route::middleware('role:administrator')->prefix('admin')->group(function () {
                Route::get('/users', [UserController::class, 'index']);
                Route::post('/examiners', [UserController::class, 'store']);
                Route::put('/users/{id}/password', [UserController::class, 'setPassword'])->whereNumber('id');
                Route::patch('/users/{id}', [UserController::class, 'update'])->whereNumber('id');
            });
        });
    });
});

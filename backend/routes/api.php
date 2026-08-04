<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

// Throttled so the login form cannot be used to brute-force a password.
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:6,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
});

<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\Manager\CategoryController;
use App\Http\Controllers\Manager\ModifierGroupController;
use App\Http\Controllers\Manager\ProductController;
use App\Http\Controllers\Manager\ReportController;
use App\Http\Controllers\MenuController;
use Illuminate\Support\Facades\Route;

// Throttled so the login form cannot be used to brute-force a password.
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:6,1');

// Public menu read by the customer kiosk.
Route::get('/restaurants', [MenuController::class, 'restaurants']);
Route::get('/categories', [MenuController::class, 'categories']);
Route::get('/products', [MenuController::class, 'products']);
Route::get('/taxes', [MenuController::class, 'taxes']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);

    // Menu management and reports. Admins can do everything a manager can.
    Route::middleware('role:admin|manager')->prefix('manager')->group(function () {
        Route::apiResource('categories', CategoryController::class)->except('show');
        Route::post('categories/{category}/image', [CategoryController::class, 'uploadImage']);

        Route::apiResource('products', ProductController::class);
        Route::patch('products/{product}/status', [ProductController::class, 'updateStatus']);
        Route::post('products/{product}/image', [ProductController::class, 'uploadImage']);
        Route::delete('products/{product}/image', [ProductController::class, 'destroyImage']);

        Route::apiResource('modifier-groups', ModifierGroupController::class)->except('show');

        Route::get('reports/sales', [ReportController::class, 'sales']);
    });
});

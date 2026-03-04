<?php

use Illuminate\Support\Facades\Route;
Route::post('/login', [App\Http\Controllers\AuthController::class, 'login']);   
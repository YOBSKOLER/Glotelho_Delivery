<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::post('/login', [AuthController::class, 'login']);

Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class,  'resetPassword']);

Route::middleware(['auth:sanctum','admin'])->group(function(){
    Route::get('/admin/dashboard', function(){
        return response()->json(['message'=>'Welcome to your admin dashboard']);
    }); 
});

Route::middleware(['auth:sanctum','livreur'])->group(function(){
    Route::get('/livreur/dashboard', function(){
        return response()->json(['message'=>'Welcome to your livreur dashboard']);
    }); 
}); 
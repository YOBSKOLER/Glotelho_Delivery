<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\LivraisonController;
use App\Http\Controllers\LivreurController;

Route::post('/login', [AuthController::class, 'login']);

Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class,  'resetPassword']);

Route::middleware(['auth:sanctum','admin'])->group(function(){
    Route::get('/admin/dashboard', function(){
        return response()->json(['message'=>'Welcome to your admin dashboard']);
    }); 
});

Route::middleware(['auth:sanctum','admin'])->group(function(){

    Route::get('/admin/livreurs', [AdminController::class,'indexLivreurs']);

    Route::post('/admin/livreurs', [AdminController::class,'storeLivreur']);

    Route::get('/admin/livreurs/{id}', [AdminController::class,'showLivreur']);

    Route::put('/admin/livreurs/{id}', [AdminController::class,'updateLivreur']);

    Route::delete('/admin/livreurs/{id}', [AdminController::class,'deleteLivreur']);

});


Route::middleware(['auth:sanctum','livreur'])->group(function(){
    Route::get('/livreur/dashboard', function(){
        return response()->json(['message'=>'Welcome to your livreur dashboard']);
    });
    
    Route::get('/livreur/livraisons', [LivreurController::class, 'mesLivraisons']);
    Route::put('/livreur/livraisons/{id}/terminer', [LivreurController::class, 'terminer']);
});

Route::middleware(['auth:sanctum'])->group(function(){
    Route::get('/livraisons', [LivraisonController::class, 'index']);
    Route::post('/livraisons', [LivraisonController::class, 'store']);
});

Route::middleware(['auth:sanctum','admin'])->group(function(){
    Route::get('/admin/livraisons', [AdminController::class, 'livraisons']);
    Route::post('/admin/livraisons/assigner', [AdminController::class, 'assigner']);
}); 
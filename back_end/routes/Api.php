<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\LivraisonController;
use App\Http\Controllers\LivreurController;
use App\Http\Controllers\CommandeController;
use App\Http\Controllers\MagentoController;

//  Webhook e-commerce (public) 
Route::post('/commandes', [CommandeController::class, 'store']);

// Annulation uniquement par le site e-commerce
Route::put('/commandes/{id}/annuler', function ($id) {
    $commande = \App\Models\Commande::with('livraison')->findOrFail($id);
    $commande->update(['statut' => 'annulee']);
    if ($commande->livraison) {
        $commande->livraison->delete();
    }
    return response()->json(['message' => 'Commande annulée.']);
});

// Authentification
Route::post('/login',           [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password',  [AuthController::class, 'resetPassword']);

// Admin
Route::middleware(['auth:sanctum', 'admin'])->group(function () {

    Route::get('/admin/dashboard', function () {
        return response()->json(['message' => 'Welcome to your admin dashboard']);
    });

    // Livreurs CRUD
    Route::get('/admin/livreurs',         [AdminController::class, 'indexLivreurs']);
    Route::post('/admin/livreurs',        [AdminController::class, 'storeLivreur']);
    Route::get('/admin/livreurs/{id}',    [AdminController::class, 'showLivreur']);
    Route::put('/admin/livreurs/{id}',    [AdminController::class, 'updateLivreur']);
    Route::put('/admin/livreurs/{id}/toggle-status', [AdminController::class, 'toggleStatus']);
    Route::delete('/admin/livreurs/{id}', [AdminController::class, 'deleteLivreur']);

    // Commandes (lecture + assignation seulement)
    Route::get('/admin/commandes',                [CommandeController::class, 'index']);
    Route::get('/admin/commandes/{id}',           [CommandeController::class, 'show']);
    Route::post('/admin/commandes/{id}/assigner', [CommandeController::class, 'assigner']);
    Route::put('/admin/commandes/{id}/statut',    [CommandeController::class, 'updateStatut']);

    // Livraisons (lecture seulement pour l'admin)
    Route::get('/admin/livraisons',              [AdminController::class, 'livraisons']);
    Route::post('/admin/livraisons/assigner',    [AdminController::class, 'assigner']);

Route::get('/admin/livraisons/{id}', [AdminController::class, 'showLivraison']);

Route::post('/admin/magento/import', [MagentoController::class, 'import']);
Route::get('/admin/magento/status',  [MagentoController::class, 'status']);
});

// Livreur 
Route::middleware(['auth:sanctum', 'livreur'])->group(function () {

    Route::get('/livreur/dashboard', function () {
        return response()->json(['message' => 'Welcome to your livreur dashboard']);
    });

    Route::get('/livreur/livraisons',               [LivreurController::class, 'mesLivraisons']);
    Route::put('/livreur/livraisons/{id}/terminer', [LivreurController::class, 'terminer']);
    Route::get('/livreur/livraisons/{id}',          [LivreurController::class, 'show']);
Route::get('/livreur/livraisons/historique',    [LivreurController::class, 'historique']);
});

// Utilisateur connecté
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/livraisons',  [LivraisonController::class, 'index']);
    Route::post('/livraisons', [LivraisonController::class, 'store']);
});
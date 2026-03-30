<?php

namespace App\Http\Controllers;

use App\Models\Commande;
use App\Models\Livraison;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // GET /api/admin/notifications
    // Retourne le nombre de nouvelles commandes + livraisons en cours
    public function index()
{
    $en_attente   = Commande::where('statut', 'en_attente')->count();
    $en_livraison = Livraison::where('status', 'in_delivery')->count();

    return response()->json([
        'total'       => $en_attente,  // ← badge cloche = seulement en_attente
        'en_attente'  => $en_attente,
        'en_livraison'=> $en_livraison,
    ]);
}

    // GET /api/admin/notifications/commandes
    // Retourne les dernières commandes en attente
    public function commandes()
    {
        $commandes = Commande::where('statut', 'en_attente')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get(['id', 'client_nom', 'client_adresse', 'created_at']);

        return response()->json(['commandes' => $commandes]);
    }
}
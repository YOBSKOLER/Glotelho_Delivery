<?php

namespace App\Http\Controllers;

use App\Models\Livraison;
use Illuminate\Http\Request;

class LivreurController extends Controller
{
    // GET /api/livreur/livraisons
    // Le livreur voit ses livraisons avec les détails de la commande
    public function mesLivraisons(Request $request)
    {
        return Livraison::with('commande')
            ->where('livreur_id', $request->user()->id)
            ->whereIn('status', ['assigned', 'pending'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    // PUT /api/livreur/livraisons/{id}/terminer
    public function terminer($id)
    {
        $livraison = Livraison::with('commande')->findOrFail($id);

        if ($livraison->livreur_id !== auth()->id()) {
            return response()->json(['error' => 'Accès non autorisé'], 403);
        }

        $livraison->status = 'delivered';
        $livraison->save();

        // Synchronise le statut de la commande
        if ($livraison->commande) {
            $livraison->commande->update(['statut' => 'livree']);
        }

        return response()->json([
            'message'   => 'Livraison terminée.',
            'livraison' => $livraison,
        ]);
    }
    public function show($id) {
    $livraison = Livraison::with('commande')
        ->where('id', $id)
        ->where('livreur_id', auth()->id())
        ->firstOrFail();
    return response()->json(['livraison' => $livraison]);
}

public function historique() {
    $livraisons = Livraison::with('commande')
        ->where('livreur_id', auth()->id())
        ->where('status', 'delivered')
        ->orderBy('updated_at', 'desc')
        ->get();
    return response()->json(['livraisons' => $livraisons]);
}
}
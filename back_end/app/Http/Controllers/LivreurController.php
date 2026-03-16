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
}
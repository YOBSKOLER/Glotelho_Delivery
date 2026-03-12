<?php

namespace App\Http\Controllers;

use App\Models\Livraison;
use Illuminate\Http\Request;

class LivreurController extends Controller
{

    // voir ses livraisons
    public function mesLivraisons(Request $request)
    {
        return Livraison::where('livreur_id', $request->user()->id)
                        ->get();
    }

    // terminer une livraison
    public function terminer($id)
    {
        $livraison = Livraison::findOrFail($id);
        
        // Vérifier que c'est la bonne livraison du livreur
        if ($livraison->livreur_id !== auth()->id()) {
            return response()->json([
                "error" => "Accès non autorisé"
            ], 403);
        }

        $livraison->status = 'delivered';
        $livraison->save();

        return response()->json([
            "message" => "livraison terminée",
            "livraison" => $livraison
        ]);
    }

}
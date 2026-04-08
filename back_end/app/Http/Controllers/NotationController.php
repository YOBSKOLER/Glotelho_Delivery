<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;

use App\Models\Livraison;

class NotationController extends Controller
{
    public function show($token) {
        $livraison = Livraison::with(['livreur','commande'])
            ->where('token_notation', $token)
            ->firstOrFail();
        return response()->json(['livraison' => $livraison]);
    }

    public function store(Request $request, $token) {
        $request->validate([
            'note_client'        => 'required|integer|min:1|max:5',
            'commentaire_client' => 'nullable|string|max:500',
        ]);
        $livraison = Livraison::where('token_notation', $token)->firstOrFail();
        $livraison->update([
            'note_client'        => $request->note_client,
            'commentaire_client' => $request->commentaire_client,
            'token_notation'     => null, // invalide le token après usage
        ]);
        return response()->json(['message' => 'Merci pour votre avis !']);
    }
}
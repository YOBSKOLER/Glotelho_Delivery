<?php

namespace App\Http\Controllers;

use App\Models\Livraison;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class LivraisonController extends Controller
{

    // créer livraison
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'adresse' => 'required|string',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'detail_commande' => 'required|string'
        ]);

        $livraison = Livraison::create([
            'name' => $request->name,
            'adresse' => $request->adresse,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'detail_commande' => $request->detail_commande,
            'status' => 'pending'
        ]);

        return response()->json($livraison, 201);
    }

    // list livraisons
    public function index()
{
    $livraisons = \App\Models\Livraison::with('commande')
        ->latest()
        ->paginate(10);

    return response()->json($livraisons);
}
}
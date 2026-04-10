<?php

namespace App\Http\Controllers;

use App\Models\Commande;
use App\Models\Livraison;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CommandeController extends Controller
{
    // GET /api/admin/commandes
    public function index()
    {
        $commandes = Commande::with(['livreur', 'livraison'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['commandes' => $commandes]);
    }

    // GET /api/admin/commandes/{id}
    public function show($id)
    {
        $commande = Commande::with(['livreur', 'livraison'])->findOrFail($id);
        return response()->json(['commande' => $commande]);
    }

    // POST /api/commandes — webhook
    public function store(Request $request)
    {
        $request->validate([
            'client_nom'      => 'required|string',
            'client_telephone'=> 'nullable|string',
            'client_adresse'  => 'required|string',
            'articles'        => 'required|array',
        ]);

        $commande = Commande::create([
            'client_nom'           => $request->client_nom,
            'client_telephone'     => $request->client_telephone,
            'client_adresse'       => $request->client_adresse,
            'latitude'             => $request->latitude,
            'longitude'            => $request->longitude,
            'articles'             => $request->articles,
            'instructions_speciales'=> $request->instructions_speciales,
            'statut'               => 'en_attente',
            'source_id'            => $request->source_id,
            'source'               => $request->source,
        ]);

        return response()->json(['message' => 'Commande créée.', 'commande' => $commande], 201);
    }

    // POST /api/admin/commandes/{id}/assigner
    public function assigner(Request $request, $id)
    {
        $request->validate([
            'livreur_id'            => 'required|exists:users,id',
            'date_livraison_prevue' => 'nullable|date',
        ]);

        $commande = Commande::findOrFail($id);

        $commande->update([
            'livreur_id' => $request->livreur_id,
            'statut'     => 'assignee',
        ]);

        Livraison::updateOrCreate(
            ['commande_id' => $commande->id],
            [
                'livreur_id'            => $request->livreur_id,
                'name'                  => $commande->client_nom,
                'adresse'               => $commande->client_adresse,
                'latitude'              => $commande->latitude,
                'longitude'             => $commande->longitude,
                'detail_commande'       => json_encode($commande->articles),
                'status'                => 'assigned',
                'date_livraison'        => now()->toDateString(),
                'date_livraison_prevue' => $request->date_livraison_prevue,
            ]
        );

        return response()->json([
            'message'  => 'Livreur assigné.',
            'commande' => $commande->fresh(['livreur', 'livraison']),
        ]);
    }

    // PUT /api/admin/commandes/{id}/statut
    public function updateStatut(Request $request, $id)
    {
        $request->validate(['statut' => 'required|string']);
        $commande = Commande::findOrFail($id);
        $commande->update(['statut' => $request->statut]);
        return response()->json(['message' => 'Statut mis à jour.', 'commande' => $commande]);
    }
}
<?php

namespace App\Http\Controllers;

use App\Models\Commande;
use App\Models\Livraison;
use App\Models\User;
use Illuminate\Http\Request;

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
        $commande = Commande::with(['livreur', 'livraison.livreur'])->findOrFail($id);
        return response()->json(['commande' => $commande]);
    }

    // POST /api/commandes — appelé par le site e-commerce
    public function store(Request $request)
    {
        $request->validate([
            'client_nom'             => 'required|string',
            'client_telephone'       => 'required|string',
            'client_adresse'         => 'required|string',
            'latitude'               => 'nullable|numeric',
            'longitude'              => 'nullable|numeric',
            'articles'               => 'required|array',
            'articles.*.nom'         => 'required|string',
            'articles.*.qty'         => 'required|integer|min:1',
            'articles.*.type'        => 'nullable|string',
            'articles.*.fragile'     => 'nullable|boolean',
            'instructions_speciales' => 'nullable|string',
            'source_id'              => 'nullable|string',
            'source'                 => 'nullable|string',
        ]);

        $commande = Commande::create($request->all());

        return response()->json([
            'message'  => 'Commande créée avec succès.',
            'commande' => $commande,
        ], 201);
    }

    // POST /api/admin/commandes/{id}/assigner
    // Assigne un livreur à une commande ET crée automatiquement une livraison
    public function assigner(Request $request, $id)
    {
        $request->validate([
            'livreur_id' => 'required|exists:users,id',
        ]);

        $commande = Commande::with('livraison')->findOrFail($id);

        if ($commande->statut !== 'en_attente') {
            return response()->json([
                'error' => 'Cette commande est déjà assignée ou en cours.'
            ], 422);
        }

        // Vérifie que c'est bien un livreur
        $livreur = User::where('id', $request->livreur_id)
                       ->where('role', 'livreur')
                       ->firstOrFail();

        // 1. Mettre à jour la commande
        $commande->update([
            'livreur_id' => $livreur->id,
            'statut'     => 'assignee',
        ]);

        // 2. Créer la livraison liée à la commande
        $livraison = Livraison::create([
            'commande_id'     => $commande->id,
            'livreur_id'      => $livreur->id,
            'name'            => $commande->client_nom,
            'adresse'         => $commande->client_adresse,
            'latitude'        => $commande->latitude,
            'longitude'       => $commande->longitude,
            'detail_commande' => json_encode($commande->articles),
            'status'          => 'assigned',
            'date_livraison'  => now()->toDateString(),
        ]);

        return response()->json([
            'message'   => 'Livreur assigné. Livraison créée avec succès.',
            'commande'  => $commande->load(['livreur', 'livraison']),
            'livraison' => $livraison->load(['livreur', 'commande']),
        ]);
    }

    // PUT /api/admin/commandes/{id}/statut
    // L'admin peut seulement passer en_livraison ou livree (pas annulee)
    public function updateStatut(Request $request, $id)
    {
        $request->validate([
            'statut' => 'required|in:en_livraison,livree',
        ]);

        $commande = Commande::with('livraison')->findOrFail($id);
        $commande->update(['statut' => $request->statut]);

        // Synchronise le statut de la livraison
        if ($commande->livraison) {
            $newStatus = $request->statut === 'livree' ? 'delivered' : 'assigned';
            $commande->livraison->update(['status' => $newStatus]);
        }

        return response()->json([
            'message'  => 'Statut mis à jour.',
            'commande' => $commande->load(['livreur', 'livraison']),
        ]);
    }
}
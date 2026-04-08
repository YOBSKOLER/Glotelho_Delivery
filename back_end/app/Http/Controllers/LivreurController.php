<?php

namespace App\Http\Controllers;

use App\Models\Livraison;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class LivreurController extends Controller
{
    // GET /api/livreur/livraisons
    public function mesLivraisons()
    {
        $livraisons = Livraison::with('commande')
            ->where('livreur_id', Auth::id())
            ->whereNotIn('status', ['delivered'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['livraisons' => $livraisons]);
    }

    // GET /api/livreur/livraisons/{id}
    public function show($id)
    {
        $livraison = Livraison::with('commande')
            ->where('id', $id)
            ->where('livreur_id', Auth::id())
            ->firstOrFail();

        return response()->json(['livraison' => $livraison]);
    }

    // PUT /api/livreur/livraisons/{id}/demarrer
    public function demarrer($id)
    {
        $livraison = Livraison::with('commande')
            ->where('id', $id)
            ->where('livreur_id', Auth::id())
            ->firstOrFail();

        $livraison->update(['status' => 'in_delivery']);
        $livraison->commande->update(['statut' => 'en_livraison']);

        return response()->json(['message' => 'Livraison démarrée.', 'livraison' => $livraison]);
    }

    // PUT /api/livreur/livraisons/{id}/terminer
    public function terminer(Request $request, $id)
    {
        $livraison = Livraison::with('commande')
            ->where('id', $id)
            ->where('livreur_id', Auth::id())
            ->firstOrFail();

        $token = Str::random(32);

        $livraison->update([
            'status'           => 'delivered',
            'preuve_photo'     => $request->preuve_photo,
            'preuve_signature' => $request->preuve_signature,
            'token_notation'   => $token,
        ]);

        $livraison->commande->update(['statut' => 'livree']);

        // Email client — ne bloque pas si échec
        $clientEmail = $livraison->commande->client_email ?? null;
        if ($clientEmail) {
            try {
                Mail::to($clientEmail)->send(new \App\Mail\NotificationLivraison($livraison, $token));
            } catch (\Exception $e) {
                Log::error('Email notification failed: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message'       => 'Livraison terminée.',
            'livraison'     => $livraison,
            'lien_notation' => url('/noter/' . $token),
        ]);
    }

    // PUT /api/livreur/livraisons/{id}/reporter
    public function reporter(Request $request, $id)
    {
        $request->validate([
            'date_livraison_prevue' => 'required|date|after:now',
            'raison_report'         => 'required|string|max:500',
            'note_report'           => 'nullable|string|max:500',
        ]);

        $livraison = Livraison::with('commande')
            ->where('id', $id)
            ->where('livreur_id', Auth::id())
            ->firstOrFail();

        $livraison->update([
            'status'               => 'reportee',
            'date_livraison_prevue'=> $request->date_livraison_prevue,
            'raison_report'        => $request->raison_report,
            'note_report'          => $request->note_report,
            'nb_reports'           => ($livraison->nb_reports ?? 0) + 1,
        ]);

        $livraison->commande->update(['statut' => 'reportee']);

        return response()->json(['message' => 'Livraison reportée.', 'livraison' => $livraison]);
    }

    // GET /api/livreur/livraisons/historique
    public function historique()
    {
        $livraisons = Livraison::with('commande')
            ->where('livreur_id', Auth::id())
            ->where('status', 'delivered')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json(['livraisons' => $livraisons]);
    }
}
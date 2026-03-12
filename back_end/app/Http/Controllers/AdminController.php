<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Livraison;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{

    // voir tous les livreurs
    public function indexLivreurs()
    {
        return User::where('role','livreur')->get();
    }


    //  créer un livreur
    public function storeLivreur(Request $request)
    {

        $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6'
        ]);

        $livreur = User::create([

            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'livreur'

        ]);

        return response()->json([
            "message" => "Livreur créé",
            "livreur" => $livreur
        ]);
    }


    // voir un livreur
    public function showLivreur($id)
    {
        return User::where('role','livreur')->findOrFail($id);
    }


    //  modifier livreur
    public function updateLivreur(Request $request, $id)
    {

        $livreur = User::findOrFail($id);

        $livreur->name = $request->name;
        $livreur->email = $request->email;

        if($request->password){
            $livreur->password = Hash::make($request->password);
        }

        $livreur->save();

        return response()->json([
            "message" => "Livreur modifié"
        ]);
    }


    //  supprimer livreur
    public function deleteLivreur($id)
    {

        $livreur = User::findOrFail($id);

        $livreur->delete();

        return response()->json([
            "message" => "Livreur supprimé"
        ]);
    }



    // voir toutes les livraisons
    public function livraisons()
    {
        return Livraison::all();
    }

    // assigner livraison
    public function assigner(Request $request)
    {
        $request->validate([
            'livraison_id' => 'required|exists:livraisons,id',
            'livreur_id' => 'required|exists:users,id'
        ]);

        $livraison = Livraison::findOrFail($request->livraison_id);
        
        // Vérifier que c'est bien un livreur
        $livreur = User::where('id', $request->livreur_id)
                        ->where('role', 'livreur')
                        ->firstOrFail();

        $livraison->livreur_id = $request->livreur_id;
        $livraison->status = 'assigned';
        $livraison->save();

        return response()->json([
            "message" => "livraison assignée",
            "livraison" => $livraison
        ]);
    }

}
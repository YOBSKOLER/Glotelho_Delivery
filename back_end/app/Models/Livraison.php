<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Livraison extends Model
{
    protected $fillable = [
        'commande_id',   // ajouté via migration
        'name',
        'adresse',
        'latitude',
        'longitude',
        'detail_commande',
        'status',
        'date_livraison',
        'livreur_id',
    ];

    const STATUS_PENDING    = 'pending';
    const STATUS_ASSIGNED   = 'assigned';
    const STATUS_DELIVERED  = 'delivered';

    // Relation avec le livreur
    public function livreur()
    {
        return $this->belongsTo(User::class, 'livreur_id');
    }

    // Relation avec la commande d'origine
    public function commande()
    {
        return $this->belongsTo(Commande::class);
    }

    public function historiques()
    {
        return $this->hasMany(Historique::class, 'livraison_id');
    }
}
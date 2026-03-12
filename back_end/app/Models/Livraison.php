<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Livraison extends Model
{
    protected $fillable = [
        'name',
        'adresse',
        'latitude',
        'longitude',
        'detail_commande',
        'status',
        'date_livraison',
        'livreur_id'
    ];
    
    // Alias pour cohérence
    const STATUS_PENDING = 'pending';
    const STATUS_ASSIGNED = 'assigned';
    const STATUS_DELIVERED = 'delivered';

    public function livreur()
    {
        return $this->belongsTo(User::class, 'livreur_id');
    }

    public function historiques()
    {
        return $this->hasMany(Historique::class, 'livraison_id');
    }
}

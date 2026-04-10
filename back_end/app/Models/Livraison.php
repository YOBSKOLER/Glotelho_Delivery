<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Livraison extends Model
{
    protected $fillable = [
        'commande_id',
        'livreur_id',
        'name',
        'adresse',
        'latitude',
        'longitude',
        'detail_commande',
        'status',
        'date_livraison',
        'date_livraison_prevue',
        'preuve_photo',
        'preuve_signature',
        'raison_report',
        'note_report',
        'nb_reports',
        'note_client',
        'commentaire_client',
        'token_notation',
    ];

    protected $casts = [
        'date_livraison'        => 'date',
        'date_livraison_prevue' => 'datetime',
        'nb_reports'            => 'integer',
        'note_client'           => 'integer',
        'latitude'              => 'float',
        'longitude'             => 'float',
    ];

    public function livreur()  { return $this->belongsTo(User::class, 'livreur_id'); }
    public function commande() { return $this->belongsTo(Commande::class); }
}
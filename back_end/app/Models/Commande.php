<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Commande extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_nom',
        'client_telephone',
        'client_adresse',
        'latitude',
        'longitude',
        'articles',
        'instructions_speciales',
        'statut',
        'livreur_id',
        'source_id',
        'source',
    ];

    protected $casts = [
        'articles'  => 'array',
        'latitude'  => 'float',
        'longitude' => 'float',
    ];

    public function livreur()
    {
        return $this->belongsTo(User::class, 'livreur_id');
    }

    public function livraison()
    {
        return $this->hasOne(Livraison::class);
    }

    public function getIsFragileAttribute(): bool
    {
        return collect($this->articles)->contains('fragile', true);
    }

    public function getTotalArticlesAttribute(): int
    {
        return collect($this->articles)->sum('qty');
    }
}
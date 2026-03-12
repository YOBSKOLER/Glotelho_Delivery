<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Historique extends Model
{
    protected $fillable = [
        'livraison_id',
        'action',
        'date'
    ];
    public function livraison()
    {
        return $this->belongsTo(Livraison::class);
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // livreur_id existe déjà dans commandes — on ajoute seulement commande_id dans livraisons
        Schema::table('livraisons', function (Blueprint $table) {
            $table->foreignId('commande_id')
                  ->nullable()
                  ->after('id')
                  ->constrained('commandes')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('livraisons', function (Blueprint $table) {
            $table->dropForeign(['commande_id']);
            $table->dropColumn('commande_id');
        });
    }
};
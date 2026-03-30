<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('livraisons', function (Blueprint $table) {
            $table->string('name')->nullable()->after('livreur_id');
            $table->string('adresse')->nullable()->after('name');
            $table->double('latitude')->nullable()->after('adresse');
            $table->double('longitude')->nullable()->after('latitude');
            $table->string('detail_commande')->nullable()->after('longitude');
            $table->string('status')->default('pending')->after('detail_commande');
            $table->date('date_livraison')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('livraisons', function (Blueprint $table) {
            $table->dropColumn([
                'name', 'adresse', 'latitude', 'longitude',
                'detail_commande', 'status', 'date_livraison'
            ]);
        });
    }
};
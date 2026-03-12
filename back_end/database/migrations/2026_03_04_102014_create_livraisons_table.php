<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('livraisons', function (Blueprint $table) {
            $table->id();
            $table->string('name'); 
            $table->string('adresse');
            $table->double('latitude');
            $table->double('longitude');
            $table->string('detail_commande');
            $table->string('status')->default('pending');
            $table->date('date_livraison')->nullable();
            $table->foreignId('livreur_id')->constrained('users');  
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('livraisons');
    }
};

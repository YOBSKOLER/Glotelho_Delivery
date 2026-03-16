<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commandes', function (Blueprint $table) {
            $table->id();
            $table->string('client_nom');
            $table->string('client_telephone');
            $table->string('client_adresse');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->json('articles');
            $table->text('instructions_speciales')->nullable();
            $table->enum('statut', [
                'en_attente',
                'assignee',
                'en_livraison',
                'livree',
                'annulee',
            ])->default('en_attente');
            $table->string('source_id')->nullable();
            $table->string('source')->default('glotelho_shop');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commandes');
    }
};
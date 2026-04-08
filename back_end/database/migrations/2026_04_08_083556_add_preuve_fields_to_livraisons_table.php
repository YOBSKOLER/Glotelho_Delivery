<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
 
    public function up()
{
    Schema::table('livraisons', function (Blueprint $table) {
        $table->text('preuve_photo')->nullable();
        $table->text('preuve_signature')->nullable();
        $table->string('raison_report')->nullable();
        $table->integer('note_client')->nullable();
        $table->text('commentaire_client')->nullable();
        $table->string('token_notation')->nullable()->unique();
        $table->dateTime('date_livraison_prevue')->nullable();
        $table->integer('nb_reports')->default(0);
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('livraisons', function (Blueprint $table) {
            //
        });
    }
};

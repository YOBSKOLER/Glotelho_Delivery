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
        $table->string('status')->default('assigned')->change();
        $table->dateTime('date_livraison_prevue')->nullable();
        $table->text('note_report')->nullable();
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

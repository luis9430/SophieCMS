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
        Schema::create('websites', function (Blueprint $table) {
            $table->id(); // BIGINT UNSIGNED, Primary Key, Auto Increment
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('language')->default('es'); // Idioma por defecto
            $table->string('target_content_type')->nullable()->index(); // Index para búsquedas por este campo
            $table->json('structure'); // Almacena la estructura JSON del constructor
            $table->text('status');
            $table->timestamps(); // created_at y updated_at
        });
    }


     
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('websites');
    }
};

<?php

// database/migrations/xxxx_xx_xx_create_global_variables_table.php

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
        Schema::create('global_variables', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // hotel_title, site_name, etc.
            $table->text('value'); // El valor de la variable
            $table->enum('type', ['string', 'number', 'boolean', 'array'])->default('string');
            $table->text('description')->nullable(); // Descripción opcional
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Índices
            $table->index('name');
            $table->index('is_active');
            $table->index('created_by_user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('global_variables');
    }
};
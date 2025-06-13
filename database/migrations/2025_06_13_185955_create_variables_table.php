<?php
// database/migrations/YYYY_MM_DD_HHMMSS_create_variables_table.php

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
        Schema::create('variables', function (Blueprint $table) {
            $table->id();
            
            // Campos básicos
            $table->string('key')->unique()->comment('Identificador único de la variable (ej: site.company_name)');
            $table->longText('value')->nullable()->comment('Valor de la variable o datos JSON');
            $table->enum('type', ['static', 'dynamic', 'external', 'computed'])
                  ->default('static')
                  ->comment('Tipo de variable');
            $table->string('category', 50)->default('custom')->comment('Categoría de la variable');
            $table->text('description')->nullable()->comment('Descripción de la variable');
            
            // Configuración de cache y refresh
            $table->integer('cache_ttl')->nullable()->comment('Tiempo de vida del cache en segundos (null = infinito)');
            $table->enum('refresh_strategy', ['manual', 'scheduled', 'event_driven', 'real_time'])
                  ->default('manual')
                  ->comment('Estrategia de actualización');
            
            // Configuración específica del tipo (JSON)
            $table->json('config')->nullable()->comment('Configuración específica según el tipo');
            
            // Estado y metadatos
            $table->boolean('is_active')->default(true)->comment('Si la variable está activa');
            $table->timestamp('last_refreshed_at')->nullable()->comment('Última vez que se actualizó');
            $table->text('last_error')->nullable()->comment('Último error si lo hubo');
            
            // Auditoría (compatible con tu sistema de usuarios)
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            
            $table->timestamps();
            
            // Índices para performance
            $table->index(['category', 'is_active'], 'idx_variables_category_active');
            $table->index(['type', 'is_active'], 'idx_variables_type_active');
            $table->index('last_refreshed_at', 'idx_variables_last_refreshed');
            $table->index('key', 'idx_variables_key'); // Redundante con unique, pero explícito
            
            // Índice compuesto para queries comunes
            $table->index(['is_active', 'type', 'category'], 'idx_variables_active_type_category');
        });
        
        // Crear índice para búsqueda de texto (si usas MySQL con fulltext)
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE variables ADD FULLTEXT(description)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('variables');
    }
};
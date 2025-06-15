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
        Schema::table('templates', function (Blueprint $table) {
            // Campos específicos para métodos Alpine
            $table->json('method_config')->nullable()->after('variables')
                  ->comment('Configuración específica para métodos Alpine (parámetros, validaciones, etc.)');
            
            $table->longText('method_template')->nullable()->after('method_config')
                  ->comment('Template del método Alpine (contenido entre llaves del Alpine.data)');
            
            $table->json('method_parameters')->nullable()->after('method_template')
                  ->comment('Definición de parámetros que acepta el método');
            
            // Campos adicionales útiles
            $table->string('trigger_syntax', 50)->nullable()->after('method_parameters')
                  ->comment('Sintaxis para invocar el método (ej: @timer, @modal)');
                  
            $table->integer('usage_count')->default(0)->after('trigger_syntax')
                  ->comment('Contador de veces que se ha usado este método');
                  
            $table->timestamp('last_used_at')->nullable()->after('usage_count')
                  ->comment('Última vez que se usó este método');
        });
        
        // Agregar índices nuevos
        $table->index('trigger_syntax', 'idx_templates_trigger');
        $table->index('usage_count', 'idx_templates_usage');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            // Remover índices primero
            $table->dropIndex('idx_templates_trigger');
            $table->dropIndex('idx_templates_usage');
            
            // Remover columnas agregadas
            $table->dropColumn([
                'method_config',
                'method_template', 
                'method_parameters',
                'trigger_syntax',
                'usage_count',
                'last_used_at'
            ]);
        });
    }
};
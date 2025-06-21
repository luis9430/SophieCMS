<?php

// database/migrations/2024_xx_xx_add_dual_template_system.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('components', function (Blueprint $table) {
            // Template para uso en Page Builder (versión corta/simplificada)
            $table->longText('page_builder_template')->nullable()->after('blade_template');
            
            // Configuración para auto-generación de template corto
            $table->json('template_config')->nullable()->after('page_builder_template');
            
            // Indicador si debe auto-generar el template corto
            $table->boolean('auto_generate_short')->default(true)->after('template_config');
        });
    }

    public function down(): void
    {
        Schema::table('components', function (Blueprint $table) {
            $table->dropColumn(['page_builder_template', 'template_config', 'auto_generate_short']);
        });
    }
};
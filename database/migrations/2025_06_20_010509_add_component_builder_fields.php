<?php

// database/migrations/2024_xx_xx_add_component_builder_fields.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('components', function (Blueprint $table) {
            
                      
            
            // Timestamp de última edición
            $table->timestamp('last_edited_at')->nullable()->after('preview_image');
            
            // Versión del componente
            $table->string('version')->default('1.0.0')->after('last_edited_at');
            
            // Índices para performance
            $table->index('is_advanced');
            $table->index('created_by_user_id');
            $table->index('category');
        });

        // Segundo paso: Actualizar los valores por defecto usando SQL directo
        DB::statement("UPDATE components SET external_assets = JSON_ARRAY() WHERE external_assets IS NULL");
        DB::statement("UPDATE components SET communication_config = JSON_OBJECT() WHERE communication_config IS NULL");
        DB::statement("UPDATE components SET props_schema = JSON_OBJECT() WHERE props_schema IS NULL");
        DB::statement("UPDATE components SET preview_config = JSON_OBJECT() WHERE preview_config IS NULL");

        // Tercer paso: Cambiar a NOT NULL (opcional, puedes dejarlo nullable si prefieres)
        Schema::table('components', function (Blueprint $table) {
            $table->json('external_assets')->nullable(false)->change();
            $table->json('communication_config')->nullable(false)->change();
            $table->json('props_schema')->nullable(false)->change();
            $table->json('preview_config')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('components', function (Blueprint $table) {
            $table->dropIndex(['is_advanced']);
            $table->dropIndex(['created_by_user_id']);
            $table->dropIndex(['category']);
            
            $table->dropColumn([
                'external_assets',
                'communication_config',
                'props_schema',
                'preview_config',
                'is_advanced',
                'created_by_user_id',
                'preview_image',
                'last_edited_at',
                'version'
            ]);
        });
    }
};
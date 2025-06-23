<?php

// database/migrations/2025_06_22_130000_add_color_type_and_metadata_to_global_variables.php

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
        Schema::table('global_variables', function (Blueprint $table) {
            // Agregar campo metadata para almacenar paletas complejas
            $table->json('metadata')->nullable()->after('description');
            $table->index(['type', 'category']); // Índice compuesto para filtros
        });

        // Actualizar el enum para incluir nuevos tipos de design tokens
        DB::statement("ALTER TABLE global_variables MODIFY COLUMN type ENUM('string', 'number', 'boolean', 'array', 'color_palette', 'typography_system') DEFAULT 'string'");
        
        // Insertar paletas de ejemplo si la tabla está vacía
        $this->seedExamplePalettes();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('global_variables', function (Blueprint $table) {
            $table->dropIndex(['type', 'category']);
            $table->dropColumn('metadata');
        });

        // Revertir enum
        DB::statement("ALTER TABLE global_variables MODIFY COLUMN type ENUM('string', 'number', 'boolean', 'array') DEFAULT 'string'");
    }

    /**
     * Seed some example color palettes
     */
    private function seedExamplePalettes()
    {
        $examplePalettes = [
            [
                'name' => 'primary_color',
                'value' => '#3B82F6',
                'type' => 'color_palette',
                'category' => 'design',
                'description' => 'Color principal del sitio',
                'metadata' => [
                    'name' => 'primary',
                    'base_color' => '#3B82F6',
                    'shades' => [
                        '50' => '#EFF6FF',
                        '100' => '#DBEAFE',
                        '200' => '#BFDBFE',
                        '300' => '#93C5FD',
                        '400' => '#60A5FA',
                        '500' => '#3B82F6',
                        '600' => '#2563EB',
                        '700' => '#1D4ED8',
                        '800' => '#1E40AF',
                        '900' => '#1E3A8A'
                    ],
                    'css_variables' => [
                        '--color-primary' => '#3B82F6',
                        '--color-primary-rgb' => '59, 130, 246',
                        '--color-primary-50' => '#EFF6FF',
                        '--color-primary-500' => '#3B82F6',
                        '--color-primary-900' => '#1E3A8A'
                    ]
                ]
            ],
            [
                'name' => 'primary_typography',
                'value' => 'Inter',
                'type' => 'typography_system',
                'category' => 'design',
                'description' => 'Sistema tipográfico principal',
                'metadata' => [
                    'fonts' => [
                        'primary' => 'Inter, ui-sans-serif, system-ui, sans-serif',
                        'secondary' => 'ui-serif, Georgia, serif',
                        'mono' => 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                    ],
                    'sizes' => [
                        'xs' => '0.75rem',
                        'sm' => '0.875rem',
                        'base' => '1rem',
                        'lg' => '1.125rem',
                        'xl' => '1.25rem',
                        '2xl' => '1.5rem',
                        '3xl' => '1.875rem',
                        '4xl' => '2.25rem'
                    ],
                    'css_variables' => [
                        '--font-primary' => 'Inter, ui-sans-serif, system-ui, sans-serif',
                        '--text-xs' => '0.75rem',
                        '--text-base' => '1rem',
                        '--text-xl' => '1.25rem'
                    ]
                ]
            ]
        ];

        foreach ($examplePalettes as $palette) {
            DB::table('global_variables')->updateOrInsert(
                ['name' => $palette['name']],
                array_merge($palette, [
                    'metadata' => json_encode($palette['metadata']),
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now()
                ])
            );
        }
    }
};
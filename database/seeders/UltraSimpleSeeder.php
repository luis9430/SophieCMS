<?php

// database/seeders/UltraSimpleSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UltraSimpleSeeder extends Seeder
{
    public function run(): void
    {
        // Solo agregar campos básicos que sabemos que existen
        DB::table('components')->insert([
            'name' => 'Test Hero Component',
            'identifier' => 'test-hero',
            'category' => 'content',
            'description' => 'Componente de prueba simple',
            'blade_template' => '<div class="bg-blue-500 text-white p-8 text-center">
    <h1 class="text-3xl font-bold">{{ $title ?? "Hello World" }}</h1>
    <p class="mt-4">{{ $subtitle ?? "This is a test component" }}</p>
</div>',
            'external_assets' => '["gsap"]',
            'communication_config' => '{"emits":[],"listens":[],"state":[]}',
            'props_schema' => '{}',
            'preview_config' => '{}',
            'is_advanced' => 1,
            'is_active' => 1,
            'version' => '1.0.0',
            'created_by_user_id' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->command->info('✅ Componente de prueba creado!');
    }
}
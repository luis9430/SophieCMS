<?php
// database/seeders/VariableSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Variable;
use App\Models\User;

class VariableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtener el primer usuario (o crear uno si no existe)
        $user = User::first();
        
        if (!$user) {
            $user = User::create([
                'name' => 'Admin',
                'email' => 'admin@pagebuilder.pro',
                'password' => bcrypt('password'),
                'email_verified_at' => now()
            ]);
            $this->command->info('👤 Usuario admin creado: admin@pagebuilder.pro / password');
        }

        $variables = [
            // ===================================================================
            // VARIABLES DE SITIO (STATIC)
            // ===================================================================
            [
                'key' => 'site.company_name',
                'value' => 'Page Builder Pro',
                'type' => 'static',
                'category' => 'site',
                'description' => 'Nombre de la empresa',
                'is_active' => true,
                'created_by' => $user->id,
                'updated_by' => $user->id
            ],
            [
                'key' => 'site.tagline',
                'value' => 'Crea páginas web increíbles sin código',
                'type' => 'static',
                'category' => 'site',
                'description' => 'Eslogan principal del sitio',
                'is_active' => true,
                'created_by' => $user->id,
                'updated_by' => $user->id
            ],
            [
                'key' => 'site.url',
                'value' => 'https://pagebuilder.pro',
                'type' => 'static',
                'category' => 'site',
                'description' => 'URL principal del sitio',
                'is_active' => true,
                'created_by' => $user->id,
                'updated_by' => $user->id
            ],

            // ===================================================================
            // VARIABLES DE CONTACTO (STATIC)
            // ===================================================================
            [
                'key' => 'contact.email',
                'value' => 'info@pagebuilder.pro',
                'type' => 'static',
                'category' => 'contact',
                'description' => 'Email principal de contacto',
                'is_active' => true,
                'created_by' => $user->id,
                'updated_by' => $user->id
            ],
            [
                'key' => 'contact.phone',
                'value' => '+34 900 123 456',
                'type' => 'static',
                'category' => 'contact',
                'description' => 'Teléfono de contacto',
                'is_active' => true,
                'created_by' => $user->id,
                'updated_by' => $user->id
            ],

            // ===================================================================
            // VARIABLES SOCIALES (STATIC)
            // ===================================================================
            [
                'key' => 'social.facebook',
                'value' => 'https://facebook.com/pagebuilder.pro',
                'type' => 'static',
                'category' => 'social',
                'description' => 'URL de Facebook',
                'is_active' => true,
                'created_by' => $user->id,
                'updated_by' => $user->id
            ],
            [
                'key' => 'social.twitter',
                'value' => 'https://twitter.com/pagebuilder_pro',
                'type' => 'static',
                'category' => 'social',
                'description' => 'URL de Twitter/X',
                'is_active' => true,
                'created_by' => $user->id,
                'updated_by' => $user->id
            ],

            // ===================================================================
            // VARIABLES DINÁMICAS (BD)
            // ===================================================================
            [
                'key' => 'stats.total_users',
                'value' => null,
                'type' => 'dynamic',
                'category' => 'stats',
                'description' => 'Número total de usuarios registrados',
                'cache_ttl' => 300, // 5 minutos
                'refresh_strategy' => 'scheduled',
                'config' => [
                    'query' => 'SELECT COUNT(*) as count FROM users',
                    'transform' => 'count'
                ],
                'is_active' => true,
                'created_by' => $user->id,
                'updated_by' => $user->id
            ],
            [
                'key' => 'stats.total_templates',
                'value' => null,
                'type' => 'dynamic',
                'category' => 'stats',
                'description' => 'Número total de templates creados',
                'cache_ttl' => 600, // 10 minutos
                'refresh_strategy' => 'scheduled',
                'config' => [
                    'query' => 'SELECT COUNT(*) as count FROM templates',
                    'transform' => 'count'
                ],
                'is_active' => true,
                'created_by' => $user->id,
                'updated_by' => $user->id
            ],

            // ===================================================================
            // VARIABLES EXTERNAS (APIs) - Ejemplo con API pública
            // ===================================================================
            [
                'key' => 'crypto.btc_price',
                'value' => null,
                'type' => 'external',
                'category' => 'external',
                'description' => 'Precio actual de Bitcoin en EUR',
                'cache_ttl' => 300, // 5 minutos
                'refresh_strategy' => 'scheduled',
                'config' => [
                    'url' => 'https://api.coindesk.com/v1/bpi/currentprice/EUR.json',
                    'method' => 'GET',
                    'transform' => 'bpi.EUR.rate',
                    'headers' => [
                        'Accept' => 'application/json'
                    ]
                ],
                'is_active' => true,
                'created_by' => $user->id,
                'updated_by' => $user->id
            ],

            // ===================================================================
            // VARIABLES PERSONALIZADAS (CUSTOM)
            // ===================================================================
            [
                'key' => 'custom.welcome_message',
                'value' => '¡Bienvenido a nuestro increíble Page Builder!',
                'type' => 'static',
                'category' => 'custom',
                'description' => 'Mensaje de bienvenida personalizable',
                'is_active' => true,
                'created_by' => $user->id,
                'updated_by' => $user->id
            ],
            [
                'key' => 'custom.feature_flag_new_editor',
                'value' => 'true',
                'type' => 'static',
                'category' => 'custom',
                'description' => 'Feature flag para el nuevo editor',
                'is_active' => true,
                'created_by' => $user->id,
                'updated_by' => $user->id
            ],
            [
                'key' => 'custom.maintenance_mode',
                'value' => 'false',
                'type' => 'static',
                'category' => 'custom',
                'description' => 'Modo de mantenimiento del sitio',
                'is_active' => true,
                'created_by' => $user->id,
                'updated_by' => $user->id
            ],

            // ===================================================================
            // VARIABLES DEL SISTEMA (SYSTEM)
            // ===================================================================
            [
                'key' => 'system.version',
                'value' => '2.0.0',
                'type' => 'static',
                'category' => 'system',
                'description' => 'Versión del Page Builder',
                'is_active' => true,
                'created_by' => $user->id,
                'updated_by' => $user->id
            ],
            [
                'key' => 'system.last_backup',
                'value' => now()->toDateTimeString(),
                'type' => 'static',
                'category' => 'system',
                'description' => 'Fecha del último backup',
                'is_active' => true,
                'created_by' => $user->id,
                'updated_by' => $user->id
            ]
        ];

        foreach ($variables as $variableData) {
            Variable::updateOrCreate(
                ['key' => $variableData['key']],
                $variableData
            );
        }

        $this->command->info('✅ Variables de ejemplo creadas: ' . count($variables));
        
        // Mostrar resumen por categoría
        $summary = Variable::selectRaw('category, COUNT(*) as count')
            ->groupBy('category')
            ->pluck('count', 'category')
            ->toArray();
            
        $this->command->info('📊 Resumen por categoría:');
        foreach ($summary as $category => $count) {
            $this->command->info("   {$category}: {$count} variables");
        }

        // Intentar resolver algunas variables dinámicas
        $this->command->info('🔄 Resolviendo variables dinámicas...');
        
        try {
            $totalUsers = Variable::where('key', 'stats.total_users')->first();
            if ($totalUsers) {
                $value = $totalUsers->resolve();
                $this->command->info("   stats.total_users: {$value}");
            }

            $totalTemplates = Variable::where('key', 'stats.total_templates')->first();
            if ($totalTemplates) {
                $value = $totalTemplates->resolve();
                $this->command->info("   stats.total_templates: {$value}");
            }

        } catch (\Exception $e) {
            $this->command->warn("⚠️ Error resolviendo variables: {$e->getMessage()}");
        }
    }
}
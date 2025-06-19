<?php

// app/Console/Commands/PageBuilderInstall.php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Website;
use App\Models\Component;
use App\Models\Template;
use Illuminate\Support\Facades\File;

class PageBuilderInstall extends Command
{
    protected $signature = 'pagebuilder:install {--force : Sobrescribir archivos existentes}';
    protected $description = 'Instalar y configurar el Page Builder';

    public function handle()
    {
        $this->info('🚀 Instalando Page Builder...');

        // Publicar assets
        $this->call('vendor:publish', [
            '--tag' => 'page-builder-assets',
            '--force' => $this->option('force')
        ]);

        // Ejecutar migraciones
        if ($this->confirm('¿Ejecutar migraciones de base de datos?', true)) {
            $this->call('migrate');
        }

        // Crear directorios necesarios
        $this->createDirectories();

        // Crear componentes por defecto
        if ($this->confirm('¿Crear componentes por defecto?', true)) {
            $this->call('db:seed', ['--class' => 'PageBuilderSeeder']);
        }

        // Registrar service provider
        $this->registerServiceProvider();

        // Registrar middleware
        $this->registerMiddleware();

        $this->info('✅ Page Builder instalado correctamente!');
        $this->line('');
        $this->line('Próximos pasos:');
        $this->line('1. Visita /admin/page-builder para comenzar');
        $this->line('2. Configura tu primer website en MoonShine');
        $this->line('3. Crea tu primera página');
    }

    private function createDirectories()
    {
        $directories = [
            storage_path('app/temp'),
            storage_path('app/backups'),
            storage_path('app/backups/pages'),
            public_path('page-builder'),
            resource_path('views/components/page-builder'),
        ];

        foreach ($directories as $directory) {
            if (!File::exists($directory)) {
                File::makeDirectory($directory, 0755, true);
                $this->line("✓ Creado directorio: {$directory}");
            }
        }
    }

    private function registerServiceProvider()
    {
        $configPath = config_path('app.php');
        $configContent = File::get($configPath);

        if (!str_contains($configContent, 'PageBuilderServiceProvider::class')) {
            // Agregar el service provider
            $search = "'providers' => [";
            $replace = "'providers' => [\n        App\\Providers\\PageBuilderServiceProvider::class,";
            
            $configContent = str_replace($search, $replace, $configContent);
            File::put($configPath, $configContent);
            
            $this->line("✓ Service Provider registrado");
        }
    }

    private function registerMiddleware()
    {
        $kernelPath = app_path('Http/Kernel.php');
        
        if (File::exists($kernelPath)) {
            $kernelContent = File::get($kernelPath);
            
            if (!str_contains($kernelContent, 'PageBuilderAccess')) {
                // Agregar middleware a route middleware
                $search = "protected \$routeMiddleware = [";
                $replace = "protected \$routeMiddleware = [\n        'page-builder' => \\App\\Http\\Middleware\\PageBuilderAccess::class,";
                
                $kernelContent = str_replace($search, $replace, $kernelContent);
                File::put($kernelPath, $kernelContent);
                
                $this->line("✓ Middleware registrado");
            }
        }
    }
}

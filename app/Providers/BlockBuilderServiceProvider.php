<?php
// app/Providers/BlockBuilderServiceProvider.php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\BlockBuilder\BlockRegistry;

class BlockBuilderServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Aquí podemos hacer bindings si necesitamos
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Registrar todos los bloques disponibles
        $this->registerBlocks();
        
        // Publicar assets y configs si necesario
        $this->publishes([
            __DIR__.'/../../config/block-builder.php' => config_path('block-builder.php'),
        ], 'block-builder-config');
    }
    
    /**
     * Registra todos los bloques disponibles
     */
    private function registerBlocks(): void
    {
        // Por ahora solo registramos Hero
        BlockRegistry::register('hero', \App\Services\BlockBuilder\Blocks\HeroBlock::class);
        
        // Cuando creemos más bloques, los agregamos aquí:
        // BlockRegistry::register('text', \App\Services\BlockBuilder\Blocks\TextBlock::class);
        // BlockRegistry::register('image', \App\Services\BlockBuilder\Blocks\ImageBlock::class);
        // BlockRegistry::register('button', \App\Services\BlockBuilder\Blocks\ButtonBlock::class);
        // BlockRegistry::register('columns', \App\Services\BlockBuilder\Blocks\ColumnsBlock::class);
        // BlockRegistry::register('card', \App\Services\BlockBuilder\Blocks\CardBlock::class);
    }
}


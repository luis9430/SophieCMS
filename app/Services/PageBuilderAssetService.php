<?php

// app/Services/PageBuilderAssetService.php

namespace App\Services;

class PageBuilderAssetService
{
    /**
     * Obtener la URL del CDN de Tailwind
     */
    public static function getTailwindCdnUrl(): string
    {
        return config('pagebuilder.assets.cdn.tailwind', 'https://cdn.tailwindcss.com');
    }

    /**
     * Obtener la URL del CDN de Alpine.js
     */
    public static function getAlpineCdnUrl(): string
    {
        return config('pagebuilder.assets.cdn.alpine', 'https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js');
    }

    /**
     * Verificar si se deben usar assets locales
     */
    public static function useLocalAssets(): bool
    {
        return config('pagebuilder.assets.local_assets_enabled', false);
    }

    /**
     * Obtener la configuración completa de assets
     */
    public static function getAssetsConfig(): array
    {
        return config('pagebuilder.assets', [
            'cdn' => [
                'tailwind' => 'https://cdn.tailwindcss.com',
                'alpine' => 'https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js',
            ],
            'local_assets_enabled' => false,
            'minify_output' => app()->environment('production'),
        ]);
    }

    /**
     * Generar las tags HTML para los assets
     */
    public static function generateAssetTags(): array
    {
        $config = self::getAssetsConfig();
        $useLocal = $config['local_assets_enabled'];
        
        return [
            'tailwind' => $useLocal 
                ? '<link href="' . asset('css/tailwind.min.css') . '" rel="stylesheet">'
                : '<script src="' . $config['cdn']['tailwind'] . '"></script>',
            
            'alpine' => $useLocal
                ? '<script src="' . asset('js/alpine.min.js') . '" defer></script>'
                : '<script defer src="' . $config['cdn']['alpine'] . '"></script>',
        ];
    }

    /**
     * Obtener configuración de Tailwind personalizada
     */
    public static function getTailwindConfig(): array
    {
        return [
            'theme' => [
                'extend' => [
                    'animation' => [
                        'fade-in' => 'fadeIn 0.3s ease-in-out',
                        'slide-up' => 'slideUp 0.3s ease-out',
                        'slide-down' => 'slideDown 0.3s ease-out',
                        'scale-up' => 'scaleUp 0.2s ease-out',
                    ],
                    'keyframes' => [
                        'fadeIn' => [
                            '0%' => ['opacity' => '0'],
                            '100%' => ['opacity' => '1'],
                        ],
                        'slideUp' => [
                            '0%' => ['transform' => 'translateY(10px)', 'opacity' => '0'],
                            '100%' => ['transform' => 'translateY(0)', 'opacity' => '1'],
                        ],
                        'slideDown' => [
                            '0%' => ['transform' => 'translateY(-10px)', 'opacity' => '0'],
                            '100%' => ['transform' => 'translateY(0)', 'opacity' => '1'],
                        ],
                        'scaleUp' => [
                            '0%' => ['transform' => 'scale(0.95)', 'opacity' => '0'],
                            '100%' => ['transform' => 'scale(1)', 'opacity' => '1'],
                        ],
                    ],
                    'colors' => [
                        'pagebuilder' => [
                            'primary' => '#3B82F6',
                            'secondary' => '#6B7280',
                            'success' => '#10B981',
                            'warning' => '#F59E0B',
                            'error' => '#EF4444',
                        ],
                    ],
                ],
            ],
            'plugins' => [],
        ];
    }

    /**
     * Verificar si un asset está disponible localmente
     */
    public static function isAssetAvailable(string $assetPath): bool
    {
        return file_exists(public_path($assetPath));
    }

    /**
     * Preparar assets para producción
     */
    public static function prepareProductionAssets(): array
    {
        $results = [];
        
        // Verificar si los assets locales existen
        $assets = [
            'tailwind' => 'css/tailwind.min.css',
            'alpine' => 'js/alpine.min.js',
        ];

        foreach ($assets as $name => $path) {
            $results[$name] = [
                'local_exists' => self::isAssetAvailable($path),
                'path' => $path,
                'size' => self::isAssetAvailable($path) ? filesize(public_path($path)) : 0,
            ];
        }

        return $results;
    }

    /**
     * Obtener la estrategia de carga para un entorno específico
     */
    public static function getLoadingStrategy(string $environment = null): string
    {
        $env = $environment ?? app()->environment();
        
        return match($env) {
            'production' => 'local', // Usar assets locales en producción
            'staging' => 'cdn', // CDN en staging
            'local', 'development' => 'cdn', // CDN en desarrollo
            default => 'cdn',
        };
    }
}
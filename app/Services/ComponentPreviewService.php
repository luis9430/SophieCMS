<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\File;

/**
 * Servicio optimizado para generar previews de componentes
 * Usa el sistema centralizado de librerías (LibraryManager + App.js)
 */
class ComponentPreviewService
{
    /**
     * Generar preview optimizado del componente
     */
    public function generatePreview(string $bladeCode, array $config = []): string
    {
        try {
            // 1. Detectar librerías automáticamente
            $requiredLibraries = $this->detectRequiredLibraries($bladeCode);
            
            // 2. Renderizar el componente
            $componentContent = $this->renderComponent($bladeCode, $config['testData'] ?? []);
            
            // 3. Construir HTML final usando sistema centralizado
            return $this->buildPreviewHTML($componentContent, $requiredLibraries, $config);
            
        } catch (\Exception $e) {
            Log::error('ComponentPreviewService Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return $this->generateErrorPreview($e->getMessage());
        }
    }

    /**
     * Auto-detectar librerías necesarias del código Blade
     */
    protected function detectRequiredLibraries(string $bladeCode): array
    {
        $libraries = [];
        
        $detectionPatterns = [
            'gsap' => [
                '/x-data=["\']gsapFade/',
                '/x-data=["\']gsapReveal/',
                '/x-data=["\']gsapSlider/',
                '/x-data=["\']gsapTimeline/',
                '/@gsap/',
                '/data-gsap/',
                '/gsap\./i'
            ],
            'fullcalendar' => [
                '/x-data=["\']fullCalendar/',
                '/x-data=["\']calendar/',
                '/class=["\'][^"\']*calendar/',
                '/FullCalendar/i'
            ],
            'swiper' => [
                '/x-data=["\']swiper/',
                '/class=["\'][^"\']*swiper/',
                '/new Swiper/i',
                '/swiper-slide|swiper-wrapper/i'
            ],
            'aos' => [
                '/data-aos/',
                '/AOS\./i'
            ]
        ];

        foreach ($detectionPatterns as $library => $patterns) {
            foreach ($patterns as $pattern) {
                if (preg_match($pattern, $bladeCode)) {
                    $libraries[] = $library;
                    break; // Solo necesitamos detectar una vez por librería
                }
            }
        }

        return array_unique($libraries);
    }

    /**
     * Renderizar el componente Blade con datos de prueba
     */
    protected function renderComponent(string $bladeCode, array $testData = []): string
    {
        $tempFile = storage_path('app/temp_component_' . uniqid() . '.blade.php');
        
        try {
            // Datos por defecto para pruebas
            $defaultData = $this->getDefaultTestData();
            $allData = array_merge($defaultData, $testData);
            
            File::put($tempFile, $bladeCode);
            return View::file($tempFile, $allData)->render();
            
        } catch (\Exception $e) {
            return $this->generateComponentError($e->getMessage());
        } finally {
            if (File::exists($tempFile)) {
                File::delete($tempFile);
            }
        }
    }

    /**
     * Construir HTML final del preview usando sistema centralizado
     */
    protected function buildPreviewHTML(string $content, array $requiredLibraries, array $config): string
    {
        $nonce = base64_encode(random_bytes(16));
        $isDev = config('app.env') === 'local';
        
        // Configuración del preview (solo para información, no para cargar assets)
        $previewConfig = [
            'libraries' => $requiredLibraries, // Solo info para el LibraryManager
            'isDev' => $isDev,
            'config' => $config
        ];

        return $this->wrapWithPreviewLayout($content, $previewConfig, $nonce);
    }

    /**
     * Wrapper HTML optimizado - LIMPIO SIN HARDCODING
     */
    protected function wrapWithPreviewLayout(string $content, array $config, string $nonce): string
    {
        $isDev = $config['isDev'];
        $libraries = $config['libraries'];
        
        // CSP corregido - incluir localhost para Vite dev server
        $cspPolicy = $isDev 
            ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'nonce-{$nonce}' https: http://localhost:5173; style-src 'self' 'unsafe-inline' https: http://localhost:5173; font-src 'self' data: https:; img-src 'self' data: https:; connect-src 'self' ws://localhost:5173 http://localhost:5173;"
            : "default-src 'self'; script-src 'self' 'nonce-{$nonce}' https:; style-src 'self' 'unsafe-inline' https:; font-src 'self' data: https:; img-src 'self' data: https:; connect-src 'self';";

        // CSS core (ya no incluye Tailwind CDN)
        $coreCSS = $this->generateAssetTags($this->getCoreCSS(), 'css');

        return "<!DOCTYPE html>
<html lang=\"es\">
<head>
    <meta charset=\"UTF-8\">
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
    <title>Component Preview</title>
    <meta http-equiv=\"Content-Security-Policy\" content=\"{$cspPolicy}\">
    
    <!-- CSS core (si hay alguno) -->
    {$coreCSS}
    
    <style>
        body { 
            margin: 0; 
            padding: 1rem; 
            font-family: system-ui, -apple-system, sans-serif; 
            background: #f8fafc;
        }
        .component-preview { 
            min-height: 100vh; 
        }
        .error-preview { 
            background: #fee2e2; 
            border: 1px solid #fca5a5; 
            padding: 1rem; 
            border-radius: 0.5rem; 
            color: #dc2626; 
            margin: 1rem 0;
        }
    </style>
</head>
<body class=\"component-preview\">
    <div class=\"component-preview-container\">
        {$content}
    </div>

    <!-- Sistema Centralizado (App.js + CSS via Vite) -->
    " . $this->getAppAssets() . "
    
    <!-- Inicialización del Preview -->
    <script nonce=\"{$nonce}\">
        " . $this->generatePreviewInitScript($config) . "
    </script>
</body>
</html>";
    }

    /**
     * Assets core necesarios - SIN TAILWIND CDN
     */
    protected function getCoreCSS(): array
    {
        return []; // Ya no necesitamos CDN, viene via Vite
    }

    /**
     * Generar tags HTML para CSS con configuración de Tailwind
     */
    protected function generateAssetTags(array $urls, string $type): string
    {
        if ($type !== 'css') return '';
        
        $tags = [];
        foreach ($urls as $url) {
            $tags[] = "<link rel=\"stylesheet\" href=\"{$url}\">";
        }
        
        return implode("\n    ", $tags);
    }

    /**
     * Cargar assets del sistema centralizado (Vite)
     */
    protected function getAppAssets(): string
    {
        try {
            if (app()->environment('production')) {
                // En producción usar assets compilados de Vite
                return app(\Illuminate\Foundation\Vite::class)(['resources/js/app.js']);
            } else {
                // En desarrollo usar Vite dev server con component-preview.js TAMBIÉN
                return $this->getViteDevAssets();
            }
        } catch (\Exception $e) {
            Log::warning('Vite assets not available, using fallback', ['error' => $e->getMessage()]);
            return $this->getAlpineFallback();
        }
    }

    /**
     * Assets para desarrollo con Vite - CON CSS COMPILADO
     */
    protected function getViteDevAssets(): string
    {
        return '
        <script type="module" src="http://localhost:5173/@vite/client"></script>
        <link rel="stylesheet" href="http://localhost:5173/resources/css/app.css">
        <script type="module" src="http://localhost:5173/resources/js/app.js"></script>';
    }

    /**
     * Fallback SIN Alpine CDN (solo mensaje de error)
     */
    protected function getAlpineFallback(): string
    {
        return '
        <script>
            console.error("❌ Vite no está disponible - Preview no funcionará correctamente");
            console.error("❌ Alpine y GSAP no están disponibles sin el sistema centralizado");
            
            // Mostrar error visual
            document.addEventListener("DOMContentLoaded", function() {
                const body = document.body;
                const errorDiv = document.createElement("div");
                errorDiv.style.cssText = "background: #fee2e2; border: 2px solid #dc2626; padding: 1rem; margin: 1rem; border-radius: 0.5rem; color: #dc2626; font-family: monospace;";
                errorDiv.innerHTML = "⚠️ <strong>Error:</strong> Sistema centralizado no disponible. Vite dev server no está corriendo.";
                body.insertBefore(errorDiv, body.firstChild);
            });
        </script>';
    }

    /**
     * Script de inicialización del preview - VUELTO AL SISTEMA ORIGINAL
     */
    protected function generatePreviewInitScript(array $config): string
        {
            $libraries = json_encode($config['libraries']);
            $isDev = $config['isDev'] ? 'true' : 'false';
            
            return "
            // Configuración del preview
            window.PREVIEW_CONFIG = {
                libraries: {$libraries},
                isDev: {$isDev},
                timestamp: '" . now()->toISOString() . "'
            };
            
            console.log('🖼️ Preview window loaded successfully');
            console.log('📚 Required libraries:', window.PREVIEW_CONFIG.libraries);
            console.log('🔧 Alpine version:', window.Alpine?.version);
            console.log('✨ GSAP available:', typeof window.gsap !== 'undefined');
            
            // Esperar a que app.js esté listo
            document.addEventListener('app:ready', function(event) {
                console.log('✅ Preview initialized with app.js');
                console.log('📦 Available components:', event.detail.components);
                
                // Verificar elementos Alpine
                setTimeout(() => {
                    const alpineElements = document.querySelectorAll('[x-data]');
                    console.log('🎿 Found', alpineElements.length, 'Alpine elements');
                    
                    alpineElements.forEach((el, index) => {
                        console.log('Element', index + ':', {
                            xData: el.getAttribute('x-data'),
                            hasAlpineData: !!el._x_dataStack,
                            element: el
                        });
                    });
                }, 100);
            });
            ";
        }

    /**
     * Datos de prueba por defecto
     */
    protected function getDefaultTestData(): array
    {
        return [
            'title' => 'Título de Ejemplo',
            'description' => 'Descripción de ejemplo para el componente.',
            'content' => 'Contenido de prueba para verificar el funcionamiento del componente.',
            'image' => 'https://picsum.photos/400/200?random=1',
            'button_text' => 'Botón de Ejemplo',
            'link' => '#ejemplo',
            'author' => 'Autor de Ejemplo',
            'date' => now()->format('d/m/Y'),
            'price' => '$99.99',
            'category' => 'Categoría Ejemplo',
            'slides' => [
                ['title' => 'Slide 1', 'content' => 'Contenido del primer slide', 'image' => 'https://picsum.photos/400/200?random=2'],
                ['title' => 'Slide 2', 'content' => 'Contenido del segundo slide', 'image' => 'https://picsum.photos/400/200?random=3'],
                ['title' => 'Slide 3', 'content' => 'Contenido del tercer slide', 'image' => 'https://picsum.photos/400/200?random=4']
            ],
            'items' => [
                ['name' => 'Item 1', 'value' => 'Valor 1'],
                ['name' => 'Item 2', 'value' => 'Valor 2'],
                ['name' => 'Item 3', 'value' => 'Valor 3']
            ]
        ];
    }

    /**
     * Generar preview de error
     */
    protected function generateErrorPreview(string $error): string
    {
        return "
        <div class=\"error-preview\">
            <h3>❌ Error en el Preview</h3>
            <p><strong>Error:</strong> {$error}</p>
            <small>Revisa la consola del navegador para más detalles.</small>
        </div>";
    }

    /**
     * Generar error de componente específico
     */
    protected function generateComponentError(string $error): string
    {
        return "
        <div class=\"error-preview\">
            <h4>❌ Error al renderizar componente</h4>
            <code>{$error}</code>
            <p><small>Verifica la sintaxis Blade del componente.</small></p>
        </div>";
    }

    /**
     * Detectar librerías con información detallada (para UI)
     */
    public function detectLibrariesWithDetails(string $bladeCode): array
    {
        $detected = [];
        $libraries = $this->detectRequiredLibraries($bladeCode);
        
        foreach ($libraries as $library) {
            $detected[$library] = [
                'name' => $library,
                'category' => $this->getLibraryCategory($library),
                'description' => $this->getLibraryDescription($library),
                'detected' => true
            ];
        }
        
        return $detected;
    }

    /**
     * Obtener categoría de la librería
     */
    protected function getLibraryCategory(string $library): string
    {
        $categories = [
            'gsap' => 'Animaciones',
            'swiper' => 'Sliders',
            'fullcalendar' => 'Widgets',
            'aos' => 'Animaciones'
        ];
        
        return $categories[$library] ?? 'General';
    }

    /**
     * Obtener descripción de la librería
     */
    protected function getLibraryDescription(string $library): string
    {
        $descriptions = [
            'gsap' => 'Animaciones avanzadas con GSAP',
            'swiper' => 'Sliders y carruseles responsivos',
            'fullcalendar' => 'Calendarios interactivos',
            'aos' => 'Animaciones al hacer scroll'
        ];
        
        return $descriptions[$library] ?? 'Librería externa';
    }

    /**
     * Validar código Blade
     */
    public function validateBladeCode(string $bladeCode): array
    {
        $errors = [];
        
        if (empty(trim($bladeCode))) {
            $errors[] = 'El código Blade no puede estar vacío';
        }
        
        // Verificar sintaxis básica
        if (preg_match('/\{\{[^}]*\{\{|\}\}[^{]*\}\}/', $bladeCode)) {
            $errors[] = 'Sintaxis de Blade incorrecta: llaves mal balanceadas';
        }
        
        return $errors;
    }

    /**
     * Configuración por defecto
     */
    public function getDefaultConfig(): array
    {
        return [
            'testData' => [],
            'wrapInContainer' => true,
            'showErrors' => config('app.debug'),
            'libraries' => []
        ];
    }
}w
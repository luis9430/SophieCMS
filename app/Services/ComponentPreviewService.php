<?php

namespace App\Services;

use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class ComponentPreviewService
{
    protected array $assetLibraries;
    protected array $detectionPatterns;

    public function __construct()
    {
        $this->assetLibraries = config('pagebuilder.asset_libraries', $this->getDefaultAssetLibraries());
        $this->detectionPatterns = config('pagebuilder.detection_patterns', $this->getDefaultDetectionPatterns());
    }

    /**
     * Método principal: generar preview completo
     */
    public function generatePreview(string $bladeCode, array $testData = []): string
    {
        try {
            // 1. Detectar librerías automáticamente
            $requiredLibraries = $this->detectRequiredLibraries($bladeCode);
            
            // 2. Procesar código Blade
            $processedContent = $this->processBlade($bladeCode, $testData);
            
            // 3. Generar HTML completo
            return $this->buildPreviewHTML($processedContent, $requiredLibraries);
            
        } catch (\Exception $e) {
            Log::error('ComponentPreviewService Error: ' . $e->getMessage());
            return $this->generateErrorPreview($e->getMessage());
        }
    }

    /**
     * Detectar librerías requeridas (mejorado para Asset Manager)
     */
    protected function detectRequiredLibraries(string $bladeCode): array
    {
        $libraries = [];
        
        // Patrones más específicos y precisos
        $detectionRules = [
            'gsap' => [
                '/x-data=["\']gsap/i',                    // x-data="gsapSlider", "gsapFade", etc.
                '/gsap\./i',                              // window.gsap.to()
                '/x-data=["\'].*fade["\'].*\(/i',         // x-data="gsapFade()"
                '/x-data=["\'].*slide["\'].*\(/i',        // x-data="gsapSlider()"
                '/x-data=["\'].*reveal["\'].*\(/i',       // x-data="gsapReveal()"
                '/x-data=["\'].*timeline["\'].*\(/i',     // x-data="gsapTimeline()"
            ],
            'swiper' => [
                '/x-data=["\']swiper/i',                  // x-data="swiperBasic"
                '/Swiper/i',                              // new Swiper()
                '/swiper-/i',                             // CSS classes swiper-*
                '/<div[^>]*swiper[^>]*>/i',               // <div class="swiper">
            ],
            'fullcalendar' => [
                '/x-data=["\'].*calendar/i',              // x-data="fullCalendar"
                '/FullCalendar/i',                        // new FullCalendar()
                '/calendar-/i',                           // CSS classes calendar-*
                '/@click=["\'].*calendar/i',              // @click="toggleCalendar"
            ],
            'aos' => [
                '/data-aos/i',                            // data-aos="fade-up"
                '/AOS\./i',                               // AOS.init()
                '/x-data=["\'].*aos/i',                   // x-data="aosAnimation"
                '/aos-/i',                                // CSS classes aos-*
            ],
            'chartjs' => [
                '/x-data=["\'].*chart/i',                 // x-data="chartComponent"
                '/Chart\./i',                             // new Chart()
                '/chart-/i',                              // CSS classes chart-*
                '/<canvas[^>]*chart/i',                   // <canvas class="chart">
            ],
            'dompurify' => [
                '/DOMPurify/i',                           // DOMPurify.sanitize()
                '/x-data=["\'].*sanitize/i',              // x-data="sanitizeComponent"
                '/v-html/i',                              // Si hay contenido dinámico
                '/{!![^}]*!!}/i',                         // {!! $content !!}
            ]
        ];
        
        foreach ($detectionRules as $library => $patterns) {
            foreach ($patterns as $pattern) {
                if (preg_match($pattern, $bladeCode)) {
                    $libraries[] = $library;
                    break; // Una vez detectado, no seguir buscando patrones para esta librería
                }
            }
        }
        
        return array_unique($libraries);
    }

    /**
     * Detectar con detalles adicionales (para UI de sugerencias)
     */
    public function detectAssetsWithDetails(string $bladeCode): array
    {
        $detected = [];
        $detectionRules = $this->getDetailedDetectionRules();
        
        foreach ($detectionRules as $library => $config) {
            $matches = [];
            $confidence = 0;
            
            foreach ($config['patterns'] as $pattern => $weight) {
                if (preg_match($pattern, $bladeCode, $patternMatches)) {
                    $matches[] = [
                        'pattern' => $pattern,
                        'match' => $patternMatches[0] ?? '',
                        'weight' => $weight
                    ];
                    $confidence += $weight;
                }
            }
            
            if ($confidence > 0) {
                $detected[$library] = [
                    'confidence' => min($confidence, 100), // Max 100%
                    'matches' => $matches,
                    'reason' => $this->getDetectionReason($library, $matches),
                    'category' => $config['category']
                ];
            }
        }
        
        // Ordenar por confianza (mayor primero)
        uasort($detected, function($a, $b) {
            return $b['confidence'] <=> $a['confidence'];
        });
        
        return $detected;
    }

    /**
     * Reglas de detección con pesos y categorías
     */
    protected function getDetailedDetectionRules(): array
    {
        return [
            'gsap' => [
                'category' => 'animations',
                'patterns' => [
                    '/x-data=["\']gsapSlider/i' => 80,        // Muy específico
                    '/x-data=["\']gsapFade/i' => 80,          // Muy específico  
                    '/x-data=["\']gsapReveal/i' => 80,        // Muy específico
                    '/gsap\./i' => 60,                        // window.gsap usage
                    '/x-data=["\'].*fade["\'].*\(/i' => 40,   // Posible uso de fade
                    '/timeline|stagger|tween/i' => 30,        // Términos relacionados
                ]
            ],
            'swiper' => [
                'category' => 'sliders', 
                'patterns' => [
                    '/x-data=["\']swiperBasic/i' => 90,       // Muy específico
                    '/x-data=["\']swiper/i' => 70,            // Específico
                    '/new Swiper/i' => 80,                    // Constructor directo
                    '/swiper-slide|swiper-wrapper/i' => 60,   // Estructura HTML
                    '/class=["\'][^"\']*swiper/i' => 50,      // CSS classes
                ]
            ],
            'fullcalendar' => [
                'category' => 'widgets',
                'patterns' => [
                    '/x-data=["\'].*calendar/i' => 70,
                    '/FullCalendar/i' => 80,
                    '/calendar-/i' => 40,
                    '/event.*calendar|calendar.*event/i' => 50,
                ]
            ],
            'aos' => [
                'category' => 'animations',
                'patterns' => [
                    '/data-aos=["\'][^"\']+/i' => 90,         // data-aos="fade-up"
                    '/AOS\.init|AOS\.refresh/i' => 80,        // AOS methods
                    '/aos-/i' => 40,                          // CSS classes
                ]
            ],
            'chartjs' => [
                'category' => 'data-visualization',
                'patterns' => [
                    '/new Chart/i' => 80,
                    '/x-data=["\'].*chart/i' => 60,
                    '/<canvas[^>]*chart/i' => 70,
                    '/chart.*data|data.*chart/i' => 40,
                ]
            ]
        ];
    }

    /**
     * Generar razón legible de por qué se detectó
     */
    protected function getDetectionReason(string $library, array $matches): string
    {
        if (empty($matches)) return "Detectado automáticamente";
        
        $topMatch = $matches[0];
        $reasons = [
            'gsap' => [
                '/x-data=["\']gsap/' => "Se encontró componente Alpine con GSAP: {match}",
                '/gsap\./' => "Se encontró uso directo de GSAP: {match}",
                '/fade|slide|reveal/' => "Se detectaron animaciones compatibles con GSAP"
            ],
            'swiper' => [
                '/x-data=["\']swiper/' => "Se encontró componente Swiper: {match}",
                '/new Swiper/' => "Se encontró constructor de Swiper: {match}",
                '/swiper-/' => "Se encontraron clases CSS de Swiper"
            ],
            'fullcalendar' => [
                '/calendar/' => "Se detectó funcionalidad de calendario: {match}"
            ],
            'aos' => [
                '/data-aos/' => "Se encontraron atributos AOS: {match}",
                '/AOS\./' => "Se encontró uso directo de AOS: {match}"
            ],
            'chartjs' => [
                '/Chart/' => "Se detectó uso de Chart.js: {match}",
                '/canvas.*chart/' => "Se encontró canvas para gráficos"
            ]
        ];
        
        foreach ($reasons[$library] ?? [] as $pattern => $template) {
            if (preg_match($pattern, $topMatch['pattern'])) {
                return str_replace('{match}', $topMatch['match'], $template);
            }
        }
        
        return "Detectado por patrón: " . $topMatch['match'];
    }

    /**
     * Procesar código Blade (copiado de tu controlador)
     */
    protected function processBlade(string $bladeCode, array $testData = []): string
    {
        $tempFile = storage_path('app/temp_component_' . uniqid() . '.blade.php');
        
        try {
            // Datos por defecto
            $defaultData = [
                'title' => 'Título de Ejemplo',
                'description' => 'Descripción de ejemplo para el componente.',
                'content' => 'Contenido de prueba para verificar el componente.',
                'image' => 'https://via.placeholder.com/400x200/4F46E5/FFFFFF?text=Imagen+de+Prueba',
                'button_text' => 'Botón de Ejemplo',
                'link' => '#ejemplo',
                'author' => 'Autor de Ejemplo',
                'date' => now()->format('d/m/Y'),
                'price' => '$99.99',
                'category' => 'Categoría Ejemplo',
                'slides' => [
                    ['title' => 'Slide 1', 'content' => 'Contenido del primer slide'],
                    ['title' => 'Slide 2', 'content' => 'Contenido del segundo slide'],
                    ['title' => 'Slide 3', 'content' => 'Contenido del tercer slide']
                ]
            ];
            
            $allData = array_merge($defaultData, $testData);
            
            File::put($tempFile, $bladeCode);
            $rendered = View::file($tempFile, $allData)->render();
            
            return $rendered;
            
        } finally {
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }
        }
    }

    /**
     * Construir HTML final del preview
     */
    protected function buildPreviewHTML(string $content, array $requiredLibraries): string
    {
        $nonce = base64_encode(random_bytes(16));
        
        // Generar tags de assets
        $assetTags = $this->generateAssetTags($requiredLibraries);
        
        // Cargar ComponentManager + plugins
        $componentSystemJS = $this->loadComponentSystem($requiredLibraries, $nonce);
        
        // ✅ CSP basado en entorno
        $csp = $this->getCSPForEnvironment();
        
        return view('component-preview.wrapper', [
            'content' => $content,
            'assetTags' => $assetTags,
            'componentSystemJS' => $componentSystemJS,
            'nonce' => $nonce,
            'csp' => $csp
        ])->render();
    }

    /**
     * CSP basado en entorno
     */
    protected function getCSPForEnvironment(): string
    {
        if (app()->environment('local')) {
            // ✅ Ultra-permisivo para desarrollo
            return "default-src *; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'; img-src * data: blob:; connect-src *;";
        }
        
        // Restrictivo para producción
        return "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' https: data: blob:;";
    }

    /**
     * Generar tags de assets para librerías requeridas
     */
    protected function generateAssetTags(array $requiredLibraries): string
    {
        // ✅ Solo Tailwind via CDN + Vite para el resto
        return '
        <script src="https://cdn.tailwindcss.com"></script>
        ' . $this->getViteAssets() . '
        ';
    }

    /**
     * Cargar assets via Vite
     */
    protected function getViteAssets(): string
    {
        try {
            // Generar tags de Vite
            return app(\Illuminate\Foundation\Vite::class)(['resources/js/component-preview.js']);
        } catch (\Exception $e) {
            Log::warning('Vite assets not available, falling back to CDN');
            return $this->getCDNFallback();
        }
    }

    /**
     * Fallback a CDN si Vite no está disponible
     */
    protected function getCDNFallback(): string
    {
        return '
        <script src="https://unpkg.com/swiper@11/swiper-bundle.min.js"></script>
        <link rel="stylesheet" href="https://unpkg.com/swiper@11/swiper-bundle.min.css">
        <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
        <script>
        document.addEventListener("alpine:init", () => {
            Alpine.data("swiperBasic", (config = {}) => ({
                init() {
                    this.$nextTick(() => {
                        if (window.Swiper) {
                            new Swiper(this.$el.querySelector(".swiper") || this.$el, {
                                navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
                                pagination: { el: ".swiper-pagination", clickable: true },
                                ...config
                            });
                        }
                    });
                }
            }));
        });
        </script>
        ';
    }

    /**
     * Cargar ComponentManager + plugins desde archivos existentes
     */
    protected function loadComponentSystem(array $requiredLibraries, string $nonce): string
    {
        // ✅ Con Vite ya no necesitamos ComponentManager complejo
        // Alpine + Swiper se cargan via Vite bundle
        return "<script nonce=\"{$nonce}\">
            console.log('📦 Component system loaded via Vite');
            
            // Debug info adicional
            setTimeout(() => {
                console.log('🔍 System status:', {
                    Alpine: typeof window.Alpine !== 'undefined' ? '✅ Loaded' : '❌ Missing',
                    Swiper: typeof window.Swiper !== 'undefined' ? '✅ Loaded' : '❌ Missing',
                    AlpineVersion: window.Alpine?.version || 'N/A'
                });
            }, 500);
        </script>";
    }

    /**
     * ComponentManager fallback (simplificado)
     */
    protected function getFallbackComponentManager(): string
    {
        return "
        window.ComponentManager = {
            init() { 
                console.log('🚀 ComponentManager (fallback) ready');
                return Promise.resolve(); 
            },
            register() {},
            unregister() {},
            getStats() { return { version: 'fallback' }; }
        };
        ";
    }

    /**
     * Script de inicialización
     */
    protected function getInitializationScript(): string
    {
        return "
        // ✅ Inicialización controlada y sincronizada
        (function() {
            'use strict';
            
            console.log('🚀 Starting controlled component initialization...');
            
            // Prevenir auto-start de Alpine hasta que todo esté listo
            if (typeof window.Alpine !== 'undefined') {
                window.Alpine.data('__prevent_autostart', () => ({}));
            }
            
            function waitForEverything() {
                const maxAttempts = 100;
                let attempts = 0;
                
                function check() {
                    attempts++;
                    
                    const conditions = [
                        typeof window.Alpine !== 'undefined',
                        typeof window.ComponentManager !== 'undefined',
                        typeof window.Swiper !== 'undefined' || true // Swiper es opcional
                    ];
                    
                    const allReady = conditions.every(condition => condition === true);
                    
                    if (allReady) {
                        console.log('✅ All systems ready, initializing...');
                        initializeEverything();
                    } else if (attempts < maxAttempts) {
                        setTimeout(check, 50);
                    } else {
                        console.warn('⚠️ Timeout, proceeding anyway...');
                        initializeEverything();
                    }
                }
                
                check();
            }
            
            function initializeEverything() {
                // 1. Inicializar ComponentManager primero
                if (window.ComponentManager && typeof window.ComponentManager.init === 'function') {
                    window.ComponentManager.init().then(() => {
                        console.log('📦 ComponentManager initialized, starting Alpine...');
                        startAlpine();
                    }).catch(error => {
                        console.error('❌ ComponentManager error:', error);
                        startAlpine(); // Intentar Alpine de todos modos
                    });
                } else {
                    console.warn('⚠️ ComponentManager not available, starting Alpine directly');
                    startAlpine();
                }
            }
            
            function startAlpine() {
                try {
                    if (window.Alpine && typeof window.Alpine.start === 'function') {
                        console.log('🎿 Starting Alpine.js...');
                        window.Alpine.start();
                        console.log('✅ Alpine.js started successfully');
                    } else {
                        console.error('❌ Alpine.js not available');
                    }
                } catch (error) {
                    if (error.message.includes('already been initialized')) {
                        console.log('ℹ️ Alpine already running - this is normal');
                    } else {
                        console.error('❌ Error starting Alpine:', error);
                    }
                }
            }
            
            // Iniciar el proceso
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', waitForEverything);
            } else {
                waitForEverything();
            }
            
        })();
        ";
    }

    /**
     * Preview de error
     */
    protected function generateErrorPreview(string $errorMessage): string
    {
        return view('component-preview.error', [
            'errorMessage' => $errorMessage
        ])->render();
    }

    /**
     * Configuración por defecto de assets
     */
    protected function getDefaultAssetLibraries(): array
    {
        return [
            'gsap' => [
                'js' => 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js'
            ],
            'swiper' => [
                'css' => 'https://unpkg.com/swiper@11/swiper-bundle.min.css',
                'js' => 'https://unpkg.com/swiper@11/swiper-bundle.min.js'
            ],
            'aos' => [
                'css' => 'https://unpkg.com/aos@2.3.1/dist/aos.css',
                'js' => 'https://unpkg.com/aos@2.3.1/dist/aos.js'
            ]
        ];
    }

    /**
     * Patrones de detección por defecto
     */
    protected function getDefaultDetectionPatterns(): array
    {
        return [
            'gsap' => [
                '/x-data=["\'].*gsap/i',
                '/gsap\./i',
                '/x-data=["\'].*fade/i',
                '/x-data=["\'].*reveal/i',
                '/x-data=["\'].*slider/i'
            ],
            'swiper' => [
                '/x-data=["\'].*swiper/i',
                '/Swiper/i',
                '/swiper-/i'
            ],
            'aos' => [
                '/data-aos/i',
                '/AOS\./i'
            ]
        ];
    }
}
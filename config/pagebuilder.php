<?php

// config/pagebuilder.php

return [

    /*
    |--------------------------------------------------------------------------
    | Page Builder Asset Management
    |--------------------------------------------------------------------------
    |
    | Configuración para el manejo de assets del page builder
    |
    */

    // Habilitar sistema optimizado de assets
    'use_optimized_assets' => env('PAGEBUILDER_OPTIMIZED_ASSETS', false),

    // Configuración de assets
    'assets' => [
        'cdn' => [
            'tailwind' => 'https://cdn.tailwindcss.com',
            'alpine' => 'https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js',
        ],
        'local_assets_enabled' => env('PAGEBUILDER_LOCAL_ASSETS', false),
        'minify_output' => env('PAGEBUILDER_MINIFY', false), // Cambio aquí
    ],

    /*
    |--------------------------------------------------------------------------
    | Component System Configuration
    |--------------------------------------------------------------------------
    |
    | Configuración del sistema de componentes modular
    |
    */

    'component_system' => [
        // Versión del sistema
        'version' => '2.0.0',
        
        // Debug mode (valor fijo por ahora)
        'debug' => env('PAGEBUILDER_DEBUG', true), // Cambio aquí
        
        // Auto-detección de librerías
        'auto_detect_libraries' => true,
        
        // Directorio de plugins
        'plugins_path' => 'js/component-system/plugins',
        
        // Plugins disponibles
        'available_plugins' => [
            'swiper' => [
                'class' => 'SwiperPlugin',
                'file' => 'SwiperPlugin.js',
                'enabled' => true
            ],
            'gsap' => [
                'class' => 'GSAPPlugin', 
                'file' => 'GSAPPlugin.js',
                'enabled' => true
            ],
            'fullcalendar' => [
                'class' => 'FullCalendarPlugin',
                'file' => 'FullCalendarPlugin.js',
                'enabled' => false // Aún no implementado
            ],
            'aos' => [
                'class' => 'AOSPlugin',
                'file' => 'AOSPlugin.js', 
                'enabled' => false // Aún no implementado
            ],
            'chart' => [
                'class' => 'ChartPlugin',
                'file' => 'ChartPlugin.js',
                'enabled' => false // Aún no implementado
            ]
        ]
    ],

    /*
    |--------------------------------------------------------------------------
    | Library Detection Patterns
    |--------------------------------------------------------------------------
    |
    | Patrones para auto-detección de librerías en código Blade
    |
    */

    'detection_patterns' => [
        'swiper' => [
            '/x-data=["\'].*swiper/i',
            '/Swiper/i',
            '/swiper-/i',
            '/\.swiper\b/i'
        ],
        'gsap' => [
            '/x-data=["\'].*gsap/i',
            '/gsap\./i',
            '/GSAP/i',
            '/\.to\(/i',
            '/\.from\(/i',
            '/\.timeline/i'
        ],
        'fullcalendar' => [
            '/FullCalendar/i',
            '/fullcalendar/i',
            '/@fullcalendar/i'
        ],
        'aos' => [
            '/AOS\./i',
            '/aos-/i',
            '/data-aos/i'
        ],
        'chart' => [
            '/Chart\.js/i',
            '/chart\.js/i',
            '/new Chart/i',
            '/chartjs/i'
        ]
    ],

    /*
    |--------------------------------------------------------------------------
    | Security Configuration
    |--------------------------------------------------------------------------
    |
    | Configuración de seguridad para el page builder
    |
    */

    'security' => [
        // Usar Content Security Policy
        'enable_csp' => true,
        
        // Usar Subresource Integrity en producción
        'enable_sri' => env('PAGEBUILDER_SRI', false), // Cambio aquí
        
        // Dominios permitidos para CDN
        'allowed_cdn_domains' => [
            'cdn.tailwindcss.com',
            'unpkg.com',
            'cdn.jsdelivr.net',
            'cdnjs.cloudflare.com'
        ],
        
        // Siempre incluir DOMPurify
        'force_dompurify' => true
    ],

    /*
    |--------------------------------------------------------------------------
    | Performance Configuration
    |--------------------------------------------------------------------------
    |
    | Configuración de rendimiento
    |
    */

    'performance' => [
        // Cache de detección de librerías (en segundos)
        'detection_cache_ttl' => 3600,
        
        // Preload de librerías críticas
        'preload_critical_assets' => true,
        
        // Lazy loading de plugins
        'lazy_load_plugins' => true,
        
        // Minificar JS inline
        'minify_inline_js' => false // Cambio aquí
    ],

    /*
    |--------------------------------------------------------------------------
    | Development Configuration  
    |--------------------------------------------------------------------------
    |
    | Configuración específica para desarrollo
    |
    */

    'development' => [
        // Mostrar información de debug
        'show_debug_info' => env('PAGEBUILDER_DEBUG', false),
        
        // Log de detección de librerías
        'log_library_detection' => env('PAGEBUILDER_LOG_DETECTION', false),
        
        // Cargar plugins desde archivos separados
        'load_plugins_from_files' => env('PAGEBUILDER_DEV_PLUGINS', true),
        
        // Helpers de debug disponibles
        'enable_debug_helpers' => env('PAGEBUILDER_DEBUG_HELPERS', true)
    ]

];
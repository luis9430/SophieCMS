
<?php
// config/pagebuilder.php
return [
    /*
    |--------------------------------------------------------------------------
    | Page Builder Configuration
    |--------------------------------------------------------------------------
    |
    | Aquí puedes configurar todas las opciones del Page Builder
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Componentes Habilitados
    |--------------------------------------------------------------------------
    |
    | Lista de componentes que estarán disponibles en el Page Builder
    |
    */
    'enabled_components' => [
        'hero',
        'card', 
        'button',
        'testimonial',
        'contact-form',
        'grid',
        'container',
        'modal',
        'text-block',
        'image-text',
        'section',
    ],

    /*
    |--------------------------------------------------------------------------
    | Configuración de Archivos Temporales
    |--------------------------------------------------------------------------
    */
    'temp_files' => [
        'path' => storage_path('app/temp'),
        'cleanup_days' => 7, // Días después de los cuales se eliminan archivos temporales
        'prefix' => 'pagebuilder_',
    ],

    /*
    |--------------------------------------------------------------------------
    | Configuración de Backups
    |--------------------------------------------------------------------------
    */
    'backups' => [
        'enabled' => true,
        'path' => storage_path('app/backups/pages'),
        'auto_backup_on_save' => true, // Crear backup automático al guardar
        'retention_days' => 30, // Días para conservar backups
    ],

    /*
    |--------------------------------------------------------------------------
    | Configuración de Templates
    |--------------------------------------------------------------------------
    */
    'templates' => [
        'cache_enabled' => true,
        'cache_duration' => 3600, // 1 hora en segundos
        'default_category' => 'general',
    ],

    /*
    |--------------------------------------------------------------------------
    | Configuración de Componentes
    |--------------------------------------------------------------------------
    */
    'components' => [
        'cache_enabled' => true,
        'cache_duration' => 3600,
        'preview_size' => '300x200', // Tamaño de imágenes preview
        'allowed_categories' => [
            'layout',
            'content', 
            'interactive',
            'navigation',
            'footer',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Configuración de Preview
    |--------------------------------------------------------------------------
    */
    'preview' => [
        'timeout' => 30, // Timeout en segundos para generar preview
        'cache_enabled' => false, // No cachear previews por defecto
        'responsive_breakpoints' => [
            'mobile' => '375px',
            'tablet' => '768px', 
            'desktop' => '1024px',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Configuración de Seguridad
    |--------------------------------------------------------------------------
    */
    'security' => [
        'allowed_html_tags' => [
            'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'a', 'img', 'button', 'form', 'input', 'textarea', 'select',
            'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody',
            'section', 'article', 'header', 'footer', 'nav', 'aside',
            'blockquote', 'strong', 'em', 'br', 'hr', 'iframe', 'video',
        ],
        'csrf_protection' => true,
        'xss_protection' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Configuración de Assets
    |--------------------------------------------------------------------------
    */
    'assets' => [
        'cdn' => [
            'tailwind' => 'https://cdn.tailwindcss.com',
            'alpine' => 'https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js',
        ],
        'local_assets_enabled' => false, // Si usar assets locales en lugar de CDN
        'minify_output' => env('APP_ENV') === 'production',
    ],

    /*
    |--------------------------------------------------------------------------
    | Configuración de Exportación
    |--------------------------------------------------------------------------
    */
    'export' => [
        'formats' => ['html', 'pdf'], // Formatos de exportación disponibles
        'include_assets' => true, // Incluir CSS/JS inline en exports
        'optimize_images' => true,
        'minify_html' => env('APP_ENV') === 'production',
    ],

    /*
    |--------------------------------------------------------------------------
    | Configuración de Roles y Permisos
    |--------------------------------------------------------------------------
    */
    'permissions' => [
        'create_pages' => ['admin', 'editor'],
        'edit_pages' => ['admin', 'editor'],
        'delete_pages' => ['admin'],
        'publish_pages' => ['admin', 'editor'],
        'manage_components' => ['admin'],
        'manage_templates' => ['admin'],
        'access_page_builder' => ['admin', 'editor'],
    ],
];
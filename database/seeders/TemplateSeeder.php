<?php

// ===================================================================
// database/seeders/TemplateSeeder.php
// ===================================================================

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Template;

class TemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Layout Templates
        $this->createLayoutTemplates();
        
        // Header Templates
        $this->createHeaderTemplates();
        
        // Footer Templates
        $this->createFooterTemplates();
        
        // Navigation Templates
        $this->createNavigationTemplates();
        
        // Component Templates
        $this->createComponentTemplates();
    }

    /**
     * Crear templates de layout
     */
    private function createLayoutTemplates(): void
    {
        // Layout Base
        Template::create([
            'name' => 'Layout Base',
            'type' => 'layout',
            'category' => 'structure',
            'description' => 'Layout básico con estructura HTML5 estándar',
            'is_global' => true,
            'content' => '<!DOCTYPE html>
<html lang="{{ page.language | default: \'es\' }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ page.title }}{% if site.name %} - {{ site.name }}{% endif %}</title>
    {% if page.meta_description %}
        <meta name="description" content="{{ page.meta_description }}">
    {% endif %}
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
    {{ additional_styles }}
</head>
<body class="bg-white">
    {% if header_template %}
        {{ header_template }}
    {% endif %}
    
    <main class="min-h-screen">
        {{ content }}
    </main>
    
    {% if footer_template %}
        {{ footer_template }}
    {% endif %}
    
    {{ additional_scripts }}
</body>
</html>',
            'variables' => [
                'required' => ['content'],
                'optional' => [
                    'page' => [
                        'title' => 'string',
                        'language' => 'string',
                        'meta_description' => 'string'
                    ],
                    'site' => [
                        'name' => 'string'
                    ],
                    'header_template' => 'html',
                    'footer_template' => 'html',
                    'additional_styles' => 'html',
                    'additional_scripts' => 'html'
                ]
            ]
        ]);

        // Layout Landing Page
        Template::create([
            'name' => 'Landing Page',
            'type' => 'layout',
            'category' => 'marketing',
            'description' => 'Layout optimizado para landing pages con hero section',
            'is_global' => true,
            'content' => '<!DOCTYPE html>
<html lang="{{ page.language | default: \'es\' }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ page.title }}{% if site.name %} - {{ site.name }}{% endif %}</title>
    {% if page.meta_description %}
        <meta name="description" content="{{ page.meta_description }}">
    {% endif %}
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <style>
        .hero-gradient {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
    </style>
</head>
<body class="bg-gray-50">
    {% if header_template %}
        {{ header_template }}
    {% endif %}
    
    <main>
        {{ content }}
    </main>
    
    {% if footer_template %}
        {{ footer_template }}
    {% endif %}
</body>
</html>',
            'variables' => [
                'required' => ['content'],
                'optional' => [
                    'page' => [
                        'title' => 'string',
                        'meta_description' => 'string'
                    ],
                    'site' => ['name' => 'string'],
                    'header_template' => 'html',
                    'footer_template' => 'html'
                ]
            ]
        ]);
    }

    /**
     * Crear templates de header
     */
    private function createHeaderTemplates(): void
    {
        // Header Simple
        Template::create([
            'name' => 'Header Simple',
            'type' => 'header',
            'category' => 'navigation',
            'description' => 'Header básico con logo y navegación horizontal',
            'is_global' => true,
            'content' => '<header class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
            <!-- Logo -->
            <div class="flex-shrink-0">
                {% if logo_url %}
                    <img src="{{ logo_url }}" alt="{{ site_name | default: \'Logo\' }}" class="h-8 w-auto">
                {% else %}
                    <h1 class="text-xl font-bold text-gray-900">{{ site_name | default: \'Mi Sitio\' }}</h1>
                {% endif %}
            </div>

            <!-- Navigation -->
            {% if navigation %}
                <nav class="hidden md:flex space-x-8">
                    {% for item in navigation %}
                        <a href="{{ item.url }}" 
                           class="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">
                            {{ item.title }}
                        </a>
                    {% endfor %}
                </nav>
            {% endif %}

            <!-- Mobile menu button -->
            <div class="md:hidden">
                <button x-data @click="$dispatch(\'toggle-mobile-menu\')" 
                        class="text-gray-500 hover:text-gray-900">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
</header>',
            'variables' => [
                'optional' => [
                    'site_name' => 'string',
                    'logo_url' => 'string',
                    'navigation' => [
                        'type' => 'array',
                        'example' => [
                            ['title' => 'Inicio', 'url' => '/'],
                            ['title' => 'Acerca', 'url' => '/about'],
                            ['title' => 'Contacto', 'url' => '/contact']
                        ]
                    ]
                ]
            ]
        ]);

        // Header con CTA
        Template::create([
            'name' => 'Header con CTA',
            'type' => 'header',
            'category' => 'marketing',
            'description' => 'Header con botón de llamada a la acción',
            'is_global' => true,
            'content' => '<header class="bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
            <!-- Logo -->
            <div class="flex-shrink-0">
                {% if logo_url %}
                    <img src="{{ logo_url }}" alt="{{ site_name | default: \'Logo\' }}" class="h-8 w-auto">
                {% else %}
                    <h1 class="text-xl font-bold text-gray-900">{{ site_name | default: \'Mi Sitio\' }}</h1>
                {% endif %}
            </div>

            <!-- Navigation -->
            <div class="hidden md:flex items-center space-x-8">
                {% if navigation %}
                    <nav class="flex space-x-8">
                        {% for item in navigation %}
                            <a href="{{ item.url }}" 
                               class="text-gray-500 hover:text-gray-900 text-sm font-medium">
                                {{ item.title }}
                            </a>
                        {% endfor %}
                    </nav>
                {% endif %}
                
                <!-- CTA Button -->
                {% if cta_text and cta_url %}
                    <a href="{{ cta_url }}" 
                       class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                        {{ cta_text }}
                    </a>
                {% endif %}
            </div>
        </div>
    </div>
</header>',
            'variables' => [
                'optional' => [
                    'site_name' => 'string',
                    'logo_url' => 'string',
                    'navigation' => 'array',
                    'cta_text' => 'string',
                    'cta_url' => 'string'
                ]
            ]
        ]);
    }

    /**
     * Crear templates de footer
     */
    private function createFooterTemplates(): void
    {
        // Footer Simple
        Template::create([
            'name' => 'Footer Simple',
            'type' => 'footer',
            'category' => 'structure',
            'description' => 'Footer básico con copyright',
            'is_global' => true,
            'content' => '<footer class="bg-gray-50 border-t">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="text-center">
            <p class="text-gray-500 text-sm">
                © {{ current_year | default: "2024" }} {{ site_name | default: "Mi Sitio" }}. 
                Todos los derechos reservados.
            </p>
        </div>
    </div>
</footer>',
            'variables' => [
                'optional' => [
                    'site_name' => 'string',
                    'current_year' => 'string'
                ]
            ]
        ]);

        // Footer Completo
        Template::create([
            'name' => 'Footer Completo',
            'type' => 'footer',
            'category' => 'structure',
            'description' => 'Footer con links, redes sociales y información de contacto',
            'is_global' => true,
            'content' => '<footer class="bg-gray-900 text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
            <!-- Logo y descripción -->
            <div class="col-span-1 md:col-span-2">
                <h3 class="text-lg font-semibold mb-4">{{ site_name | default: "Mi Sitio" }}</h3>
                {% if site_description %}
                    <p class="text-gray-300 mb-4">{{ site_description }}</p>
                {% endif %}
                
                <!-- Redes sociales -->
                {% if social_links %}
                    <div class="flex space-x-4">
                        {% for social in social_links %}
                            <a href="{{ social.url }}" class="text-gray-300 hover:text-white">
                                {{ social.name }}
                            </a>
                        {% endfor %}
                    </div>
                {% endif %}
            </div>

            <!-- Links útiles -->
            {% if footer_links %}
                <div>
                    <h4 class="text-sm font-semibold mb-4 uppercase tracking-wider">Enlaces</h4>
                    <ul class="space-y-2">
                        {% for link in footer_links %}
                            <li>
                                <a href="{{ link.url }}" class="text-gray-300 hover:text-white text-sm">
                                    {{ link.title }}
                                </a>
                            </li>
                        {% endfor %}
                    </ul>
                </div>
            {% endif %}

            <!-- Contacto -->
            {% if contact_info %}
                <div>
                    <h4 class="text-sm font-semibold mb-4 uppercase tracking-wider">Contacto</h4>
                    <div class="space-y-2 text-sm text-gray-300">
                        {% if contact_info.email %}
                            <p>{{ contact_info.email }}</p>
                        {% endif %}
                        {% if contact_info.phone %}
                            <p>{{ contact_info.phone }}</p>
                        {% endif %}
                        {% if contact_info.address %}
                            <p>{{ contact_info.address }}</p>
                        {% endif %}
                    </div>
                </div>
            {% endif %}
        </div>

        <!-- Copyright -->
        <div class="border-t border-gray-700 mt-8 pt-8 text-center">
            <p class="text-gray-300 text-sm">
                © {{ current_year | default: "2024" }} {{ site_name | default: "Mi Sitio" }}. 
                Todos los derechos reservados.
            </p>
        </div>
    </div>
</footer>',
            'variables' => [
                'optional' => [
                    'site_name' => 'string',
                    'site_description' => 'string',
                    'current_year' => 'string',
                    'social_links' => 'array', 
                    'footer_links' => 'array',
                    'contact_info' => 'object'
                ]
            ]
        ]);
    }

    /**
     * Crear templates de navegación
     */
    private function createNavigationTemplates(): void
    {
        Template::create([
            'name' => 'Navegación Horizontal',
            'type' => 'nav',
            'category' => 'navigation',
            'description' => 'Menú de navegación horizontal responsive',
            'is_global' => true,
            'content' => '<nav x-data="{ mobileMenuOpen: false }" 
     @toggle-mobile-menu.window="mobileMenuOpen = !mobileMenuOpen"
     class="bg-white shadow">
    <div class="max-w-7xl mx-auto px-4">
        <div class="flex justify-between h-16">
            <!-- Logo -->
            <div class="flex items-center">
                <a href="/" class="flex-shrink-0">
                    {% if logo_url %}
                        <img src="{{ logo_url }}" alt="{{ site_name }}" class="h-8 w-auto">
                    {% else %}
                        <span class="text-xl font-bold">{{ site_name | default: "Logo" }}</span>
                    {% endif %}
                </a>
            </div>

            <!-- Desktop Menu -->
            {% if menu_items %}
                <div class="hidden md:flex items-center space-x-8">
                    {% for item in menu_items %}
                        <a href="{{ item.url }}" 
                           class="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                            {{ item.title }}
                        </a>
                    {% endfor %}
                </div>
            {% endif %}

            <!-- Mobile menu button -->
            <div class="md:hidden flex items-center">
                <button @click="mobileMenuOpen = !mobileMenuOpen" 
                        class="text-gray-700 hover:text-blue-600">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              x-show="!mobileMenuOpen" d="M4 6h16M4 12h16M4 18h16" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              x-show="mobileMenuOpen" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- Mobile Menu -->
        {% if menu_items %}
            <div x-show="mobileMenuOpen" 
                 x-transition:enter="transition ease-out duration-200"
                 x-transition:enter-start="opacity-0 scale-95"
                 x-transition:enter-end="opacity-100 scale-100"
                 x-transition:leave="transition ease-in duration-75"
                 x-transition:leave-start="opacity-100 scale-100"
                 x-transition:leave-end="opacity-0 scale-95"
                 class="md:hidden">
                <div class="px-2 pt-2 pb-3 space-y-1 border-t">
                    {% for item in menu_items %}
                        <a href="{{ item.url }}" 
                           class="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md">
                            {{ item.title }}
                        </a>
                    {% endfor %}
                </div>
            </div>
        {% endif %}
    </div>
</nav>',
            'variables' => [
                'optional' => [
                    'site_name' => 'string',
                    'logo_url' => 'string',
                    'menu_items' => [
                        'type' => 'array',
                        'example' => [
                            ['title' => 'Inicio', 'url' => '/'],
                            ['title' => 'Servicios', 'url' => '/services'],
                            ['title' => 'Contacto', 'url' => '/contact']
                        ]
                    ]
                ]
            ]
        ]);
    }

    /**
     * Crear templates de componentes
     */
    private function createComponentTemplates(): void
    {
        // Hero Section
        Template::create([
            'name' => 'Hero Section',
            'type' => 'component',
            'category' => 'marketing',
            'description' => 'Sección hero con título, subtítulo y CTA',
            'is_global' => true,
            'content' => '<section class="hero-gradient text-white py-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
            {% if hero_title %}
                <h1 class="text-4xl md:text-6xl font-bold mb-6">
                    {{ hero_title }}
                </h1>
            {% endif %}

            {% if hero_subtitle %}
                <p class="text-xl md:text-2xl mb-8 text-gray-100 max-w-3xl mx-auto">
                    {{ hero_subtitle }}
                </p>
            {% endif %}

            {% if hero_buttons %}
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    {% for button in hero_buttons %}
                        <a href="{{ button.url }}" 
                           class="{% if button.primary %}bg-white text-blue-600 hover:bg-gray-100{% else %}border-2 border-white text-white hover:bg-white hover:text-blue-600{% endif %} px-8 py-3 rounded-lg font-semibold transition-colors">
                            {{ button.text }}
                        </a>
                    {% endfor %}
                </div>
            {% endif %}
        </div>
    </div>
</section>',
            'variables' => [
                'optional' => [
                    'hero_title' => 'string',
                    'hero_subtitle' => 'string',
                    'hero_buttons' => [
                        'type' => 'array',
                        'example' => [
                            ['text' => 'Empezar', 'url' => '/start', 'primary' => true],
                            ['text' => 'Saber más', 'url' => '/learn', 'primary' => false]
                        ]
                    ]
                ]
            ]
        ]);

        // Features Grid
        Template::create([
            'name' => 'Grid de Características',
            'type' => 'component',
            'category' => 'content',
            'description' => 'Grid responsive para mostrar características o servicios',
            'is_global' => true,
            'content' => '<section class="py-16 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {% if section_title %}
            <div class="text-center mb-12">
                <h2 class="text-3xl font-bold text-gray-900 mb-4">{{ section_title }}</h2>
                {% if section_subtitle %}
                    <p class="text-lg text-gray-600 max-w-2xl mx-auto">{{ section_subtitle }}</p>
                {% endif %}
            </div>
        {% endif %}

        {% if features %}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-{{ columns | default: 3 }} gap-8">
                {% for feature in features %}
                    <div class="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        {% if feature.icon %}
                            <div class="text-4xl mb-4">{{ feature.icon }}</div>
                        {% endif %}
                        
                        {% if feature.title %}
                            <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ feature.title }}</h3>
                        {% endif %}
                        
                        {% if feature.description %}
                            <p class="text-gray-600">{{ feature.description }}</p>
                        {% endif %}
                    </div>
                {% endfor %}
            </div>
        {% endif %}
    </div>
</section>',
            'variables' => [
                'optional' => [
                    'section_title' => 'string',
                    'section_subtitle' => 'string',
                    'columns' => 'number',
                    'features' => [
                        'type' => 'array',
                        'example' => [
                            [
                                'icon' => '⚡',
                                'title' => 'Rápido',
                                'description' => 'Carga en menos de 1 segundo'
                            ],
                            [
                                'icon' => '🎨',
                                'title' => 'Bonito',
                                'description' => 'Diseños profesionales'
                            ]
                        ]
                    ]
                ]
            ]
        ]);

        // CTA Section
        Template::create([
            'name' => 'Sección CTA',
            'type' => 'component',
            'category' => 'marketing',
            'description' => 'Sección de llamada a la acción',
            'is_global' => true,
            'content' => '<section class="bg-blue-600 py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {% if cta_title %}
            <h2 class="text-3xl font-bold text-white mb-4">{{ cta_title }}</h2>
        {% endif %}

        {% if cta_description %}
            <p class="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">{{ cta_description }}</p>
        {% endif %}

        {% if cta_button %}
            <a href="{{ cta_button.url }}" 
               class="inline-flex items-center bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                {{ cta_button.text }}
                {% if cta_button.icon %}
                    <span class="ml-2">{{ cta_button.icon }}</span>
                {% endif %}
            </a>
        {% endif %}
    </div>
</section>',
            'variables' => [
                'optional' => [
                    'cta_title' => 'string',
                    'cta_description' => 'string',
                    'cta_button' => [
                        'type' => 'object',
                        'example' => [
                            'text' => 'Comenzar ahora',
                            'url' => '/signup',
                            'icon' => '→'
                        ]
                    ]
                ]
            ]
        ]);
    }
}


// ===================================================================
// COMANDOS PARA EJECUTAR
// ===================================================================

/*
// 1. Ejecutar las migraciones
php artisan migrate

// 2. Ejecutar los seeders
php artisan db:seed --class=TemplateSeeder

// O ejecutar todos los seeders
php artisan db:seed

// 3. Verificar que se crearon los templates
php artisan tinker
>>> App\Models\Template::count()
>>> App\Models\Template::where('type', 'layout')->get(['name', 'type'])
>>> App\Models\Template::global()->get(['name', 'type', 'category'])
*/

// ===================================================================
// EJEMPLO DE USO CON LOS TEMPLATES CREADOS
// ===================================================================

/*
// Crear una página usando los templates
$page = App\Models\Page::create([
    'title' => 'Mi Landing Page',
    'slug' => 'landing',
    'content' => [
        'blocks' => [
            [
                'type' => 'hero',
                'settings' => [
                    'title' => 'Bienvenido a Mi Sitio',
                    'subtitle' => 'La mejor experiencia digital'
                ]
            ]
        ]
    ],
    'layout_id' => 2, // Landing Page layout
    'template_assignments' => [
        'header' => 3, // Header con CTA
        'footer' => 4  // Footer Simple
    ],
    'page_variables' => [
        'hero_title' => 'Transforma tu negocio',
        'hero_subtitle' => 'Con nuestras soluciones digitales',
        'site_name' => 'Mi Empresa',
        'cta_text' => 'Comenzar gratis',
        'cta_url' => '/signup'
    ]
]);

// Obtener templates disponibles
$layouts = App\Models\Template::global()->ofType('layout')->get();
$headers = App\Models\Template::global()->ofType('header')->get();
$footers = App\Models\Template::global()->ofType('footer')->get();
*/
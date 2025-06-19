<?php

// database/seeders/PageBuilderSeeder.php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use App\Models\Website;
use App\Models\Component;
use App\Models\Template;

class PageBuilderSeeder extends Seeder
{
    public function run()
    {
        // Verificar que las tablas existen
        if (!Schema::hasTable('websites')) {
            $this->command->error('La tabla websites no existe. Ejecuta las migraciones primero.');
            return;
        }

        if (!Schema::hasTable('components')) {
            $this->command->error('La tabla components no existe. Ejecuta las migraciones primero.');
            return;
        }

        if (!Schema::hasTable('templates')) {
            $this->command->error('La tabla templates no existe. Ejecuta las migraciones primero.');
            return;
        }

        // Crear website de ejemplo
        $website = Website::firstOrCreate([
            'domain' => 'localhost'
        ], [
            'name' => 'Mi Sitio Web',
            'slug' => 'mi-sitio-web',
            'description' => 'Sitio web creado con Page Builder',
            'status' => 'published',
            'language' => 'es',
            'settings' => [
                'theme' => 'default',
                'primary_color' => '#3B82F6',
                'logo' => '',
                'show_navigation' => true,
                'show_footer' => true,
                'navigation_items' => [
                    ['label' => 'Inicio', 'url' => '/'],
                    ['label' => 'Servicios', 'url' => '/servicios'],
                    ['label' => 'Contacto', 'url' => '/contacto'],
                ],
                'footer_description' => 'Mi empresa descripción',
                'contact_info' => [
                    'email' => 'info@miempresa.com',
                    'phone' => '+1234567890',
                ],
            ],
        ]);

        $this->command->info("✓ Website creado: {$website->name}");

        // Crear componentes básicos
        $this->createComponents();
        
        // Crear templates
        $this->createTemplates();

        $this->command->info('✅ PageBuilder seeder completado!');
    }

    private function createComponents()
    {
        $components = [
            [
                'name' => 'Hero Section',
                'identifier' => 'hero',
                'category' => 'content',
                'description' => 'Sección principal con título y botón',
                'blade_template' => '<x-page-builder.hero 
    title="Título Principal" 
    subtitle="Subtítulo descriptivo"
    buttonText="Comenzar"
    buttonUrl="#"
    class="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white" />',
                'default_config' => [
                    'title' => 'Título Principal',
                    'subtitle' => 'Subtítulo descriptivo',
                    'buttonText' => 'Comenzar',
                    'buttonUrl' => '#',
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Card',
                'identifier' => 'card',
                'category' => 'content',
                'description' => 'Tarjeta de contenido',
                'blade_template' => '<x-page-builder.card 
    title="Título de la tarjeta"
    description="Descripción del contenido"
    link="#"
    linkText="Leer más"
    class="bg-white rounded-lg shadow-lg" />',
                'default_config' => [
                    'title' => 'Título de la tarjeta',
                    'description' => 'Descripción del contenido',
                    'link' => '#',
                    'linkText' => 'Leer más',
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Container',
                'identifier' => 'container',
                'category' => 'layout',
                'description' => 'Contenedor principal',
                'blade_template' => '<x-page-builder.container maxWidth="7xl" padding="8">
    <!-- Contenido aquí -->
</x-page-builder.container>',
                'default_config' => [
                    'maxWidth' => '7xl',
                    'padding' => '8',
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Grid',
                'identifier' => 'grid',
                'category' => 'layout',
                'description' => 'Sistema de grillas responsive',
                'blade_template' => '<x-page-builder.grid columns="3" gap="6" responsive="true">
    <!-- Items aquí -->
</x-page-builder.grid>',
                'default_config' => [
                    'columns' => 3,
                    'gap' => '6',
                    'responsive' => true,
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Button',
                'identifier' => 'button',
                'category' => 'interactive',
                'description' => 'Botón interactivo',
                'blade_template' => '<x-page-builder.button 
    text="Botón de Acción"
    url="#"
    variant="primary"
    size="md" />',
                'default_config' => [
                    'text' => 'Botón de Acción',
                    'url' => '#',
                    'variant' => 'primary',
                    'size' => 'md',
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Contact Form',
                'identifier' => 'contact-form',
                'category' => 'interactive',
                'description' => 'Formulario de contacto',
                'blade_template' => '<x-page-builder.contact-form 
    title="Contáctanos"
    description="Ponte en contacto con nosotros"
    :fields="[\'name\', \'email\', \'message\']"
    action="/contact"
    submitText="Enviar Mensaje" />',
                'default_config' => [
                    'title' => 'Contáctanos',
                    'description' => 'Ponte en contacto con nosotros',
                    'fields' => ['name', 'email', 'message'],
                    'action' => '/contact',
                    'submitText' => 'Enviar Mensaje',
                ],
                'is_active' => true,
            ],
        ];

        foreach ($components as $componentData) {
            Component::firstOrCreate(
                ['identifier' => $componentData['identifier']],
                $componentData
            );
        }

        $this->command->info("✓ " . count($components) . " componentes creados");
    }

    private function createTemplates()
    {
        $templates = [
            [
                'name' => 'Landing Page Básica',
                'description' => 'Template básico para landing page',
                'category' => 'landing',
                'content' => '<x-page-builder.container>
    <x-page-builder.hero 
        title="Bienvenido a nuestro sitio"
        subtitle="La mejor solución para tu negocio"
        buttonText="Comenzar ahora"
        buttonUrl="#contact" />
    
    <x-page-builder.grid columns="3" class="mt-16">
        <x-page-builder.card 
            title="Servicio 1"
            description="Descripción del primer servicio" />
        <x-page-builder.card 
            title="Servicio 2"
            description="Descripción del segundo servicio" />
        <x-page-builder.card 
            title="Servicio 3"
            description="Descripción del tercer servicio" />
    </x-page-builder.grid>
    
    <div id="contact" class="mt-16">
        <x-page-builder.contact-form />
    </div>
</x-page-builder.container>',
                'metadata' => [
                    'preview_url' => '',
                    'tags' => ['landing', 'business', 'contact'],
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Página Simple',
                'description' => 'Template simple con solo contenido',
                'category' => 'simple',
                'content' => '<x-page-builder.container>
    <x-page-builder.text-block 
        heading="Título de la página"
        content="Contenido de la página aquí..." />
</x-page-builder.container>',
                'metadata' => [
                    'tags' => ['simple', 'content'],
                ],
                'is_active' => true,
            ],
        ];

        foreach ($templates as $templateData) {
            Template::firstOrCreate(
                ['name' => $templateData['name']],
                $templateData
            );
        }

        $this->command->info("✓ " . count($templates) . " templates creados");
    }
}
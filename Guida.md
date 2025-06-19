# Crear archivo en:
resources/views/components/page-builder/mi-nuevo-componente.blade.php

{{-- Ejemplo: pricing-table.blade.php --}}
@props([
    'plans' => 3,
    'title' => 'Nuestros Planes',
    'currency' => '$'
])

<section {{ $attributes->merge(['class' => 'py-16']) }}>
    <div class="container mx-auto">
        <h2 class="text-3xl font-bold text-center mb-8">{{ $title }}</h2>
        <div class="grid grid-cols-{{ $plans }} gap-6">
            {{ $slot }}
        </div>
    </div>
</section>

Paso 2: Agregar a la base de datos

-- Via MoonShine > Componentes > Crear nuevo
-- O via seeder/tinker:

// php artisan tinker
Component::create([
    'name' => 'Tabla de Precios',
    'identifier' => 'pricing-table',
    'category' => 'content', // layout, content, interactive
    'description' => 'Tabla de precios responsive',
    'blade_template' => '<x-page-builder.pricing-table 
        title="Elige tu plan"
        plans="3"
        currency="$" />',
    'default_config' => [
        'title' => 'Elige tu plan',
        'plans' => 3,
        'currency' => '$'
    ],
    'is_active' => true,
]);


----------------------------------------------------------


TEMPLATES


📄 Agregar Nuevo Template
Via MoonShine:

Admin > Templates > Crear
Llenar campos:

Nombre: "Landing E-commerce"
Categoría: "ecommerce"
Contenido: Template Blade completo
Activo: ✅


Via código:


Template::create([
    'name' => 'Landing E-commerce',
    'description' => 'Template para tiendas online',
    'category' => 'ecommerce',
    'content' => '<x-page-builder.container>
        <x-page-builder.hero title="Tu Tienda Online" />
        <x-page-builder.pricing-table />
        <x-page-builder.contact-form />
    </x-page-builder.container>',
    'is_active' => true,
]);


-----------------------------------------

Agregar nueva categoría de componente:


// En ComponentResource.php y al crear componentes
->options([
    'layout' => 'Layout',
    'content' => 'Contenido',
    'interactive' => 'Interactivo',
    'ecommerce' => 'E-commerce', // ← NUEVA
    'marketing' => 'Marketing',  // ← NUEVA
])

En el JavaScript del editor (edit.blade.php):

categoryNames: {
    'layout': 'Layout',
    'content': 'Contenido', 
    'interactive': 'Interactivos',
    'ecommerce': 'E-commerce',    // ← NUEVA
    'marketing': 'Marketing',     // ← NUEVA
}


-------------------------------------------------

LISTA DE COMANDOS 

# Backup de todas las páginas
php artisan pagebuilder:backup --all

# Limpiar archivos temporales
php artisan pagebuilder:cleanup

# Optimizar páginas publicadas
php artisan pagebuilder:optimize

# Validar contenido de páginas
php artisan pagebuilder:validate

# Exportar página específica
php artisan pagebuilder:export 1 --format=html




---------------------------------------------


📊 Estructura de Datos Importante
Componente en BD:
json{
  "name": "Nombre visible",
  "identifier": "slug-unico", 
  "category": "content|layout|interactive",
  "blade_template": "<x-page-builder.componente />",
  "default_config": {"key": "value"},
  "is_active": true
}
Página en BD:
json{
  "content": "HTML Blade completo",
  "status": "draft|published",
  "website_id": 1,
  "template_id": 2
}


------------------------------------------------------------------


🚀 Flujo de Desarrollo Típico

💭 Idea nueva → "Necesito un componente de testimonios con carousel"
🎨 Crear Blade → testimonial-carousel.blade.php
💾 Agregar a BD → Via MoonShine o seeder
🧪 Probar → En el page builder
✅ Listo → Disponible para todos

🎯 Tips de Productividad

Usa seeders para componentes comunes que reutilizarás
Prefijos consistentes en identifiers: hero-, card-, form-
Categorías organizadas para fácil navegación
Default configs completos para mejor UX
Preview images para identificación visual rápida
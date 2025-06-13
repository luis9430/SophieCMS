<?php

// ===================================================================
// app/Services/PageRenderer.php
// ===================================================================

namespace App\Services;

use App\Models\Page;
use App\Models\Template;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class PageRenderer
{
    protected LiquidRenderer $liquidRenderer;
    protected PageBuilderRenderer $pageBuilderRenderer;

    public function __construct(
        LiquidRenderer $liquidRenderer,
        PageBuilderRenderer $pageBuilderRenderer
    ) {
        $this->liquidRenderer = $liquidRenderer;
        $this->pageBuilderRenderer = $pageBuilderRenderer;
    }

    /**
     * Renderizar página completa
     */
    public function render(Page $page): string
    {
        try {
            // 1. Verificar cache
            if (!$page->needs_regeneration && $page->rendered_content) {
                Log::info("Using cached content for page {$page->id}");
                return $page->rendered_content;
            }

            // 2. Renderizar contenido del Page Builder
            $pageBuilderHTML = $this->renderPageBuilderContent($page);

            // 3. Obtener templates asignados
            $templates = $this->getAssignedTemplates($page);

            // 4. Preparar variables globales
            $variables = $this->prepareVariables($page, $templates);

            // 5. Renderizar templates individuales
            $renderedTemplates = $this->renderTemplates($templates, $variables);

            // 6. Renderizar layout principal
            $finalHTML = $this->renderLayout($page, $pageBuilderHTML, $renderedTemplates, $variables);

            // 7. Guardar en cache
            $page->markAsRendered($finalHTML);

            Log::info("Page {$page->id} rendered successfully");
            return $finalHTML;

        } catch (\Exception $e) {
            Log::error("Error rendering page {$page->id}: " . $e->getMessage());
            return $this->renderErrorPage($e->getMessage());
        }
    }

    /**
     * Renderizar contenido del Page Builder
     */
    protected function renderPageBuilderContent(Page $page): string
    {
        if (empty($page->content) || !isset($page->content['blocks'])) {
            return '<div class="text-center py-8 text-gray-500">No hay contenido en esta página</div>';
        }

        return $this->pageBuilderRenderer->render($page->content);
    }

    /**
     * Obtener templates asignados a la página
     */
    protected function getAssignedTemplates(Page $page): array
    {
        $templates = [];

        // Layout principal
        if ($page->layout) {
            $templates['layout'] = $page->layout;
        }

        // Templates asignados (header, footer, etc.)
        if ($page->template_assignments) {
            foreach ($page->template_assignments as $type => $templateId) {
                if ($templateId) {
                    $template = Template::find($templateId);
                    if ($template) {
                        $templates[$type] = $template;
                    }
                }
            }
        }

        return $templates;
    }

    /**
     * Preparar variables para renderizado
     */
    protected function prepareVariables(Page $page, array $templates): array
    {
        $variables = [
            // Variables de la página
            'page' => [
                'id' => $page->id,
                'title' => $page->title,
                'slug' => $page->slug,
                'status' => $page->status,
                'language' => 'es',
                'meta_description' => $page->page_variables['meta_description'] ?? null,
                'created_at' => $page->created_at,
                'updated_at' => $page->updated_at,
            ],

            // Variables del sitio (pueden venir de configuración)
            'site' => [
                'name' => config('app.name', 'Mi Sitio Web'),
                'url' => config('app.url'),
                'description' => 'Sitio web creado con Page Builder',
                'logo_url' => null,
            ],

            // Variables de tiempo
            'current' => [
                'time' => now()->format('H:i:s'),
                'date' => now()->format('d/m/Y'),
                'year' => now()->format('Y'),
                'month' => now()->format('F'),
                'day' => now()->format('d'),
                'timestamp' => now()->timestamp,
            ],

            // Variables específicas de la página
            ...$page->page_variables ?? [],
        ];

        // Agregar variables de navegación si hay templates que las necesiten
        $variables['navigation'] = $this->getNavigationData();

        return $variables;
    }

    /**
     * Renderizar templates individuales
     */
    protected function renderTemplates(array $templates, array $variables): array
    {
        $rendered = [];

        foreach ($templates as $type => $template) {
            if ($type === 'layout') {
                continue; // El layout se renderiza al final
            }

            try {
                $rendered[$type] = $this->liquidRenderer->render(
                    $template->content,
                    $this->mergeTemplateVariables($template, $variables)
                );

                Log::debug("Template {$template->name} ({$type}) rendered successfully");
            } catch (\Exception $e) {
                Log::error("Error rendering template {$template->name}: " . $e->getMessage());
                $rendered[$type] = "<!-- Error rendering {$type} template -->";
            }
        }

        return $rendered;
    }

    /**
     * Renderizar layout principal
     */
    protected function renderLayout(Page $page, string $content, array $renderedTemplates, array $variables): string
    {
        // Si no hay layout, devolver solo el contenido
        if (!isset($renderedTemplates['layout']) && !$page->layout) {
            return $this->wrapContentInBasicHTML($content, $variables);
        }

        $layout = $page->layout;
        
        // Preparar variables del layout
        $layoutVariables = array_merge($variables, [
            'content' => $content,
            'header_template' => $renderedTemplates['header'] ?? null,
            'footer_template' => $renderedTemplates['footer'] ?? null,
            'sidebar_template' => $renderedTemplates['sidebar'] ?? null,
            'nav_template' => $renderedTemplates['nav'] ?? null,
        ]);

        return $this->liquidRenderer->render(
            $layout->content,
            $this->mergeTemplateVariables($layout, $layoutVariables)
        );
    }

    /**
     * Combinar variables del template con variables globales
     */
    protected function mergeTemplateVariables(Template $template, array $globalVariables): array
    {
        $templateVars = $template->variables ?? [];
        $merged = $globalVariables;

        // Aplicar valores por defecto del template
        if (isset($templateVars['optional'])) {
            foreach ($templateVars['optional'] as $key => $config) {
                if (is_array($config) && isset($config['default']) && !isset($merged[$key])) {
                    $merged[$key] = $config['default'];
                }
            }
        }

        return $merged;
    }

    /**
     * Obtener datos de navegación
     */
    protected function getNavigationData(): array
    {
        return [
            // Menú principal por defecto
            [
                'title' => 'Inicio',
                'url' => '/',
                'active' => request()->is('/')
            ],
            [
                'title' => 'Acerca',
                'url' => '/about',
                'active' => request()->is('about')
            ],
            [
                'title' => 'Contacto',
                'url' => '/contact',
                'active' => request()->is('contact')
            ],
        ];
    }

    /**
     * Envolver contenido en HTML básico si no hay layout
     */
    protected function wrapContentInBasicHTML(string $content, array $variables): string
    {
        return "<!DOCTYPE html>
<html lang=\"{$variables['page']['language']}\">
<head>
    <meta charset=\"UTF-8\">
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
    <title>{$variables['page']['title']}</title>
    <script src=\"https://cdn.tailwindcss.com\"></script>
    <script defer src=\"https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js\"></script>
</head>
<body class=\"bg-white\">
    <main class=\"container mx-auto px-4 py-8\">
        {$content}
    </main>
</body>
</html>";
    }

    /**
     * Renderizar página de error
     */
    protected function renderErrorPage(string $error): string
    {
        return "<!DOCTYPE html>
<html>
<head>
    <title>Error de Renderizado</title>
    <style>
        body { font-family: system-ui, sans-serif; padding: 2rem; background: #fef2f2; }
        .error { background: white; padding: 2rem; border-radius: 8px; border: 1px solid #fecaca; }
        .error h1 { color: #dc2626; margin: 0 0 1rem 0; }
        .error p { color: #374151; margin: 0; }
    </style>
</head>
<body>
    <div class=\"error\">
        <h1>⚠️ Error de Renderizado</h1>
        <p>No se pudo renderizar esta página correctamente.</p>
        <details style=\"margin-top: 1rem;\">
            <summary>Detalles del error</summary>
            <pre style=\"background: #f3f4f6; padding: 1rem; border-radius: 4px; margin-top: 0.5rem; overflow-x: auto;\">" . htmlspecialchars($error) . "</pre>
        </details>
    </div>
</body>
</html>";
    }
}


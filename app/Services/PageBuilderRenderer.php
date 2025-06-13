<?php
// ===================================================================
// app/Services/PageBuilderRenderer.php
// ===================================================================

namespace App\Services;

class PageBuilderRenderer
{
    protected array $blockRenderers = [];

    public function __construct()
    {
        $this->registerDefaultBlockRenderers();
    }

    /**
     * Renderizar contenido del Page Builder
     */
    public function render(array $content): string
    {
        if (!isset($content['blocks']) || !is_array($content['blocks'])) {
            return '<div class="text-center py-8 text-gray-500">No hay bloques para mostrar</div>';
        }

        $html = '';
        foreach ($content['blocks'] as $block) {
            $html .= $this->renderBlock($block);
        }

        return $html;
    }

    /**
     * Renderizar bloque individual
     */
    protected function renderBlock(array $block): string
    {
        $type = $block['type'] ?? 'unknown';
        
        if (!isset($this->blockRenderers[$type])) {
            return "<!-- Unknown block type: {$type} -->";
        }

        try {
            return $this->blockRenderers[$type]($block);
        } catch (\Exception $e) {
            return "<!-- Error rendering block {$type}: {$e->getMessage()} -->";
        }
    }

    /**
     * Registrar renderizadores por defecto
     */
    protected function registerDefaultBlockRenderers(): void
    {
        // Hero block
        $this->blockRenderers['hero'] = function (array $block) {
            $settings = $block['settings'] ?? [];
            $title = $settings['title'] ?? 'Título Hero';
            $subtitle = $settings['subtitle'] ?? '';
            $bgImage = $settings['background_image'] ?? '';
            $bgClass = $settings['background'] ?? 'bg-blue-600';

            $bgStyle = $bgImage ? "background-image: url('{$bgImage}'); background-size: cover; background-position: center;" : '';

            return "<section class=\"hero {$bgClass} text-white py-20\" style=\"{$bgStyle}\">
                <div class=\"max-w-4xl mx-auto text-center px-4\">
                    <h1 class=\"text-4xl md:text-6xl font-bold mb-6\">{$title}</h1>
                    " . ($subtitle ? "<p class=\"text-xl mb-8\">{$subtitle}</p>" : '') . "
                </div>
            </section>";
        };

        // Text block
        $this->blockRenderers['text'] = function (array $block) {
            $content = $block['content'] ?? $block['settings']['content'] ?? '<p>Contenido de texto</p>';
            return "<div class=\"prose max-w-none py-8\">{$content}</div>";
        };

        // Features block
        $this->blockRenderers['features'] = function (array $block) {
            $settings = $block['settings'] ?? [];
            $title = $settings['title'] ?? 'Características';
            $items = $settings['items'] ?? [];
            $columns = $settings['columns'] ?? 3;

            $html = "<section class=\"py-16 bg-gray-50\">
                <div class=\"max-w-7xl mx-auto px-4\">
                    <h2 class=\"text-3xl font-bold text-center mb-12\">{$title}</h2>
                    <div class=\"grid grid-cols-1 md:grid-cols-{$columns} gap-8\">";

            foreach ($items as $item) {
                $icon = $item['icon'] ?? '⭐';
                $itemTitle = $item['title'] ?? 'Característica';
                $description = $item['description'] ?? 'Descripción de la característica';

                $html .= "<div class=\"text-center p-6 bg-white rounded-lg shadow-sm\">
                    <div class=\"text-4xl mb-4\">{$icon}</div>
                    <h3 class=\"text-xl font-semibold mb-2\">{$itemTitle}</h3>
                    <p class=\"text-gray-600\">{$description}</p>
                </div>";
            }

            $html .= "</div></div></section>";
            return $html;
        };

        // CTA block
        $this->blockRenderers['cta'] = function (array $block) {
            $settings = $block['settings'] ?? [];
            $title = $settings['title'] ?? 'Llamada a la acción';
            $description = $settings['description'] ?? '';
            $buttonText = $settings['button_text'] ?? 'Actuar ahora';
            $buttonUrl = $settings['button_url'] ?? '#';

            return "<section class=\"bg-blue-600 text-white py-16\">
                <div class=\"max-w-4xl mx-auto text-center px-4\">
                    <h2 class=\"text-3xl font-bold mb-4\">{$title}</h2>
                    " . ($description ? "<p class=\"text-xl mb-8\">{$description}</p>" : '') . "
                    <a href=\"{$buttonUrl}\" class=\"inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors\">
                        {$buttonText}
                    </a>
                </div>
            </section>";
        };
    }

    /**
     * Registrar renderizador personalizado
     */
    public function registerBlockRenderer(string $type, callable $renderer): void
    {
        $this->blockRenderers[$type] = $renderer;
    }
}
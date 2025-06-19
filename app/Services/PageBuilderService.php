<?php
// app/Services/PageBuilderService.php
namespace App\Services;

use App\Models\Component;
use App\Models\Page;
use App\Models\Template;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class PageBuilderService
{
    /**
     * Obtener todos los componentes activos agrupados por categoría
     */
    public function getComponents()
    {
        return Component::where('is_active', true)
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->groupBy('category');
    }

    /**
     * Renderizar un componente por su ID
     */
    public function renderComponent($componentId, $config = [])
    {
        $component = Component::find($componentId);
        
        if (!$component) {
            return '<div class="text-red-500">Componente no encontrado</div>';
        }

        return $this->renderComponentTemplate($component, $config);
    }

    /**
     * Renderizar el template de un componente
     */
    public function renderComponentTemplate(Component $component, $config = [])
    {
        try {
            // Combinar configuración por defecto con la proporcionada
            $finalConfig = array_merge($component->default_config ?? [], $config);
            
            // Crear archivo temporal
            $tempFile = storage_path('app/temp_component_' . $component->id . '_' . uniqid() . '.blade.php');
            File::put($tempFile, $component->blade_template);

            // Renderizar
            $html = View::file($tempFile, $finalConfig)->render();
            
            // Limpiar archivo temporal
            File::delete($tempFile);
            
            return $html;

        } catch (\Exception $e) {
            if (isset($tempFile) && File::exists($tempFile)) {
                File::delete($tempFile);
            }
            
            return '<div class="text-red-500">Error al renderizar componente: ' . $e->getMessage() . '</div>';
        }
    }

    /**
     * Procesar y renderizar el contenido de una página
     */
    public function processPageContent($content, $pageData = [])
    {
        try {
            // Crear archivo temporal
            $tempFile = storage_path('app/temp_page_content_' . uniqid() . '.blade.php');
            File::put($tempFile, $content);

            // Renderizar con datos de la página
            $html = View::file($tempFile, $pageData)->render();
            
            // Limpiar archivo temporal
            File::delete($tempFile);
            
            return $html;

        } catch (\Exception $e) {
            if (isset($tempFile) && File::exists($tempFile)) {
                File::delete($tempFile);
            }
            
            throw $e;
        }
    }

    /**
     * Generar CSS para el page builder
     */
    public function getStyles()
    {
        $styles = [
            '/* Page Builder Styles */',
            '.page-builder-component { transition: all 0.3s ease; }',
            '.page-builder-component:hover { outline: 2px dashed #3b82f6; outline-offset: 2px; }',
            '.page-builder-editing .page-builder-component { cursor: pointer; }',
        ];

        return '<style>' . implode("\n", $styles) . '</style>';
    }

    /**
     * Generar JavaScript para el page builder
     */
    public function getScripts()
    {
        $scripts = [
            '/* Page Builder Scripts */',
            'window.PageBuilder = window.PageBuilder || {};',
            'PageBuilder.components = ' . json_encode($this->getComponents()->toArray()) . ';',
        ];

        return '<script>' . implode("\n", $scripts) . '</script>';
    }

    /**
     * Validar contenido de página
     */
    public function validatePageContent($content)
    {
        // Verificar que el contenido sea HTML válido
        $dom = new \DOMDocument();
        $previousUseInternalErrors = libxml_use_internal_errors(true);
        
        $isValid = $dom->loadHTML('<!DOCTYPE html><html><body>' . $content . '</body></html>');
        
        $errors = libxml_get_errors();
        libxml_use_internal_errors($previousUseInternalErrors);
        libxml_clear_errors();

        return [
            'valid' => $isValid && empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Optimizar contenido de página para producción
     */
    public function optimizePageContent($content)
    {
        // Minificar HTML
        $content = preg_replace('/\s+/', ' ', $content);
        $content = preg_replace('/>\s+</', '><', $content);
        
        // Remover comentarios HTML
        $content = preg_replace('/<!--.*?-->/', '', $content);
        
        return trim($content);
    }

    /**
     * Exportar página como HTML estático
     */
    public function exportPageAsHtml(Page $page, $includeAssets = true)
    {
        $content = $this->processPageContent($page->content, [
            'page' => $page,
            'website' => $page->website,
        ]);

        if ($includeAssets) {
            // Incluir CSS y JS inline para que el HTML sea completamente independiente
            $content = $this->inlineAssets($content);
        }

        return $content;
    }

    /**
     * Incluir assets inline en el HTML
     */
    private function inlineAssets($html)
    {
        // Incluir Tailwind CSS
        $tailwindCss = file_get_contents('https://cdn.tailwindcss.com');
        $html = str_replace(
            '<script src="https://cdn.tailwindcss.com"></script>',
            '<style>' . $tailwindCss . '</style>',
            $html
        );

        // Incluir Alpine.js
        $alpineJs = file_get_contents('https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js');
        $html = str_replace(
            '<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>',
            '<script>' . $alpineJs . '</script>',
            $html
        );

        return $html;
    }

    /**
     * Crear backup de una página
     */
    public function backupPage(Page $page)
    {
        $backupData = [
            'id' => $page->id,
            'title' => $page->title,
            'slug' => $page->slug,
            'content' => $page->content,
            'meta_title' => $page->meta_title,
            'meta_description' => $page->meta_description,
            'status' => $page->status,
            'website_id' => $page->website_id,
            'template_id' => $page->template_id,
            'created_at' => $page->created_at,
            'updated_at' => $page->updated_at,
            'backup_created_at' => now(),
        ];

        $filename = 'page_backup_' . $page->id . '_' . now()->format('Y-m-d_H-i-s') . '.json';
        $backupPath = storage_path('app/backups/pages/' . $filename);
        
        // Crear directorio si no existe
        if (!File::exists(dirname($backupPath))) {
            File::makeDirectory(dirname($backupPath), 0755, true);
        }

        File::put($backupPath, json_encode($backupData, JSON_PRETTY_PRINT));

        return $backupPath;
    }

    /**
     * Restaurar página desde backup
     */
    public function restorePageFromBackup($backupPath)
    {
        if (!File::exists($backupPath)) {
            throw new \Exception('Archivo de backup no encontrado');
        }

        $backupData = json_decode(File::get($backupPath), true);
        
        if (!$backupData) {
            throw new \Exception('Archivo de backup corrupto');
        }

        $page = Page::find($backupData['id']);
        
        if (!$page) {
            throw new \Exception('Página no encontrada');
        }

        // Crear backup actual antes de restaurar
        $this->backupPage($page);

        // Restaurar datos
        $page->update([
            'title' => $backupData['title'],
            'slug' => $backupData['slug'],
            'content' => $backupData['content'],
            'meta_title' => $backupData['meta_title'],
            'meta_description' => $backupData['meta_description'],
            'status' => $backupData['status'],
        ]);

        return $page;
    }
}
<?php
// app/Console/Commands/PageBuilderExport.php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Page;
use App\Services\PageBuilderService;

class PageBuilderExport extends Command
{
    protected $signature = 'pagebuilder:export {page} {--format=html : Formato de exportación} {--output= : Directorio de salida}';
    protected $description = 'Exportar página del Page Builder';

    public function handle()
    {
        $pageId = $this->argument('page');
        $format = $this->option('format');
        $output = $this->option('output') ?: storage_path('app/exports');

        $page = Page::find($pageId);
        
        if (!$page) {
            $this->error("Página con ID {$pageId} no encontrada");
            return 1;
        }

        $pageBuilderService = app('page-builder');

        try {
            switch ($format) {
                case 'html':
                    $content = $pageBuilderService->exportPageAsHtml($page, true);
                    $filename = "page_{$page->id}_{$page->slug}.html";
                    break;
                    
                default:
                    $this->error("Formato {$format} no soportado");
                    return 1;
            }

            // Crear directorio si no existe
            if (!is_dir($output)) {
                mkdir($output, 0755, true);
            }

            $filePath = $output . '/' . $filename;
            file_put_contents($filePath, $content);

            $this->info("✓ Página exportada: {$filePath}");
            
        } catch (\Exception $e) {
            $this->error("Error al exportar: " . $e->getMessage());
            return 1;
        }
    }
}
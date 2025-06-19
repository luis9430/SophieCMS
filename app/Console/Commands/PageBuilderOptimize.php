<?php
// app/Console/Commands/PageBuilderOptimize.php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Page;
use App\Services\PageBuilderService;

class PageBuilderOptimize extends Command
{
    protected $signature = 'pagebuilder:optimize {--pages= : IDs de páginas separados por coma}';
    protected $description = 'Optimizar contenido de páginas para producción';

    public function handle()
    {
        $pageBuilderService = app('page-builder');
        
        if ($pageIds = $this->option('pages')) {
            $pageIds = explode(',', $pageIds);
            $pages = Page::whereIn('id', $pageIds)->get();
        } else {
            $pages = Page::where('status', 'published')->get();
        }

        if ($pages->isEmpty()) {
            $this->info('No hay páginas para optimizar');
            return;
        }

        $this->info("Optimizando {$pages->count()} páginas...");

        foreach ($pages as $page) {
            try {
                $originalSize = strlen($page->content);
                $optimizedContent = $pageBuilderService->optimizePageContent($page->content);
                $optimizedSize = strlen($optimizedContent);
                $savings = $originalSize - $optimizedSize;
                $percentage = round(($savings / $originalSize) * 100, 2);

                $page->update(['content' => $optimizedContent]);

                $this->line("✓ {$page->title}: {$savings} bytes ahorrados ({$percentage}%)");
                
            } catch (\Exception $e) {
                $this->error("✗ Error optimizando {$page->title}: " . $e->getMessage());
            }
        }

        $this->info('Optimización completada!');
    }
}

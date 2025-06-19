<?php
// app/Console/Commands/PageBuilderBackup.php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Page;
use App\Services\PageBuilderService;

class PageBuilderBackup extends Command
{
    protected $signature = 'pagebuilder:backup {--page= : ID de la página específica} {--all : Backup de todas las páginas}';
    protected $description = 'Crear backup de páginas del Page Builder';

    public function handle()
    {
        $pageBuilderService = app('page-builder');

        if ($this->option('all')) {
            $pages = Page::all();
            $this->info("Creando backup de {$pages->count()} páginas...");

            foreach ($pages as $page) {
                $backupPath = $pageBuilderService->backupPage($page);
                $this->line("✓ Backup creado: {$page->title} -> " . basename($backupPath));
            }

        } elseif ($pageId = $this->option('page')) {
            $page = Page::find($pageId);
            
            if (!$page) {
                $this->error("Página con ID {$pageId} no encontrada");
                return 1;
            }

            $backupPath = $pageBuilderService->backupPage($page);
            $this->info("✓ Backup creado: {$page->title} -> " . basename($backupPath));

        } else {
            $this->error('Especifica --all para todas las páginas o --page=ID para una página específica');
            return 1;
        }

        $this->info('Backup completado!');
    }
}
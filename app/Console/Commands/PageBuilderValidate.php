<?php

// app/Console/Commands/PageBuilderValidate.php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Page;
use App\Services\PageBuilderService;

class PageBuilderValidate extends Command
{
    protected $signature = 'pagebuilder:validate {--page= : ID de página específica}';
    protected $description = 'Validar contenido de páginas del Page Builder';

    public function handle()
    {
        $pageBuilderService = app('page-builder');
        
        if ($pageId = $this->option('page')) {
            $pages = Page::where('id', $pageId)->get();
        } else {
            $pages = Page::all();
        }

        if ($pages->isEmpty()) {
            $this->info('No hay páginas para validar');
            return;
        }

        $this->info("Validando {$pages->count()} páginas...");

        $validPages = 0;
        $invalidPages = 0;

        foreach ($pages as $page) {
            $validation = $pageBuilderService->validatePageContent($page->content);
            
            if ($validation['valid']) {
                $this->line("✓ {$page->title}: Válida");
                $validPages++;
            } else {
                $this->line("✗ {$page->title}: Errores encontrados");
                foreach ($validation['errors'] as $error) {
                    $this->line("  - {$error->message} (Línea: {$error->line})");
                }
                $invalidPages++;
            }
        }

        $this->info("Validación completada: {$validPages} válidas, {$invalidPages} con errores");
        
        return $invalidPages > 0 ? 1 : 0;
    }
}
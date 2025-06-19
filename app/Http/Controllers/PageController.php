<?php
// ===================================================================
// app/Http/Controllers/PageController.php
// ===================================================================

namespace App\Http\Controllers;

use App\Models\Page;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\File;

class PageController extends Controller
{
    /**
     * Mostrar una página pública
     */
    public function show(Page $page)
    {
        // Solo mostrar páginas publicadas
        if ($page->status !== 'published') {
            abort(404);
        }

        // Renderizar el contenido de la página
        $renderedContent = $this->renderPageContent($page);
        
        return view('pages.show', [
            'page' => $page,
            'content' => $renderedContent,
            'website' => $page->website,
        ]);
    }

    /**
     * Renderizar el contenido de una página
     */
    private function renderPageContent(Page $page)
    {
        if (empty($page->content)) {
            return '<div class="container mx-auto p-8"><p>Esta página no tiene contenido.</p></div>';
        }

        try {
            // Crear archivo temporal con el contenido
            $tempFile = storage_path('app/temp_page_' . $page->id . '_' . uniqid() . '.blade.php');
            File::put($tempFile, $page->content);

            // Renderizar con datos de la página
            $html = View::file($tempFile, [
                'page' => $page,
                'website' => $page->website,
            ])->render();

            // Limpiar archivo temporal
            File::delete($tempFile);

            return $html;

        } catch (\Exception $e) {
            // Limpiar archivo temporal en caso de error
            if (isset($tempFile) && File::exists($tempFile)) {
                File::delete($tempFile);
            }

            // En producción, mostrar mensaje genérico
            if (app()->environment('production')) {
                return '<div class="container mx-auto p-8"><p>Error al cargar el contenido de la página.</p></div>';
            }

            // En desarrollo, mostrar el error
            return '<div class="container mx-auto p-8"><div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"><strong>Error:</strong> ' . $e->getMessage() . '</div></div>';
        }
    }
}

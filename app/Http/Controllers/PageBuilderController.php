<?php

// app/Http/Controllers/PageBuilderController.php
namespace App\Http\Controllers;

use App\Models\Page;
use App\Models\Component;
use App\Models\Template;
use App\Models\Website;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class PageBuilderController extends Controller
{
    /**
     * Mostrar el editor principal del page builder
     */
    public function index()
    {
        $websites = Website::all();
        $templates = Template::where('is_active', true)->get();
        
        return view('page-builder.index', compact('websites', 'templates'));
    }

    /**
     * Editar una página específica
     */
    public function edit(Page $page)
    {
        $components = Component::where('is_active', true)
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->groupBy('category');
            
        $templates = Template::where('is_active', true)->get();
        
        return view('page-builder.edit', compact('page', 'components', 'templates'));
    }

    /**
     * Crear nueva página y redirigir al editor
     */
    public function create(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'website_id' => 'required|exists:websites,id',
            'template_id' => 'nullable|exists:templates,id',
        ]);

        $page = Page::create([
            'title' => $request->title,
            'slug' => Str::slug($request->title),
            'website_id' => $request->website_id,
            'template_id' => $request->template_id,
            'status' => 'draft',
            'content' => $this->getInitialContent($request->template_id),
        ]);

        return redirect()->route('page-builder.edit', $page);
    }


    public function update(Request $request, Page $page)
    {
        $request->validate([
            'content' => 'required|string',
            'title' => 'sometimes|string|max:255',
            'status' => 'sometimes|in:draft,published',
        ]);

        $updateData = ['content' => $request->content];
        
        if ($request->has('title')) {
            $updateData['title'] = $request->title;
            $updateData['slug'] = Str::slug($request->title);
        }
        
        if ($request->has('status')) {
            $updateData['status'] = $request->status;
        }

        $page->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Página actualizada correctamente',
            'page' => $page->fresh()
        ]);
    }

    /**
     * Guardar el contenido de la página
     */
    public function save(Request $request, Page $page)
    {
        $request->validate([
            'content' => 'required|string',
            'title' => 'sometimes|string|max:255',
        ]);

        $updateData = ['content' => $request->content];
        
        if ($request->has('title')) {
            $updateData['title'] = $request->title;
            $updateData['slug'] = Str::slug($request->title);
        }

        $page->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Página guardada correctamente',
            'page' => $page->fresh()
        ]);
    }

    /**
     * Generar preview del contenido
     */
    public function preview(Request $request)
    {
        try {
            $content = $request->input('content', '');
            $pageId = $request->input('page_id');
            
            // Validar que el contenido no esté completamente vacío
            if (empty(trim($content))) {
                return response()->json([
                    'success' => true,
                    'html' => '<div class="p-8 text-center text-gray-500">El contenido está vacío</div>'
                ]);
            }

            // Preparar datos de la página
            $pageData = [
                'page' => null,
                'website' => null,
            ];

            if ($pageId) {
                $page = Page::find($pageId);
                if ($page) {
                    $pageData = [
                        'page' => $page,
                        'website' => $page->website,
                    ];
                }
            }

            // Renderizar contenido de forma segura
            $html = $this->renderPageContentSafely($content, $pageData);
            
            return response()->json([
                'success' => true,
                'html' => $html
            ]);
            
        } catch (\ParseError $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error de sintaxis en el contenido: ' . $e->getMessage(),
                'type' => 'syntax_error'
            ]);
            
        } catch (\Throwable $e) {
            // Log del error para debugging
            \Log::error('Preview error', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'content_preview' => substr($request->input('content', ''), 0, 200)
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Error al procesar el contenido: ' . $e->getMessage(),
                'type' => 'processing_error'
            ]);
        }
    }


    private function renderPageContentSafely(string $content, array $data = [])
    {
        // Limpiar y validar el contenido
        $cleanContent = $this->sanitizeContent($content);
        
        // Crear archivo temporal con nombre único
        $tempFile = storage_path('app/temp_' . uniqid() . '_' . time() . '.blade.php');
        
        // Asegurar que el directorio temp existe
        $tempDir = dirname($tempFile);
        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }
        
        // Preparar el contenido con el layout base
        $wrappedContent = $this->wrapContentWithLayoutSafely($cleanContent);
        
        try {
            File::put($tempFile, $wrappedContent);
            
            // Renderizar con timeout
            $html = View::file($tempFile, $data)->render();
            
            return $html;
            
        } catch (\Exception $e) {
            throw new \Exception('Error al renderizar la vista: ' . $e->getMessage());
        } finally {
            // Limpiar archivo temporal
            if (File::exists($tempFile)) {
                File::delete($tempFile);
            }
        }
    }

    private function sanitizeContent(string $content): string
        {
            // Remover caracteres problemáticos
            $content = trim($content);
            
            // Validar que no tenga PHP tags maliciosos
            if (strpos($content, '<?php') !== false || strpos($content, '<?=') !== false) {
                throw new \Exception('No se permite código PHP en el contenido');
            }
            
            return $content;
        }


        private function wrapContentWithLayoutSafely(string $content)
        {
            return '<!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Preview</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
            <style>
                /* Estilos para el preview */
                body { font-family: system-ui, -apple-system, sans-serif; }
                .preview-container { min-height: 100vh; }
            </style>
        </head>
        <body class="preview-container">
            <div class="w-full">
                ' . $content . '
            </div>
        </body>
        </html>';
        }


    /**
     * Obtener componentes disponibles para el sidebar
     */
    public function getComponents()
    {
        $components = Component::where('is_active', true)
            ->select('id', 'name', 'identifier', 'category', 'description', 'default_config', 'preview_image')
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->groupBy('category');

        return response()->json($components);
    }

    /**
     * Obtener template de un componente específico
     */
    public function getComponentTemplate(Component $component)
    {
        return response()->json([
            'template' => $component->blade_template,
            'default_config' => $component->default_config,
            'identifier' => $component->identifier,
        ]);
    }

    /**
     * Publicar una página
     */
    public function publish(Page $page)
    {
        $page->update([
            'status' => 'published',
            'published_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Página publicada correctamente'
        ]);
    }

    /**
     * Despublicar una página
     */
    public function unpublish(Page $page)
    {
        $page->update([
            'status' => 'draft',
            'published_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Página despublicada correctamente'
        ]);
    }

    /**
     * Duplicar una página
     */
    public function duplicate(Page $page)
    {
        $newPage = $page->replicate();
        $newPage->title = $page->title . ' (Copia)';
        $newPage->slug = Str::slug($newPage->title);
        $newPage->status = 'draft';
        $newPage->published_at = null;
        $newPage->save();

        return response()->json([
            'success' => true,
            'message' => 'Página duplicada correctamente',
            'new_page' => $newPage
        ]);
    }

    /**
     * Exportar página como HTML estático
     */
    public function export(Page $page)
    {
        try {
            $html = $this->renderPageContent($page->content, [
                'page' => $page,
                'website' => $page->website,
            ]);

            $filename = Str::slug($page->title) . '.html';
            
            return response($html)
                ->header('Content-Type', 'text/html')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
                
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error al exportar: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Renderizar contenido de página
     */
    private function renderPageContent(string $content, array $data = [])
    {
        // Crear archivo temporal para renderizar
        $tempFile = storage_path('app/temp_' . uniqid() . '.blade.php');
        
        // Preparar el contenido con el layout base
        $wrappedContent = $this->wrapContentWithLayout($content);
        
        File::put($tempFile, $wrappedContent);
        
        try {
            $html = View::file($tempFile, $data)->render();
            File::delete($tempFile);
            return $html;
        } catch (\Exception $e) {
            if (File::exists($tempFile)) {
                File::delete($tempFile);
            }
            throw $e;
        }
    }

    /**
     * Envolver contenido con layout básico
     */
    private function wrapContentWithLayout(string $content)
    {
        return '<!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Preview</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
            </head>
            <body>
                ' . $content . '
            </body>
            </html>';
    }

    /**
     * Obtener contenido inicial basado en template
     */
    private function getInitialContent($templateId = null)
    {
        if ($templateId) {
            $template = Template::find($templateId);
            if ($template) {
                return $template->content;
            }
        }

                // Contenido por defecto
                return '<div class="container mx-auto p-8">
            <h1 class="text-3xl font-bold text-center mb-8">Página Nueva</h1>
            <p class="text-center text-gray-600">Comienza a agregar componentes desde el sidebar</p>
        </div>';
    }
}
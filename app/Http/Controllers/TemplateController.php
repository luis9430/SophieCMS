<?php

// ===================================================================
// app/Http/Controllers/TemplateController.php
// ===================================================================

namespace App\Http\Controllers;

use App\Models\Template;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class TemplateController extends Controller
{
    /**
     * Listar templates disponibles para el usuario
     */
    public function index(Request $request): JsonResponse
    {
        $query = Template::availableForUser(auth()->id());

        // Filtros opcionales
        if ($request->filled('type')) {
            $query->ofType($request->type);
        }

        if ($request->filled('category')) {
            $query->inCategory($request->category);
        }

        if ($request->filled('search')) {
            $query->where('name', 'LIKE', '%' . $request->search . '%');
        }

        $templates = $query->orderBy('is_global', 'desc')
                          ->orderBy('name')
                          ->get();

        return response()->json([
            'success' => true,
            'data' => $templates->map(function ($template) {
                return [
                    'id' => $template->id,
                    'name' => $template->name,
                    'type' => $template->type,
                    'content' => $template->content,
                    'type_name' => $template->type_name,
                    'category' => $template->category,
                    'category_name' => $template->category_name,
                    'description' => $template->description,
                    'is_global' => $template->is_global,
                    'variables' => $template->variables,
                    'created_at' => $template->created_at,
                    'updated_at' => $template->updated_at,
                ];
            })
        ]);
    }

    /**
     * Obtener templates por tipo
     */
    public function byType(string $type): JsonResponse
    {
        $templates = Template::availableForUser(auth()->id())
                           ->ofType($type)
                           ->orderBy('is_global', 'desc')
                           ->orderBy('name')
                           ->get(['id', 'name', 'description', 'is_global', 'variables']);

        return response()->json([
            'success' => true,
            'data' => $templates
        ]);
    }

    /**
     * Obtener un template específico
     */
    public function show(Template $template): JsonResponse
    {
        // Verificar que el usuario puede ver este template
        if (!$template->canBeUsedByUser(auth()->id())) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para ver este template'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $template->id,
                'name' => $template->name,
                'type' => $template->type,
                'content' => $template->content,
                'variables' => $template->variables,
                'description' => $template->description,
                'category' => $template->category,
                'is_global' => $template->is_global,
                'is_active' => $template->is_active,
                'created_at' => $template->created_at,
                'updated_at' => $template->updated_at,
            ]
        ]);
    }

    /**
     * Crear nuevo template
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => ['required', Rule::in(array_keys(Template::TYPES))],
            'content' => 'required|string',
            'description' => 'nullable|string',
            'category' => ['nullable', Rule::in(array_keys(Template::CATEGORIES))],
            'variables' => 'nullable|array',
        ]);

        $template = Template::create([
            ...$validated,
            'user_id' => auth()->id(),
            'is_global' => false, // Los usuarios no pueden crear templates globales
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Template creado exitosamente',
            'data' => $template
        ], 201);
    }

    /**
     * Actualizar template
     */
    public function update(Request $request, Template $template): JsonResponse
    {
        // Solo el propietario o admin puede editar
        if ($template->user_id !== auth()->id() && !auth()->user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para editar este template'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|required|string',
            'description' => 'nullable|string',
            'category' => ['nullable', Rule::in(array_keys(Template::CATEGORIES))],
            'variables' => 'nullable|array',
            'is_active' => 'sometimes|boolean',
        ]);

        $template->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Template actualizado exitosamente',
            'data' => $template
        ]);
    }

    /**
     * Eliminar template
     */
    public function destroy(Template $template): JsonResponse
    {
        // Solo el propietario puede eliminar (templates globales no se pueden eliminar)
        if ($template->user_id !== auth()->id() || $template->is_global) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para eliminar este template'
            ], 403);
        }

        // Verificar que no esté siendo usado
        if ($template->isInUse()) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar un template que está siendo usado'
            ], 400);
        }

        $template->delete();

        return response()->json([
            'success' => true,
            'message' => 'Template eliminado exitosamente'
        ]);
    }

    /**
     * Clonar template global para el usuario
     */
    public function clone(Template $template): JsonResponse
    {
        if (!$template->is_global) {
            return response()->json([
                'success' => false,
                'message' => 'Solo se pueden clonar templates globales'
            ], 400);
        }

        $cloned = $template->cloneForUser(auth()->id());

        return response()->json([
            'success' => true,
            'message' => 'Template clonado exitosamente',
            'data' => $cloned
        ]);
    }

    /**
     * Obtener tipos y categorías disponibles
     */
    public function metadata(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'types' => Template::TYPES,
                'categories' => Template::CATEGORIES,
            ]
        ]);
    }
}

// ===================================================================
// app/Http/Controllers/PageController.php
// ===================================================================

namespace App\Http\Controllers;

use App\Models\Page;
use App\Models\Template;
use App\Services\PageRenderer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class PageController extends Controller
{
    protected PageRenderer $pageRenderer;

    public function __construct(PageRenderer $pageRenderer)
    {
        $this->pageRenderer = $pageRenderer;
    }

    /**
     * Listar páginas del usuario
     */
    public function index(Request $request): JsonResponse
    {
        $query = Page::query();

        // Filtros opcionales
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'LIKE', '%' . $request->search . '%')
                  ->orWhere('slug', 'LIKE', '%' . $request->search . '%');
            });
        }

        $pages = $query->with('layout')
                      ->orderBy('updated_at', 'desc')
                      ->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $pages->items(),
            'pagination' => [
                'current_page' => $pages->currentPage(),
                'last_page' => $pages->lastPage(),
                'per_page' => $pages->perPage(),
                'total' => $pages->total(),
            ]
        ]);
    }

    /**
     * Obtener página específica
     */
    public function show(Page $page): JsonResponse
    {
        $page->load('layout');

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $page->id,
                'title' => $page->title,
                'slug' => $page->slug,
                'content' => $page->content,
                'layout' => $page->layout ? [
                    'id' => $page->layout->id,
                    'name' => $page->layout->name,
                    'type' => $page->layout->type,
                ] : null,
                'template_assignments' => $page->template_assignments,
                'page_variables' => $page->page_variables,
                'status' => $page->status,
                'status_name' => $page->status_name,
                'needs_regeneration' => $page->needs_regeneration,
                'created_at' => $page->created_at,
                'updated_at' => $page->updated_at,
            ]
        ]);
    }

    /**
     * Crear nueva página
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:pages,slug',
            'content' => 'required|array',
            'layout_id' => 'nullable|exists:templates,id',
            'template_assignments' => 'nullable|array',
            'page_variables' => 'nullable|array',
            'status' => ['nullable', Rule::in(array_keys(Page::STATUSES))],
        ]);

        // Verificar que el layout es del tipo correcto
        if (isset($validated['layout_id'])) {
            $layout = Template::find($validated['layout_id']);
            if ($layout->type !== 'layout') {
                return response()->json([
                    'success' => false,
                    'message' => 'El template seleccionado no es un layout'
                ], 400);
            }
        }

        $page = Page::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Página creada exitosamente',
            'data' => $page
        ], 201);
    }

    /**
     * Actualizar página
     */
    public function update(Request $request, Page $page): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'slug' => 'sometimes|required|string|max:255|unique:pages,slug,' . $page->id,
            'content' => 'sometimes|required|array',
            'layout_id' => 'nullable|exists:templates,id',
            'template_assignments' => 'nullable|array',
            'page_variables' => 'nullable|array',
            'status' => ['nullable', Rule::in(array_keys(Page::STATUSES))],
        ]);

        // Verificar layout si se está actualizando
        if (isset($validated['layout_id'])) {
            $layout = Template::find($validated['layout_id']);
            if ($layout->type !== 'layout') {
                return response()->json([
                    'success' => false,
                    'message' => 'El template seleccionado no es un layout'
                ], 400);
            }
        }

        $page->update($validated);

        // Limpiar cache de renderizado si cambió el contenido
        if (isset($validated['content']) || isset($validated['layout_id']) || isset($validated['template_assignments'])) {
            $page->clearRenderCache();
        }

        return response()->json([
            'success' => true,
            'message' => 'Página actualizada exitosamente',
            'data' => $page
        ]);
    }

    /**
     * Renderizar página (preview)
     */
    public function render(Page $page): JsonResponse
    {
        try {
            $html = $this->pageRenderer->render($page);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'html' => $html,
                    'last_rendered_at' => now()->toISOString(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al renderizar la página',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Publicar página
     */
    public function publish(Page $page): JsonResponse
    {
        $page->publish();

        return response()->json([
            'success' => true,
            'message' => 'Página publicada exitosamente'
        ]);
    }

    /**
     * Convertir página a borrador
     */
    public function unpublish(Page $page): JsonResponse
    {
        $page->makeDraft();

        return response()->json([
            'success' => true,
            'message' => 'Página convertida a borrador'
        ]);
    }

    /**
     * Eliminar página
     */
    public function destroy(Page $page): JsonResponse
    {
        $page->delete();

        return response()->json([
            'success' => true,
            'message' => 'Página eliminada exitosamente'
        ]);
    }

    /**
     * Asignar template a página
     */
    public function assignTemplate(Request $request, Page $page): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|string|in:header,footer,sidebar,nav',
            'template_id' => 'required|exists:templates,id',
        ]);

        $template = Template::find($validated['template_id']);
        
        // Verificar que el template es del tipo correcto
        if ($template->type !== $validated['type']) {
            return response()->json([
                'success' => false,
                'message' => "El template seleccionado no es del tipo {$validated['type']}"
            ], 400);
        }

        $page->assignTemplate($validated['type'], $validated['template_id']);
        $page->clearRenderCache();

        return response()->json([
            'success' => true,
            'message' => 'Template asignado exitosamente'
        ]);
    }

    /**
     * Remover asignación de template
     */
    public function removeTemplate(Request $request, Page $page): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|string|in:header,footer,sidebar,nav',
        ]);

        $page->removeTemplateAssignment($validated['type']);
        $page->clearRenderCache();

        return response()->json([
            'success' => true,
            'message' => 'Template removido exitosamente'
        ]);
    }
}


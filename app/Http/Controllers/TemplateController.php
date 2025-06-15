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


    public function getAlpineMethods(Request $request): JsonResponse
    {
        try {
            $query = Template::alpineMethods()
                            ->availableForUser(auth()->id())
                            ->active();

            // Filtros opcionales
            if ($request->filled('category')) {
                $query->inCategory($request->category);
            }

            if ($request->filled('search')) {
                $query->where(function ($q) use ($request) {
                    $search = $request->search;
                    $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('description', 'LIKE', "%{$search}%")
                    ->orWhere('trigger_syntax', 'LIKE', "%{$search}%");
                });
            }

            // Ordenar por popularidad y nombre
            $methods = $query->orderBy('usage_count', 'desc')
                            ->orderBy('is_global', 'desc')
                            ->orderBy('name')
                            ->get();

            return response()->json([
                'success' => true,
                'data' => $methods->map(function ($method) {
                    return [
                        'id' => $method->id,
                        'name' => $method->name,
                        'trigger_syntax' => $method->trigger_syntax,
                        'description' => $method->description,
                        'category' => $method->category,
                        'category_name' => $method->category_name,
                        
                        // Datos específicos del método
                        'method_template' => $method->method_template,
                        'method_parameters' => $method->method_parameters,
                        'method_config' => $method->method_config,
                        
                        // Para preview
                        'content' => $method->content,
                        
                        // Metadatos
                        'usage_count' => $method->usage_count,
                        'last_used_at' => $method->last_used_at,
                        'is_global' => $method->is_global,
                        'is_active' => $method->is_active,
                        
                        // Timestamps
                        'created_at' => $method->created_at,
                        'updated_at' => $method->updated_at,
                    ];
                }),
                'meta' => [
                    'total' => $methods->count(),
                    'categories' => $this->getAlpineMethodCategories(),
                    'cache_time' => now()->toISOString()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener métodos Alpine',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener un método Alpine específico
     */
    public function getAlpineMethod(Request $request, $identifier): JsonResponse
    {
        try {
            // Buscar por ID o por trigger_syntax
            $method = Template::alpineMethods()
                            ->availableForUser(auth()->id())
                            ->where(function ($q) use ($identifier) {
                                $q->where('id', $identifier)
                                ->orWhere('trigger_syntax', $identifier);
                            })
                            ->first();

            if (!$method) {
                return response()->json([
                    'success' => false,
                    'message' => 'Método Alpine no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $method->id,
                    'name' => $method->name,
                    'trigger_syntax' => $method->trigger_syntax,
                    'description' => $method->description,
                    'category' => $method->category,
                    
                    // Template y configuración completa
                    'method_template' => $method->method_template,
                    'method_parameters' => $method->method_parameters,
                    'method_config' => $method->method_config,
                    
                    // Para preview y documentación
                    'content' => $method->content,
                    'usage_example' => $method->usage_example,
                    'required_parameters' => $method->required_parameters,
                    'optional_parameters' => $method->optional_parameters,
                    
                    // Metadatos
                    'usage_count' => $method->usage_count,
                    'last_used_at' => $method->last_used_at,
                    'is_global' => $method->is_global,
                    'created_at' => $method->created_at,
                    'updated_at' => $method->updated_at,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el método Alpine',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Incrementar contador de uso de un método Alpine
     */
    public function incrementMethodUsage(Request $request, Template $template): JsonResponse
    {
        try {
            // Verificar que es un método Alpine
            if (!$template->is_alpine_method) {
                return response()->json([
                    'success' => false,
                    'message' => 'El template no es un método Alpine'
                ], 400);
            }

            // Verificar que el usuario puede usar este método
            if (!$template->canBeUsedByUser(auth()->id())) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para usar este método'
                ], 403);
            }

            // Incrementar uso
            $template->incrementUsage();

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $template->id,
                    'trigger_syntax' => $template->trigger_syntax,
                    'usage_count' => $template->usage_count,
                    'last_used_at' => $template->last_used_at->toISOString()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al incrementar uso del método',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear nuevo método Alpine
     */
    public function createAlpineMethod(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'trigger_syntax' => 'required|string|max:50|unique:templates,trigger_syntax|regex:/^@\w+$/',
                'description' => 'nullable|string|max:1000',
                'category' => ['nullable', Rule::in(array_keys(Template::CATEGORIES))],
                
                // Específicos del método Alpine
                'method_template' => 'required|string',
                'method_parameters' => 'nullable|array',
                'method_config' => 'nullable|array',
                
                // Para preview
                'content' => 'nullable|string',
            ]);

            // Agregar campos por defecto
            $validated['type'] = 'alpine_method';
            $validated['user_id'] = auth()->id();
            $validated['is_global'] = false; // Solo admins pueden crear globales
            $validated['usage_count'] = 0;

            $method = Template::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Método Alpine creado exitosamente',
                'data' => [
                    'id' => $method->id,
                    'trigger_syntax' => $method->trigger_syntax,
                    'name' => $method->name
                ]
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear método Alpine',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar método Alpine existente
     */
    public function updateAlpineMethod(Request $request, Template $template): JsonResponse
    {
        try {
            // Verificar que es un método Alpine
            if (!$template->is_alpine_method) {
                return response()->json([
                    'success' => false,
                    'message' => 'El template no es un método Alpine'
                ], 400);
            }

            // Verificar permisos
            if ($template->user_id !== auth()->id() && !auth()->user()->isAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para editar este método'
                ], 403);
            }

            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'trigger_syntax' => [
                    'sometimes',
                    'required',
                    'string',
                    'max:50',
                    'regex:/^@\w+$/',
                    Rule::unique('templates', 'trigger_syntax')->ignore($template->id)
                ],
                'description' => 'nullable|string|max:1000',
                'category' => ['nullable', Rule::in(array_keys(Template::CATEGORIES))],
                
                // Específicos del método Alpine
                'method_template' => 'sometimes|required|string',
                'method_parameters' => 'nullable|array',
                'method_config' => 'nullable|array',
                
                // Para preview
                'content' => 'nullable|string',
                'is_active' => 'sometimes|boolean',
            ]);

            $template->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Método Alpine actualizado exitosamente',
                'data' => [
                    'id' => $template->id,
                    'trigger_syntax' => $template->trigger_syntax,
                    'name' => $template->name,
                    'updated_at' => $template->updated_at->toISOString()
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar método Alpine',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generar código Alpine desde un método
     */
    public function generateAlpineCode(Request $request, Template $template): JsonResponse
    {
        try {
            // Verificar que es un método Alpine
            if (!$template->is_alpine_method) {
                return response()->json([
                    'success' => false,
                    'message' => 'El template no es un método Alpine'
                ], 400);
            }

            // Validar parámetros
            $validated = $request->validate([
                'parameters' => 'nullable|array'
            ]);

            $parameters = $validated['parameters'] ?? [];

            // Validar parámetros del método
            $parameterErrors = $template->validateMethodParameters($parameters);
            if (!empty($parameterErrors)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error en parámetros del método',
                    'errors' => $parameterErrors
                ], 422);
            }

            // Generar código Alpine
            $alpineCode = $template->generateAlpineCode($parameters);

            return response()->json([
                'success' => true,
                'data' => [
                    'alpine_code' => $alpineCode,
                    'method_name' => $template->trigger_syntax,
                    'parameters_used' => $parameters,
                    'generated_at' => now()->toISOString()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al generar código Alpine',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de métodos Alpine
     */
    public function getAlpineMethodsStats(Request $request): JsonResponse
    {
        try {
            $stats = [
                'total_methods' => Template::alpineMethods()->count(),
                'active_methods' => Template::alpineMethods()->active()->count(),
                'global_methods' => Template::alpineMethods()->global()->count(),
                'user_methods' => Template::alpineMethods()->forUser(auth()->id())->count(),
                
                'by_category' => Template::alpineMethods()
                                    ->active()
                                    ->selectRaw('category, COUNT(*) as count')
                                    ->groupBy('category')
                                    ->pluck('count', 'category'),
                
                'most_used' => Template::alpineMethods()
                                    ->active()
                                    ->orderBy('usage_count', 'desc')
                                    ->limit(10)
                                    ->get(['trigger_syntax', 'name', 'usage_count'])
                                    ->map(function ($method) {
                                        return [
                                            'trigger' => $method->trigger_syntax,
                                            'name' => $method->name,
                                            'usage' => $method->usage_count
                                        ];
                                    }),
                
                'recently_used' => Template::alpineMethods()
                                        ->recentlyUsed(7)
                                        ->limit(5)
                                        ->get(['trigger_syntax', 'name', 'last_used_at'])
                                        ->map(function ($method) {
                                            return [
                                                'trigger' => $method->trigger_syntax,
                                                'name' => $method->name,
                                                'last_used' => $method->last_used_at->toISOString()
                                            ];
                                        }),
                
                'total_usage' => Template::alpineMethods()->sum('usage_count'),
                'generated_at' => now()->toISOString()
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener categorías de métodos Alpine
     * @return array
     */
    private function getAlpineMethodCategories(): array
    {
        return Template::alpineMethods()
                    ->active()
                    ->distinct()
                    ->pluck('category')
                    ->filter()
                    ->mapWithKeys(function ($category) {
                        return [$category => Template::CATEGORIES[$category] ?? ucfirst($category)];
                    })
                    ->toArray();
    }


}




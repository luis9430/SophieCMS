<?php

// ===================================================================
// app/Http/Controllers/TemplateController.php
// VERSIÓN LIMPIA - Alpine Methods deprecados, Preact Components como principal
// ===================================================================

namespace App\Http\Controllers;

use App\Models\Template;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class TemplateController extends Controller
{
    // ===================================================================
    // MÉTODOS PRINCIPALES DE TEMPLATES (MANTENER)
    // ===================================================================

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
            'is_global' => false,
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
        if ($template->user_id !== auth()->id() || $template->is_global) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para eliminar este template'
            ], 403);
        }

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

    // ===================================================================
    // ✅ MÉTODOS PREACT COMPONENTS (PRINCIPALES)
    // ===================================================================

    /**
     * Obtener todos los componentes Preact
     */
    public function getPreactComponents(Request $request): JsonResponse
    {
        $query = Template::where('type', 'preact_component')
            ->availableForUser(auth()->id());

        // Filtros opcionales
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'LIKE', '%' . $request->search . '%')
                  ->orWhere('description', 'LIKE', '%' . $request->search . '%')
                  ->orWhereJsonContains('component_tags', $request->search);
            });
        }

        if ($request->filled('sort_by')) {
            $sortBy = $request->sort_by;
            $sortOrder = $request->input('sort_order', 'desc');
            
            switch ($sortBy) {
                case 'name':
                    $query->orderBy('name', $sortOrder);
                    break;
                case 'usage':
                    $query->orderBy('usage_count', $sortOrder);
                    break;
                case 'created':
                    $query->orderBy('created_at', $sortOrder);
                    break;
                case 'updated':
                default:
                    $query->orderBy('updated_at', $sortOrder)->orderBy('created_at', $sortOrder);
                    break;
            }
        } else {
            $query->orderBy('updated_at', 'desc')->orderBy('created_at', 'desc');
        }

        $components = $query->get();

        return response()->json([
            'success' => true,
            'data' => $components->map(function ($template) {
                return [
                    'id' => $template->id,
                    'name' => $template->name,
                    'type' => $template->type,
                    'category' => $template->category,
                    'description' => $template->description,
                    'content' => $template->content,
                    'component_version' => $template->component_version ?? '1.0.0',
                    'component_tags' => $template->component_tags ?? [],
                    'preact_props' => $template->preact_props ?? [],
                    'preact_hooks' => $template->preact_hooks ?? [],
                    'preact_config' => $template->preact_config ?? [],
                    'preact_dependencies' => $template->preact_dependencies ?? [],
                    'usage_count' => $template->usage_count ?? 0,
                    'is_global' => $template->is_global,
                    'created_at' => $template->created_at,
                    'updated_at' => $template->updated_at,
                ];
            })
        ]);
    }

    /**
     * Obtener un componente Preact específico
     */
    public function getPreactComponent(Template $template): JsonResponse
    {
        if ($template->type !== 'preact_component') {
            return response()->json([
                'success' => false,
                'message' => 'El template no es un componente Preact'
            ], 400);
        }

        if (!$template->canBeUsedByUser(auth()->id())) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para ver este componente'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $template->id,
                'name' => $template->name,
                'type' => $template->type,
                'category' => $template->category,
                'description' => $template->description,
                'content' => $template->content,
                'component_version' => $template->component_version ?? '1.0.0',
                'component_tags' => $template->component_tags ?? [],
                'preact_props' => $template->preact_props ?? [],
                'preact_hooks' => $template->preact_hooks ?? [],
                'preact_config' => $template->preact_config ?? [],
                'preact_dependencies' => $template->preact_dependencies ?? [],
                'usage_count' => $template->usage_count ?? 0,
                'is_global' => $template->is_global,
                'created_at' => $template->created_at,
                'updated_at' => $template->updated_at,
            ]
        ]);
    }

    /**
     * Crear un nuevo componente Preact
     */
    public function storePreactComponent(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => ['required', Rule::in(array_keys(Template::CATEGORIES))],
            'description' => 'nullable|string|max:1000',
            'component_version' => 'nullable|string|max:20',
            'component_tags' => 'nullable|array',
            'component_tags.*' => 'string|max:50',
            'preact_props' => 'nullable|array',
            'preact_hooks' => 'nullable|array',
            'preact_config' => 'nullable|array',
            'preact_dependencies' => 'nullable|array',
        ]);

        // Validar sintaxis JSX básica
        $contentValidation = $this->validatePreactComponent($validated['content']);
        if (!$contentValidation['valid']) {
            return response()->json([
                'success' => false,
                'message' => 'Error en el código del componente',
                'errors' => $contentValidation['errors']
            ], 422);
        }

        // Establecer valores por defecto
        $validated['component_version'] = $validated['component_version'] ?? '1.0.0';
        $validated['component_tags'] = $validated['component_tags'] ?? [];

        $template = Template::create([
            'type' => 'preact_component',
            'user_id' => auth()->id(),
            'is_global' => false,
            'is_active' => true,
            'usage_count' => 0,
            ...$validated
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Componente Preact creado exitosamente',
            'data' => $template
        ], 201);
    }

    /**
     * Actualizar un componente Preact existente
     */
    public function updatePreactComponent(Request $request, Template $template): JsonResponse
    {
        if ($template->type !== 'preact_component') {
            return response()->json([
                'success' => false,
                'message' => 'El template no es un componente Preact'
            ], 400);
        }

        if ($template->user_id !== auth()->id() && !auth()->user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para editar este componente'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|required|string',
            'category' => ['sometimes', 'required', Rule::in(array_keys(Template::CATEGORIES))],
            'description' => 'nullable|string|max:1000',
            'component_version' => 'nullable|string|max:20',
            'component_tags' => 'nullable|array',
            'component_tags.*' => 'string|max:50',
            'preact_props' => 'nullable|array',
            'preact_hooks' => 'nullable|array',
            'preact_config' => 'nullable|array',
            'preact_dependencies' => 'nullable|array',
        ]);

        // Validar sintaxis JSX si se actualiza el contenido
        if (isset($validated['content'])) {
            $contentValidation = $this->validatePreactComponent($validated['content']);
            if (!$contentValidation['valid']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error en el código del componente',
                    'errors' => $contentValidation['errors']
                ], 422);
            }
        }

        $template->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Componente Preact actualizado exitosamente',
            'data' => $template
        ]);
    }

    /**
     * Duplicar un componente Preact
     */
    public function duplicatePreactComponent(Template $template): JsonResponse
    {
        if ($template->type !== 'preact_component') {
            return response()->json([
                'success' => false,
                'message' => 'Solo se pueden duplicar componentes Preact'
            ], 400);
        }

        if (!$template->canBeUsedByUser(auth()->id())) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para duplicar este componente'
            ], 403);
        }

        $duplicate = $template->replicate();
        $duplicate->name = $template->name . ' (Copia)';
        $duplicate->user_id = auth()->id();
        $duplicate->is_global = false;
        $duplicate->usage_count = 0;
        $duplicate->save();

        return response()->json([
            'success' => true,
            'message' => 'Componente duplicado exitosamente',
            'data' => $duplicate
        ]);
    }

    /**
     * Incrementar contador de uso de componente
     */
    public function incrementPreactComponentUsage(Template $template): JsonResponse
    {
        if ($template->type !== 'preact_component') {
            return response()->json([
                'success' => false,
                'message' => 'Solo se puede incrementar uso de componentes Preact'
            ], 400);
        }

        $template->increment('usage_count');
        $template->update(['last_used_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Uso registrado exitosamente',
            'usage_count' => $template->fresh()->usage_count
        ]);
    }

    /**
     * Obtener estadísticas de componentes Preact
     */
    public function getPreactComponentsStats(): JsonResponse
    {
        $userId = auth()->id();
        
        $stats = [
            'total_components' => Template::where('type', 'preact_component')->count(),
            'user_components' => Template::where('type', 'preact_component')
                                       ->where('user_id', $userId)
                                       ->count(),
            'global_components' => Template::where('type', 'preact_component')
                                         ->where('is_global', true)
                                         ->count(),
            'most_used' => Template::where('type', 'preact_component')
                                 ->availableForUser($userId)
                                 ->orderBy('usage_count', 'desc')
                                 ->limit(10)
                                 ->get(['id', 'name', 'usage_count', 'category']),
            'by_category' => Template::where('type', 'preact_component')
                                   ->availableForUser($userId)
                                   ->selectRaw('category, COUNT(*) as count')
                                   ->groupBy('category')
                                   ->get(),
            'recent' => Template::where('type', 'preact_component')
                              ->availableForUser($userId)
                              ->orderBy('created_at', 'desc')
                              ->limit(10)
                              ->get(['id', 'name', 'created_at', 'category']),
            'total_usage' => Template::where('type', 'preact_component')
                                   ->availableForUser($userId)
                                   ->sum('usage_count')
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Generar código de ejemplo para un componente
     */
    public function generatePreactComponentExample(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(['button', 'card', 'modal', 'form', 'hero', 'counter', 'nav', 'footer'])],
            'name' => 'required|string|max:100'
        ]);

        $examples = [
            'button' => $this->getButtonExample($validated['name']),
            'card' => $this->getCardExample($validated['name']),
            'modal' => $this->getModalExample($validated['name']),
            'form' => $this->getFormExample($validated['name']),
            'hero' => $this->getHeroExample($validated['name']),
            'counter' => $this->getCounterExample($validated['name']),
            'nav' => $this->getNavExample($validated['name']),
            'footer' => $this->getFooterExample($validated['name'])
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'name' => $validated['name'],
                'type' => $validated['type'],
                'content' => $examples[$validated['type']],
                'props' => $this->getExampleProps($validated['type']),
                'hooks' => $this->getExampleHooks($validated['type']),
                'category' => $this->getExampleCategory($validated['type']),
                'tags' => $this->getExampleTags($validated['type'])
            ]
        ]);
    }

    // ===================================================================
    // ⚠️ MÉTODOS ALPINE (DEPRECATED - MANTENER SOLO PARA MIGRACIÓN)
    // ===================================================================

    /**
     * @deprecated Usar getPreactComponents() en su lugar
     */
    public function getAlpineMethods(Request $request): JsonResponse
    {
        try {
            $query = Template::alpineMethods()
                            ->availableForUser(auth()->id())
                            ->active();

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

            $methods = $query->orderBy('usage_count', 'desc')
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
                        'content' => $method->content,
                        'usage_count' => $method->usage_count,
                        'is_global' => $method->is_global,
                        'created_at' => $method->created_at,
                        'updated_at' => $method->updated_at,
                        '_deprecated' => true,
                        '_migration_note' => 'Este método Alpine puede migrarse a Preact'
                    ];
                }),
                'meta' => [
                    'total' => $methods->count(),
                    'deprecated' => true,
                    'recommendation' => 'Migrar a componentes Preact'
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener métodos Alpine (deprecated)',
                'recommendation' => 'Usar /api/templates/preact-components en su lugar'
            ], 500);
        }
    }

    /**
     * Migrar componente Alpine a Preact
     */
    public function migrateAlpineToPreact(Template $template): JsonResponse
    {
        if ($template->type !== 'alpine_method') {
            return response()->json([
                'success' => false,
                'message' => 'Solo se pueden migrar métodos Alpine'
            ], 400);
        }

        try {
            $preactCode = $this->transformAlpineToPreact($template->content);
            $preactProps = $this->extractPropsFromAlpine($template);
            $preactHooks = $this->extractHooksFromAlpine($template->content);

            $newTemplate = Template::create([
                'name' => $template->name . ' (Preact)',
                'type' => 'preact_component',
                'category' => $template->category,
                'description' => ($template->description ?? '') . ' - Migrado desde Alpine.js',
                'content' => $preactCode,
                'component_version' => '1.0.0',
                'component_tags' => ['migrated', 'alpine'],
                'preact_props' => $preactProps,
                'preact_hooks' => $preactHooks,
                'user_id' => auth()->id(),
                'is_global' => false,
                'usage_count' => 0
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Componente migrado exitosamente de Alpine a Preact',
                'data' => [
                    'original' => $template,
                    'migrated' => $newTemplate
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error durante la migración: ' . $e->getMessage()
            ], 500);
        }
    }

    // ===================================================================
    // MÉTODOS PRIVADOS DE UTILIDAD
    // ===================================================================

    /**
     * Validar sintaxis básica de componente Preact
     */
    private function validatePreactComponent(string $content): array
    {
        $errors = [];

        if (!str_contains($content, 'const ') && !str_contains($content, 'function ')) {
            $errors[] = 'El componente debe definirse como const o function';
        }

        if (!str_contains($content, 'return')) {
            $errors[] = 'El componente debe tener un return statement';
        }

        if (str_contains($content, 'return') && !str_contains($content, '<')) {
            $errors[] = 'El componente debe retornar JSX (elementos con <...>)';
        }

        // Verificar hooks válidos
        preg_match_all('/use[A-Z]\w*/', $content, $matches);
        $validHooks = ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext', 'useReducer'];
        $invalidHooks = array_diff($matches[0], $validHooks);

        if (!empty($invalidHooks)) {
            $errors[] = 'Hooks no válidos encontrados: ' . implode(', ', $invalidHooks);
        }

        // Verificar paréntesis balanceados
        if (substr_count($content, '(') !== substr_count($content, ')')) {
            $errors[] = 'Paréntesis no balanceados';
        }

        // Verificar llaves balanceadas
        if (substr_count($content, '{') !== substr_count($content, '}')) {
            $errors[] = 'Llaves no balanceadas';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Transformar código Alpine.js a Preact (básico)
     */
    private function transformAlpineToPreact(string $alpineContent): string
    {
        $preactCode = $alpineContent;

        $transformations = [
            '/x-data="{\s*(\w+):\s*([^}]+)\s*}"/' => 'const [$1, set' . ucfirst('$1') . '] = useState($2);',
            '/@click="([^"]+)"/' => 'onClick={() => $1}',
            '/x-show="([^"]+)"/' => 'style={{display: $1 ? \'block\' : \'none\'}}',
            '/x-text="([^"]+)"/' => '{$1}',
            '/\bclass=/' => 'className=',
        ];

        foreach ($transformations as $pattern => $replacement) {
            $preactCode = preg_replace($pattern, $replacement, $preactCode);
        }

        if (!str_contains($preactCode, 'const ') && !str_contains($preactCode, 'function ')) {
            $preactCode = "const MigratedComponent = () => {\n  const [state, setState] = useState({});\n  \n  return (\n    <div>\n      {/* Código migrado desde Alpine */}\n      {$preactCode}\n    </div>\n  );\n};";
        }

        return $preactCode;
    }

    private function extractPropsFromAlpine(Template $template): array
    {
        $props = [];
        
        if (preg_match_all('/x-data="{\s*(\w+):\s*[^}]+\s*}"/', $template->content, $matches)) {
            foreach ($matches[1] as $prop) {
                $props[$prop] = [
                    'type' => 'any',
                    'default' => null,
                    'required' => false
                ];
            }
        }

        if ($template->method_parameters) {
            foreach ($template->method_parameters as $param => $config) {
                $props[$param] = [
                    'type' => $config['type'] ?? 'any',
                    'default' => $config['default'] ?? null,
                    'required' => !($config['optional'] ?? false)
                ];
            }
        }

        return $props;
    }

    private function extractHooksFromAlpine(string $content): array
    {
        $hooks = ['useState'];

        if (str_contains($content, 'x-effect') || str_contains($content, '$watch')) {
            $hooks[] = 'useEffect';
        }

        if (str_contains($content, 'x-ref') || str_contains($content, '$refs')) {
            $hooks[] = 'useRef';
        }

        return array_unique($hooks);
    }

    // ===================================================================
    // EJEMPLOS DE COMPONENTES PREACT
    // ===================================================================

    private function getButtonExample(string $name): string
    {
        return "const {$name} = ({ 
            children = 'Click me',
            variant = 'primary',
            size = 'md',
            disabled = false,
            onClick = null
        }) => {
            const [clickCount, setClickCount] = useState(0);

            const handleClick = () => {
                setClickCount(prev => prev + 1);
                if (onClick) onClick();
            };

            const variants = {
                primary: 'bg-blue-600 hover:bg-blue-700 text-white',
                secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            };

            const sizes = {
                sm: 'px-3 py-1.5 text-sm',
                md: 'px-4 py-2',
                lg: 'px-6 py-3 text-lg'
            };

            return (
                <button
                    className={\`
                        \${variants[variant]} \${sizes[size]}
                        rounded-lg font-medium transition-all duration-200
                        transform hover:scale-105 active:scale-95
                        disabled:opacity-50 disabled:cursor-not-allowed
                    \`}
                    disabled={disabled}
                    onClick={handleClick}
                >
                    {children} {clickCount > 0 && \`(\${clickCount})\`}
                </button>
            );
        };";
    }

    private function getHeroExample(string $name): string
    {
        return "const {$name} = ({ 
            title = 'Construye Sitios Web Increíbles',
            subtitle = 'Con nuestro page builder revolucionario',
            ctaText = 'Comenzar Ahora',
            ctaUrl = '/signup',
            backgroundImage = 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920'
        }) => {
            const [isVisible, setIsVisible] = useState(false);
            const [stats, setStats] = useState({ users: 0, websites: 0, templates: 0 });

            useEffect(() => {
                setIsVisible(true);
                
                const animateCounter = (key, target) => {
                    let current = 0;
                    const increment = target / 100;
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            current = target;
                            clearInterval(timer);
                        }
                        setStats(prev => ({ ...prev, [key]: Math.floor(current) }));
                    }, 30);
                };

                animateCounter('users', 10000);
                animateCounter('websites', 5000);
                animateCounter('templates', 500);
            }, []);

            return (
                <section 
                    className='relative h-screen flex items-center justify-center bg-cover bg-center'
                    style={{ backgroundImage: \`url(\${backgroundImage})\` }}
                >
                    <div className='absolute inset-0 bg-black opacity-70'></div>
                    
                    <div className={\`relative z-10 text-center text-white max-w-4xl mx-auto px-4 transition-all duration-1000 \${
                        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }\`}>
                        <h1 className='text-5xl md:text-7xl font-bold mb-6'>
                            {title}
                        </h1>
                        
                        <p className='text-xl md:text-2xl mb-8 opacity-90'>
                            {subtitle}
                        </p>
                        
                        <a
                            href={ctaUrl}
                            className='bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105 inline-block mb-12'
                        >
                            {ctaText}
                        </a>
                        
                        <div className='grid grid-cols-3 gap-8 text-center'>
                            <div>
                                <div className='text-3xl font-bold'>{stats.users.toLocaleString()}+</div>
                                <div className='text-sm opacity-75'>Usuarios Activos</div>
                            </div>
                            <div>
                                <div className='text-3xl font-bold'>{stats.websites.toLocaleString()}+</div>
                                <div className='text-sm opacity-75'>Sitios Creados</div>
                            </div>
                            <div>
                                <div className='text-3xl font-bold'>{stats.templates}+</div>
                                <div className='text-sm opacity-75'>Templates</div>
                            </div>
                        </div>
                    </div>
                </section>
            );
        };";
    }

    private function getCardExample(string $name): string
    {
                return "const {$name} = ({
            title = 'Card Title',
            description = 'Card description goes here...',
            image = 'https://via.placeholder.com/400x200',
            buttonText = 'Learn More',
            buttonUrl = '#'
        }) => {
            const [isHovered, setIsHovered] = useState(false);
            
            return (
                <div 
                    className={\`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 \${
                        isHovered ? 'shadow-xl transform scale-105' : ''
                    }\`}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <img src={image} alt={title} className='w-full h-48 object-cover' />
                    <div className='p-6'>
                        <h3 className='text-xl font-semibold mb-2'>{title}</h3>
                        <p className='text-gray-600 mb-4'>{description}</p>
                        <a
                            href={buttonUrl}
                            className='inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors'
                        >
                            {buttonText}
                        </a>
                    </div>
                </div>
            );
        };";
    }

    // Métodos auxiliares para ejemplos
    private function getExampleProps(string $type): array
    {
        $propsByType = [
            'button' => ['children', 'variant', 'size', 'disabled', 'onClick'],
            'hero' => ['title', 'subtitle', 'ctaText', 'ctaUrl', 'backgroundImage'],
            'card' => ['title', 'description', 'image', 'buttonText', 'buttonUrl'],
            'modal' => ['isOpen', 'title', 'children', 'onClose'],
            'counter' => ['initialValue', 'step', 'min', 'max'],
            'form' => ['onSubmit', 'title', 'submitText'],
            'nav' => ['brand', 'links', 'variant'],
            'footer' => ['brand', 'links', 'copyright']
        ];

        return $propsByType[$type] ?? [];
    }

    private function getExampleHooks(string $type): array
    {
        $hooksByType = [
            'button' => ['useState'],
            'hero' => ['useState', 'useEffect'],
            'card' => ['useState'],
            'modal' => ['useState', 'useEffect'],
            'counter' => ['useState'],
            'form' => ['useState'],
            'nav' => ['useState'],
            'footer' => []
        ];

        return $hooksByType[$type] ?? ['useState'];
    }

    private function getExampleCategory(string $type): string
    {
        $categoryByType = [
            'button' => 'ui',
            'hero' => 'marketing',
            'card' => 'ui',
            'modal' => 'ui',
            'counter' => 'interactive',
            'form' => 'form',
            'nav' => 'navigation',
            'footer' => 'navigation'
        ];

        return $categoryByType[$type] ?? 'ui';
    }

    private function getExampleTags(string $type): array
    {
        $tagsByType = [
            'button' => ['button', 'ui', 'interactive'],
            'hero' => ['hero', 'marketing', 'landing'],
            'card' => ['card', 'content'],
            'modal' => ['modal', 'overlay', 'ui'],
            'counter' => ['counter', 'interactive', 'demo'],
            'form' => ['form', 'contact', 'validation'],
            'nav' => ['navigation', 'header', 'menu'],
            'footer' => ['footer', 'navigation', 'links']
        ];

        return $tagsByType[$type] ?? [];
    }

    // Agregar solo los métodos que faltan para completar los ejemplos
    private function getModalExample(string $name): string
    {
        return "const {$name} = ({ 
            isOpen = false,
            onClose = null,
            title = 'Modal Title',
            children = 'Modal content goes here...'
        }) => {
            useEffect(() => {
                if (isOpen) {
                    document.body.style.overflow = 'hidden';
                } else {
                    document.body.style.overflow = 'unset';
                }
                
                return () => {
                    document.body.style.overflow = 'unset';
                };
            }, [isOpen]);

            if (!isOpen) return null;

            return (
                <div 
                    className='fixed inset-0 z-50 flex items-center justify-center'
                    onClick={(e) => e.target === e.currentTarget && onClose?.()}
                >
                    <div className='absolute inset-0 bg-black bg-opacity-50'></div>
                    
                    <div className='relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-300'>
                        <div className='p-6'>
                            <div className='flex justify-between items-center mb-4'>
                                <h3 className='text-lg font-semibold'>{title}</h3>
                                {onClose && (
                                    <button
                                        onClick={onClose}
                                        className='text-gray-400 hover:text-gray-600 text-xl'
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                            
                            <div className='text-gray-600'>
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            );
        };";
    }

    private function getCounterExample(string $name): string
    {
                return "const {$name} = ({ 
            initialValue = 0,
            step = 1,
            min = null,
            max = null
        }) => {
            const [count, setCount] = useState(initialValue);
            const [isAnimating, setIsAnimating] = useState(false);

            const increment = () => {
                if (max === null || count < max) {
                    setCount(prev => prev + step);
                    animate();
                }
            };

            const decrement = () => {
                if (min === null || count > min) {
                    setCount(prev => prev - step);
                    animate();
                }
            };

            const reset = () => {
                setCount(initialValue);
                animate();
            };

            const animate = () => {
                setIsAnimating(true);
                setTimeout(() => setIsAnimating(false), 200);
            };

            return (
                <div className='text-center p-6 bg-white rounded-lg shadow-md max-w-sm mx-auto'>
                    <h3 className='text-lg font-semibold mb-4'>Counter</h3>
                    
                    <div className={\`
                        text-4xl font-bold mb-6 transition-all duration-200
                        \${isAnimating ? 'scale-110 text-blue-600' : 'text-gray-800'}
                    \`}>
                        {count}
                    </div>
                    
                    <div className='space-x-2'>
                        <button
                            onClick={decrement}
                            disabled={min !== null && count <= min}
                            className='bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50 transition-colors'
                        >
                            -
                        </button>
                        
                        <button
                            onClick={reset}
                            className='bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors'
                        >
                            Reset
                        </button>
                        
                        <button
                            onClick={increment}
                            disabled={max !== null && count >= max}
                            className='bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 transition-colors'
                        >
                            +
                        </button>
                    </div>
                </div>
            );
        };";
    }

    private function getFormExample(string $name): string
    {
        return "const {$name} = ({ 
            onSubmit = null,
            title = 'Contáctanos',
            submitText = 'Enviar Mensaje'
        }) => {
            const [formData, setFormData] = useState({
                name: '',
                email: '',
                message: ''
            });
            const [errors, setErrors] = useState({});
            const [isSubmitting, setIsSubmitting] = useState(false);

            const handleChange = (field, value) => {
                setFormData(prev => ({ ...prev, [field]: value }));
                if (errors[field]) {
                    setErrors(prev => ({ ...prev, [field]: null }));
                }
            };

            const validateForm = () => {
                const newErrors = {};
                
                if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
                if (!formData.email.trim()) newErrors.email = 'El email es requerido';
                if (!formData.message.trim()) newErrors.message = 'El mensaje es requerido';
                
                setErrors(newErrors);
                return Object.keys(newErrors).length === 0;
            };

            const handleSubmit = async (e) => {
                e.preventDefault();
                if (!validateForm()) return;
                
                setIsSubmitting(true);
                try {
                    if (onSubmit) await onSubmit(formData);
                    setFormData({ name: '', email: '', message: '' });
                } finally {
                    setIsSubmitting(false);
                }
            };

            return (
                <form onSubmit={handleSubmit} className='max-w-md mx-auto p-6 bg-white rounded-lg shadow-md'>
                    <h2 className='text-2xl font-bold text-gray-800 mb-6 text-center'>{title}</h2>
                    
                    <div className='mb-4'>
                        <label className='block text-gray-700 text-sm font-bold mb-2'>Nombre *</label>
                        <input
                            type='text'
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className={\`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 \${
                                errors.name ? 'border-red-500' : 'border-gray-300'
                            }\`}
                        />
                        {errors.name && <p className='text-red-500 text-xs mt-1'>{errors.name}</p>}
                    </div>

                    <div className='mb-4'>
                        <label className='block text-gray-700 text-sm font-bold mb-2'>Email *</label>
                        <input
                            type='email'
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            className={\`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 \${
                                errors.email ? 'border-red-500' : 'border-gray-300'
                            }\`}
                        />
                        {errors.email && <p className='text-red-500 text-xs mt-1'>{errors.email}</p>}
                    </div>

                    <div className='mb-6'>
                        <label className='block text-gray-700 text-sm font-bold mb-2'>Mensaje *</label>
                        <textarea
                            value={formData.message}
                            onChange={(e) => handleChange('message', e.target.value)}
                            rows={4}
                            className={\`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 \${
                                errors.message ? 'border-red-500' : 'border-gray-300'
                            }\`}
                        />
                        {errors.message && <p className='text-red-500 text-xs mt-1'>{errors.message}</p>}
                    </div>

                    <button
                        type='submit'
                        disabled={isSubmitting}
                        className='w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors'
                    >
                        {isSubmitting ? 'Enviando...' : submitText}
                    </button>
                </form>
            );
        };";
    }

    private function getNavExample(string $name): string
    {
                return "const {$name} = ({ 
            brand = 'Mi Marca',
            links = [
                { label: 'Inicio', href: '/' },
                { label: 'Acerca', href: '/about' },
                { label: 'Servicios', href: '/services' },
                { label: 'Contacto', href: '/contact' }
            ],
            variant = 'light'
        }) => {
            const [isOpen, setIsOpen] = useState(false);

            const variants = {
                light: 'bg-white shadow-md text-gray-800',
                dark: 'bg-gray-900 text-white',
                transparent: 'bg-transparent text-white'
            };

            return (
                <nav className={\`\${variants[variant]} transition-all duration-300\`}>
                    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                        <div className='flex justify-between items-center h-16'>
                            <div className='flex-shrink-0'>
                                <a href='/' className='text-xl font-bold'>
                                    {brand}
                                </a>
                            </div>
                            
                            <div className='hidden md:block'>
                                <div className='ml-10 flex items-baseline space-x-4'>
                                    {links.map((link, index) => (
                                        <a
                                            key={index}
                                            href={link.href}
                                            className='hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors'
                                        >
                                            {link.label}
                                        </a>
                                    ))}
                                </div>
                            </div>
                            
                            <div className='md:hidden'>
                                <button
                                    onClick={() => setIsOpen(!isOpen)}
                                    className='inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-700 focus:outline-none'
                                >
                                    <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {isOpen && (
                        <div className='md:hidden'>
                            <div className='px-2 pt-2 pb-3 space-y-1 sm:px-3'>
                                {links.map((link, index) => (
                                    <a
                                        key={index}
                                        href={link.href}
                                        className='hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium'
                                    >
                                        {link.label}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </nav>
            );
        };";
    }

    private function getFooterExample(string $name): string
    {
        return "const {$name} = ({ 
            brand = 'Mi Empresa',
            links = [
                { section: 'Producto', items: [
                    { label: 'Características', href: '/features' },
                    { label: 'Precios', href: '/pricing' }
                ]},
                { section: 'Empresa', items: [
                    { label: 'Acerca', href: '/about' },
                    { label: 'Contacto', href: '/contact' }
                ]}
            ],
            copyright = '© 2024 Mi Empresa. Todos los derechos reservados.'
        }) => {
            const currentYear = new Date().getFullYear();

            return (
                <footer className='bg-gray-900 text-white'>
                    <div className='max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8'>
                        <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
                            <div className='col-span-1 md:col-span-2'>
                                <h3 className='text-2xl font-bold mb-4'>{brand}</h3>
                                <p className='text-gray-400 max-w-md'>
                                    Construyendo el futuro con tecnología innovadora.
                                </p>
                            </div>
                            
                            {links.map((section, index) => (
                                <div key={index}>
                                    <h4 className='text-lg font-semibold mb-4'>{section.section}</h4>
                                    <ul className='space-y-2'>
                                        {section.items.map((item, itemIndex) => (
                                            <li key={itemIndex}>
                                                <a
                                                    href={item.href}
                                                    className='text-gray-400 hover:text-white transition-colors'
                                                >
                                                    {item.label}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                        
                        <div className='mt-8 pt-8 border-t border-gray-800'>
                            <p className='text-gray-400'>
                                {copyright.replace('2024', currentYear.toString())}
                            </p>
                        </div>
                    </div>
                </footer>
            );
        };";
    }

}
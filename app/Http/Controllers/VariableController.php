<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Models\Variable;

/**
 * VariableController Completo y Optimizado
 * Incluye todos los métodos necesarios para el frontend
 */
class VariableController extends Controller
{
    // Cache keys
    const CACHE_KEY_ALL_RESOLVED = 'variables.all_resolved';
    const CACHE_KEY_CATEGORIES = 'variables.categories';
    const CACHE_TTL = 300; // 5 minutos

    /**
     * Display a listing of variables for the admin panel
     */
    public function index(Request $request)
    {
        try {
            $query = Variable::query();

            // Filter by category
            if ($request->has('category') && $request->category !== 'all') {
                $query->where('category', $request->category);
            }

            // Filter by type
            if ($request->has('type') && $request->type !== 'all') {
                $query->where('type', $request->type);
            }

            // Search by key or description
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('key', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // Sort
            $sortBy = $request->get('sort_by', 'key');
            $sortDirection = $request->get('sort_direction', 'asc');
            $query->orderBy($sortBy, $sortDirection);

            // Get results with pagination
            if ($request->has('paginate') && $request->paginate) {
                $variables = $query->paginate($request->get('per_page', 15));
            } else {
                $variables = $query->get();
            }

            return response()->json($variables);

        } catch (\Exception $e) {
            Log::error('Error fetching variables', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'message' => 'Error fetching variables',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available categories for the admin panel
     */
    public function categories()
    {
        try {
            // Try cache first
            $cached = Cache::get(self::CACHE_KEY_CATEGORIES);
            if ($cached) {
                return response()->json($cached);
            }

            $categories = [
                'site' => [
                    'name' => 'Sitio Web',
                    'color' => '#3B82F6',
                    'icon' => '🌐',
                    'description' => 'Variables del sitio web general',
                    'default_ttl' => null
                ],
                'contact' => [
                    'name' => 'Contacto',
                    'color' => '#10B981',
                    'icon' => '📞',
                    'description' => 'Información de contacto',
                    'default_ttl' => 86400 // 1 día
                ],
                'company' => [
                    'name' => 'Empresa',
                    'color' => '#8B5CF6',
                    'icon' => '🏢',
                    'description' => 'Datos de la empresa',
                    'default_ttl' => null
                ],
                'social' => [
                    'name' => 'Redes Sociales',
                    'color' => '#F59E0B',
                    'icon' => '📱',
                    'description' => 'Enlaces de redes sociales',
                    'default_ttl' => 3600 // 1 hora
                ],
                'api' => [
                    'name' => 'API External',
                    'color' => '#EF4444',
                    'icon' => '🔗',
                    'description' => 'Variables de APIs externas',
                    'default_ttl' => 1800 // 30 minutos
                ],
                'system' => [
                    'name' => 'Sistema',
                    'color' => '#6B7280',
                    'icon' => '⚙️',
                    'description' => 'Variables del sistema',
                    'default_ttl' => null
                ],
                'custom' => [
                    'name' => 'Personalizado',
                    'color' => '#84CC16',
                    'icon' => '🎨',
                    'description' => 'Variables personalizadas',
                    'default_ttl' => 7200 // 2 horas
                ]
            ];

            // Add count of variables per category
            $categoryCounts = Variable::selectRaw('category, COUNT(*) as count')
                ->groupBy('category')
                ->pluck('count', 'category')
                ->toArray();

            foreach ($categories as $key => &$category) {
                $category['count'] = $categoryCounts[$key] ?? 0;
            }

            // Cache for 1 hour
            Cache::put(self::CACHE_KEY_CATEGORIES, $categories, 3600);

            return response()->json($categories);

        } catch (\Exception $e) {
            Log::error('Error fetching categories', ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Error fetching categories',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all resolved variables for frontend consumption
     * OPTIMIZADO PARA SOLUCIONAR LENTITUD
     */
    public function resolved()
    {
        $startTime = microtime(true);
        
        try {
            // 1. Intentar obtener del cache primero
            $cacheKey = self::CACHE_KEY_ALL_RESOLVED;
            $cached = Cache::get($cacheKey);
            
            if ($cached && !request()->has('force_refresh')) {
                Log::info('Variables served from cache', [
                    'cache_key' => $cacheKey,
                    'execution_time' => (microtime(true) - $startTime) * 1000 . 'ms'
                ]);
                
                return response()->json([
                    'variables' => $cached,
                    'timestamp' => now()->toISOString(),
                    'cached' => true,
                    'execution_time' => (microtime(true) - $startTime) * 1000
                ]);
            }

            // 2. Si no está en cache, generar datos optimizados
            $variables = $this->getOptimizedVariables();
            
            // 3. Guardar en cache
            Cache::put($cacheKey, $variables, self::CACHE_TTL);
            
            // 4. Log de rendimiento
            $executionTime = (microtime(true) - $startTime) * 1000;
            Log::info('Variables resolved and cached', [
                'variable_count' => count($variables),
                'execution_time' => $executionTime . 'ms',
                'cache_key' => $cacheKey
            ]);

            return response()->json([
                'variables' => $variables,
                'timestamp' => now()->toISOString(),
                'cached' => false,
                'execution_time' => $executionTime
            ]);

        } catch (\Exception $e) {
            Log::error('Error resolving variables', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'execution_time' => (microtime(true) - $startTime) * 1000 . 'ms'
            ]);

            return response()->json([
                'error' => 'Failed to resolve variables',
                'message' => $e->getMessage(),
                'execution_time' => (microtime(true) - $startTime) * 1000
            ], 500);
        }
    }
  
    /**
     * Obtener variables optimizadas
     * CORREGIDO: Formato consistente para el frontend
     */
    private function getOptimizedVariables()
    {
        // Query optimizada con relaciones
        $variables = Variable::active()
            ->select(['id', 'key', 'value', 'type', 'category', 'config', 'cache_ttl', 'last_refreshed_at'])
            ->orderBy('category')
            ->orderBy('key')
            ->get();

        $result = [];
        $errors = [];

        foreach ($variables as $variable) {
            try {
                // Resolver variable con timeout
                $resolved = $this->resolveVariableWithTimeout($variable);
                
                // FORMATO SIMPLIFICADO: Solo devolver el valor resuelto
                $result[$variable->key] = $resolved;
                
            } catch (\Exception $e) {
                $errors[] = [
                    'key' => $variable->key,
                    'error' => $e->getMessage()
                ];
                
                // Fallback al valor estático
                $result[$variable->key] = $variable->value ?? '';
            }
        }

        if (!empty($errors)) {
            Log::warning('Some variables failed to resolve', ['errors' => $errors]);
        }

        return $result;
    }

    /**
     * Resolver variable con timeout para evitar bloqueos
     */
    private function resolveVariableWithTimeout(Variable $variable, $timeout = 5)
    {
        // Para variables estáticas, devolver directamente
        if ($variable->type === 'static') {
            return $variable->value;
        }

        // Para variables dinámicas, usar timeout
        $startTime = time();
        
        try {
            // Si la variable tiene cache TTL y aún es válida
            if ($variable->cache_ttl && $variable->last_refreshed_at) {
                $cacheExpiry = $variable->last_refreshed_at->addSeconds($variable->cache_ttl);
                if (now()->lt($cacheExpiry)) {
                    return $variable->value; // Usar valor cacheado
                }
            }

            // Resolver con timeout
            $resolved = $variable->resolve();
            
            // Verificar timeout
            if ((time() - $startTime) > $timeout) {
                throw new \Exception("Variable resolution timeout after {$timeout} seconds");
            }

            return $resolved;
            
        } catch (\Exception $e) {
            // En caso de error, usar valor fallback
            Log::warning("Variable {$variable->key} resolution failed", [
                'error' => $e->getMessage(),
                'execution_time' => (time() - $startTime) . 's'
            ]);
            
            return $variable->value; // Fallback
        }
    }

    /**
     * Invalidar cache cuando se actualiza una variable
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'key' => 'required|string|max:255|unique:variables,key',
                'value' => 'nullable',
                'type' => 'required|in:static,dynamic,external,computed',
                'category' => 'required|string|max:50',
                'description' => 'nullable|string',
                'cache_ttl' => 'nullable|integer|min:0',
                'refresh_strategy' => 'nullable|in:manual,scheduled,event_driven,real_time',
                'config' => 'nullable|array',
                'is_active' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Validar formato de key
            if (!Variable::validateKey($request->key)) {
                return response()->json([
                    'message' => 'Invalid key format. Use format: category.name',
                    'errors' => ['key' => ['Invalid key format']]
                ], 422);
            }

            $data = $validator->validated();
            
            if (Auth::check()) {
                $data['created_by'] = Auth::id();
                $data['updated_by'] = Auth::id();
            }

            $variable = Variable::create($data);

            // INVALIDAR CACHE
            $this->invalidateCache();

            return response()->json([
                'message' => 'Variable created successfully',
                'data' => $variable
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create variable',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar variable
     */
    public function update(Request $request, $id)
    {
        try {
            $variable = Variable::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'key' => 'required|string|max:255|unique:variables,key,' . $id,
                'value' => 'nullable',
                'type' => 'required|in:static,dynamic,external,computed',
                'category' => 'required|string|max:50',
                'description' => 'nullable|string',
                'cache_ttl' => 'nullable|integer|min:0',
                'refresh_strategy' => 'nullable|in:manual,scheduled,event_driven,real_time',
                'config' => 'nullable|array',
                'is_active' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $validator->validated();
            
            if (Auth::check()) {
                $data['updated_by'] = Auth::id();
            }

            $variable->update($data);

            // INVALIDAR CACHE
            $this->invalidateCache();

            return response()->json([
                'message' => 'Variable updated successfully',
                'data' => $variable->fresh()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update variable',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar variable
     */
    public function destroy($id)
    {
        try {
            $variable = Variable::findOrFail($id);
            $variable->delete();

            // INVALIDAR CACHE
            $this->invalidateCache();

            return response()->json([
                'message' => 'Variable deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete variable',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Refresh manual de una variable específica
     */
    public function refresh($id)
    {
        try {
            $variable = Variable::findOrFail($id);
            
            // Forzar actualización
            $resolved = $variable->resolve();
            
            $variable->update([
                'last_refreshed_at' => now(),
                'updated_by' => Auth::id()
            ]);

            // INVALIDAR CACHE
            $this->invalidateCache();

            return response()->json([
                'message' => 'Variable refreshed successfully',
                'data' => [
                    'key' => $variable->key,
                    'value' => $resolved,
                    'last_refreshed_at' => $variable->last_refreshed_at
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to refresh variable',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Endpoint para forzar limpieza de cache
     */
    public function clearCache()
    {
        $this->invalidateCache();
        
        return response()->json([
            'message' => 'Cache cleared successfully',
            'timestamp' => now()->toISOString()
        ]);
    }

    /**
     * Invalidar todo el cache de variables
     */
    private function invalidateCache()
    {
        Cache::forget(self::CACHE_KEY_ALL_RESOLVED);
        Cache::forget(self::CACHE_KEY_CATEGORIES);
        
        // También limpiar cache por tags si está disponible
        if (method_exists(Cache::store(), 'tags')) {
            Cache::tags(['variables'])->flush();
        }
        
        Log::info('Variable cache invalidated');
    }

    /**
     * Validar formato de key (debe ser category.name)
     */
    private function validateKey($key)
    {
        return preg_match('/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/i', $key);
    }

    /**
     * Test endpoint para validar variables
     */
    public function test(Request $request)
    {
        try {
            $key = $request->get('key');
            if (!$key) {
                return response()->json([
                    'error' => 'Key parameter is required'
                ], 400);
            }

            $variable = Variable::where('key', $key)->first();
            if (!$variable) {
                return response()->json([
                    'error' => 'Variable not found'
                ], 404);
            }

            $startTime = microtime(true);
            $resolvedValue = $variable->resolve();
            $executionTime = (microtime(true) - $startTime) * 1000;

            return response()->json([
                'key' => $key,
                'original_value' => $variable->value,
                'resolved_value' => $resolvedValue,
                'type' => $variable->type,
                'execution_time' => $executionTime . 'ms',
                'timestamp' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Test failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener información de cache para debug
     */
    public function cacheInfo()
    {
        $cacheKey = self::CACHE_KEY_ALL_RESOLVED;
        $cached = Cache::get($cacheKey);
        
        return response()->json([
            'cache_key' => $cacheKey,
            'cached' => $cached !== null,
            'cache_ttl' => self::CACHE_TTL,
            'variable_count' => $cached ? count($cached) : 0,
            'timestamp' => now()->toISOString()
        ]);
    }


}
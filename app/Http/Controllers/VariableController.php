<?php
// app/Http/Controllers/VariableController.php

namespace App\Http\Controllers;

use App\Models\Variable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class VariableController extends Controller
{
    /**
     * Display a listing of variables
     */
    public function index(Request $request)
    {
        try {
            $query = Variable::query();

            // Filter by category
            if ($request->has('category') && $request->category !== 'all') {
                $query->byCategory($request->category);
            }

            // Filter by type
            if ($request->has('type') && $request->type !== 'all') {
                $query->byType($request->type);
            }

            // Search by key or description
            if ($request->has('search') && $request->search) {
                $query->search($request->search);
            }

            // Sort
            $sortBy = $request->get('sort_by', 'key');
            $sortDirection = $request->get('sort_direction', 'asc');
            $query->orderBy($sortBy, $sortDirection);

            // Get results
            $variables = $query->get();

            return response()->json($variables);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching variables',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created variable
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'key' => 'required|string|unique:variables,key|max:255',
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

            // Validar key format
            if (!Variable::validateKey($request->key)) {
                return response()->json([
                    'message' => 'Invalid key format. Use format: category.name',
                    'errors' => ['key' => ['Invalid key format']]
                ], 422);
            }

            $data = $validator->validated();
            
            // Add user info if available
            if (Auth::check()) {
                $data['created_by'] = Auth::id();
                $data['updated_by'] = Auth::id();
            }

            $variable = Variable::create($data);

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
     * Display the specified variable
     */
    public function show($id)
    {
        try {
            $variable = Variable::findOrFail($id);

            // Include current resolved value
            try {
                $resolvedValue = $variable->resolve();
                $variable->resolved_value = $resolvedValue;
            } catch (\Exception $e) {
                $variable->resolved_value = null;
                $variable->resolve_error = $e->getMessage();
            }

            return response()->json($variable);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Variable not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update the specified variable
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

            // Validar key format
            if (!Variable::validateKey($request->key)) {
                return response()->json([
                    'message' => 'Invalid key format. Use format: category.name',
                    'errors' => ['key' => ['Invalid key format']]
                ], 422);
            }

            $data = $validator->validated();
            
            // Add user info if available
            if (Auth::check()) {
                $data['updated_by'] = Auth::id();
            }

            $variable->update($data);

            return response()->json([
                'message' => 'Variable updated successfully',
                'data' => $variable
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update variable',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified variable
     */
    public function destroy($id)
    {
        try {
            $variable = Variable::findOrFail($id);
            $variable->delete();

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
     * Get available categories
     */
    public function categories()
    {
        $categories = [
            'site' => [
                'name' => 'Sitio Web',
                'color' => '#3B82F6',
                'icon' => '🌐',
                'default_ttl' => null
            ],
            'contact' => [
                'name' => 'Contacto',
                'color' => '#10B981',
                'icon' => '📧',
                'default_ttl' => null
            ],
            'social' => [
                'name' => 'Redes Sociales',
                'color' => '#8B5CF6',
                'icon' => '📱',
                'default_ttl' => null
            ],
            'stats' => [
                'name' => 'Estadísticas',
                'color' => '#F59E0B',
                'icon' => '📊',
                'default_ttl' => 300
            ],
            'content' => [
                'name' => 'Contenido',
                'color' => '#EF4444',
                'icon' => '📝',
                'default_ttl' => 60
            ],
            'external' => [
                'name' => 'APIs Externas',
                'color' => '#6B7280',
                'icon' => '🌍',
                'default_ttl' => 1800
            ],
            'system' => [
                'name' => 'Sistema',
                'color' => '#374151',
                'icon' => '⚙️',
                'default_ttl' => 3600
            ],
            'custom' => [
                'name' => 'Personalizado',
                'color' => '#EC4899',
                'icon' => '🎨',
                'default_ttl' => null
            ]
        ];

        return response()->json($categories);
    }

    /**
     * Test a variable configuration
     */
    public function test(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'type' => 'required|in:static,dynamic,external,computed',
                'value' => 'nullable',
                'config' => 'nullable|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Create a temporary variable for testing
            $tempVariable = new Variable([
                'key' => 'test.variable',
                'type' => $request->type,
                'value' => $request->value,
                'config' => $request->config
            ]);

            // Try to resolve it
            $result = $tempVariable->resolve();

            return response()->json([
                'success' => true,
                'message' => 'Variable test successful',
                'result' => $result
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Variable test failed',
                'error' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Manually refresh a variable
     */
    public function refresh($id)
    {
        try {
            $variable = Variable::findOrFail($id);
            $result = $variable->resolve(true); // Force refresh

            return response()->json([
                'success' => true,
                'message' => 'Variable refreshed successfully',
                'result' => $result,
                'refreshed_at' => $variable->last_refreshed_at
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
     * Resolve a variable by key (for frontend)
     */
    public function resolve($key)
    {
        try {
            $variable = Variable::active()->where('key', $key)->firstOrFail();
            $result = $variable->resolve();

            return response()->json([
                'key' => $key,
                'value' => $result,
                'type' => $variable->type,
                'category' => $variable->category,
                'last_refreshed_at' => $variable->last_refreshed_at
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Variable not found or failed to resolve',
                'message' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Get all resolved variables for frontend consumption
     */
    public function resolved()
    {
        try {
            $variables = Variable::getAllForFrontend();

            return response()->json([
                'variables' => $variables,
                'timestamp' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to resolve variables',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
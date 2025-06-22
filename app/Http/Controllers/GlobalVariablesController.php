<?php

// app/Http/Controllers/GlobalVariablesController.php

namespace App\Http\Controllers;

use App\Models\GlobalVariable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class GlobalVariablesController extends Controller
{
    /**
     * Obtener todas las variables globales con filtros
     */
    public function index(Request $request)
    {
        try {
            $query = GlobalVariable::active();
            
            // Filtro por categoría
            if ($request->has('category') && $request->category !== 'all' && !empty($request->category)) {
                $query->byCategory($request->category);
            }
            
            // Búsqueda por nombre o descripción
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $query->where(function($q) use ($searchTerm) {
                    $q->where('name', 'like', '%' . $searchTerm . '%')
                      ->orWhere('description', 'like', '%' . $searchTerm . '%');
                });
            }
            
            // Ordenamiento
            $sortBy = $request->get('sort_by', 'category');
            $sortOrder = $request->get('sort_order', 'asc');
            
            if ($sortBy === 'category') {
                $query->orderBy('category', $sortOrder)->orderBy('name', 'asc');
            } else {
                $query->orderBy($sortBy, $sortOrder);
            }
            
            $variables = $query->get()->map(function ($variable) {
                return [
                    'id' => $variable->id,
                    'name' => $variable->name,
                    'value' => $variable->value,
                    'type' => $variable->type,
                    'category' => $variable->category,
                    'description' => $variable->description,
                    'created_at' => $variable->created_at->toISOString(),
                    'updated_at' => $variable->updated_at->toISOString()
                ];
            });

            return response()->json($variables);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error loading variables'], 500);
        }
    }

    /**
     * Obtener categorías disponibles
     */
    public function categories()
    {
        try {
            $categories = GlobalVariable::getCategories();
            $counts = GlobalVariable::getCategoryCounts();
            
            // Agregar conteos a cada categoría
            foreach ($categories as $key => &$category) {
                $category['count'] = $counts[$key] ?? 0;
            }
            
            return response()->json($categories);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error loading categories'], 500);
        }
    }

    /**
     * Obtener variables agrupadas por categoría
     */
    public function grouped()
    {
        try {
            $grouped = GlobalVariable::getGroupedByCategory();
            $categories = GlobalVariable::getCategories();
            
            $result = [];
            
            foreach ($categories as $categoryKey => $categoryData) {
                $variables = $grouped->get($categoryKey, collect())->map(function ($variable) {
                    return [
                        'id' => $variable->id,
                        'name' => $variable->name,
                        'value' => $variable->value,
                        'type' => $variable->type,
                        'category' => $variable->category,
                        'description' => $variable->description,
                        'created_at' => $variable->created_at->toISOString(),
                        'updated_at' => $variable->updated_at->toISOString()
                    ];
                });
                
                if ($variables->count() > 0) {
                    $result[$categoryKey] = [
                        'category_info' => $categoryData,
                        'variables' => $variables->toArray()
                    ];
                }
            }
            
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error loading grouped variables'], 500);
        }
    }

    /**
     * Crear nueva variable global
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|regex:/^[a-zA-Z_][a-zA-Z0-9_]*$/',
            'value' => 'required|string',
            'type' => 'required|in:string,number,boolean,array',
            'category' => 'required|string|in:design,content,site,media,seo,social,api,custom',
            'description' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        try {
            // Verificar que no exista una variable con el mismo nombre
            if (GlobalVariable::where('name', $request->name)->exists()) {
                return response()->json([
                    'error' => 'Variable name already exists'
                ], 409);
            }

            $variable = GlobalVariable::create([
                'name' => $request->name,
                'value' => $request->value,
                'type' => $request->type,
                'category' => $request->category,
                'description' => $request->description,
                'created_by_user_id' => Auth::id(),
                'is_active' => true
            ]);

            return response()->json([
                'id' => $variable->id,
                'name' => $variable->name,
                'value' => $variable->value,
                'type' => $variable->type,
                'category' => $variable->category,
                'description' => $variable->description,
                'created_at' => $variable->created_at->toISOString(),
                'updated_at' => $variable->updated_at->toISOString()
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error creating variable: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar variable existente
     */
    public function update(Request $request, GlobalVariable $globalVariable)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|regex:/^[a-zA-Z_][a-zA-Z0-9_]*$/',
            'value' => 'required|string',
            'type' => 'required|in:string,number,boolean,array',
            'category' => 'required|string|in:design,content,site,media,seo,social,api,custom',
            'description' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        try {
            // Verificar que no exista otra variable con el mismo nombre
            $existingVariable = GlobalVariable::where('name', $request->name)
                ->where('id', '!=', $globalVariable->id)
                ->first();

            if ($existingVariable) {
                return response()->json([
                    'error' => 'Variable name already exists'
                ], 409);
            }

            $globalVariable->update([
                'name' => $request->name,
                'value' => $request->value,
                'type' => $request->type,
                'category' => $request->category,
                'description' => $request->description
            ]);

            return response()->json([
                'id' => $globalVariable->id,
                'name' => $globalVariable->name,
                'value' => $globalVariable->value,
                'type' => $globalVariable->type,
                'category' => $globalVariable->category,
                'description' => $globalVariable->description,
                'created_at' => $globalVariable->created_at->toISOString(),
                'updated_at' => $globalVariable->updated_at->toISOString()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error updating variable: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar variable
     */
    public function destroy(GlobalVariable $globalVariable)
    {
        try {
            $globalVariable->delete();
            
            return response()->json([
                'message' => 'Variable deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error deleting variable: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener variables para usar en Blade (formato optimizado)
     */
    public function forBlade()
    {
        try {
            $variables = GlobalVariable::getAllForBlade();
            return response()->json($variables);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error loading variables for Blade'], 500);
        }
    }

    /**
     * Validar formato de variable
     */
    public function validate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|regex:/^[a-zA-Z_][a-zA-Z0-9_]*$/',
            'value' => 'required|string',
            'type' => 'required|in:string,number,boolean,array',
            'category' => 'required|string|in:design,content,site,media,seo,social,api,custom'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'valid' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Validaciones adicionales según el tipo
        $type = $request->type;
        $value = $request->value;

        try {
            switch ($type) {
                case 'number':
                    if (!is_numeric($value)) {
                        throw new \Exception('Value must be numeric');
                    }
                    break;

                case 'boolean':
                    if (!in_array(strtolower($value), ['true', 'false', '1', '0'])) {
                        throw new \Exception('Value must be true or false');
                    }
                    break;

                case 'array':
                    // Intentar parsear el array
                    if (str_starts_with(trim($value), '[')) {
                        json_decode($value);
                        if (json_last_error() !== JSON_ERROR_NONE) {
                            throw new \Exception('Invalid JSON array format');
                        }
                    }
                    break;
            }

            return response()->json([
                'valid' => true,
                'message' => 'Variable format is valid'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'valid' => false,
                'error' => $e->getMessage()
            ], 422);
        }
    }
}
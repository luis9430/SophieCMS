<?php

// app/Http/Controllers/GlobalVariablesController.php

namespace App\Http\Controllers;

use App\Models\GlobalVariable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use App\Services\DesignSystemService;
use App\Services\TailwindColorService;

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
                    // ✅ AGREGAR: Incluir metadata
                    'metadata' => $variable->metadata,
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
                        // ✅ AGREGAR: También incluir metadata aquí
                        'metadata' => $variable->metadata,
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

    public function store(Request $request)
    {
        // Si es un design token, usar métodos específicos
        if ($request->type === 'color_palette') {
            return $this->createColorPalette($request);
        }
        
        if ($request->type === 'typography_system') {
            return $this->createTypographySystem($request);
        }

        // Para otros tipos, usar el método original
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|regex:/^[a-zA-Z_][a-zA-Z0-9_]*$/',
            'value' => 'required|string',
            // ✅ VERIFICAR: Que incluya los nuevos tipos
            'type' => 'required|in:string,number,boolean,array,color_palette,typography_system',
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
                'metadata' => $variable->metadata,
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
            // ✅ CORREGIR: Incluir los nuevos tipos
            'type' => 'required|in:string,number,boolean,array,color_palette,typography_system',
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
                // ✅ AGREGAR: Incluir metadata también en update
                'metadata' => $globalVariable->metadata,
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
            // ✅ CORREGIR: Incluir los nuevos tipos
            'type' => 'required|in:string,number,boolean,array,color_palette,typography_system',
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

                // ✅ AGREGAR: Validaciones para los nuevos tipos
                case 'color_palette':
                    // Validar que sea un color hex válido
                    if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $value)) {
                        throw new \Exception('Value must be a valid hex color (e.g., #FF0000)');
                    }
                    break;

                case 'typography_system':
                    // Validar que sea un nombre de fuente válido
                    if (empty(trim($value))) {
                        throw new \Exception('Font family name cannot be empty');
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



        public function createColorPalette(Request $request)
        {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255|regex:/^[a-zA-Z_][a-zA-Z0-9_]*$/',
                'base_color' => 'required|regex:/^#[0-9A-Fa-f]{6}$/',
                'palette_name' => 'nullable|string|max:50',
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

                $variable = DesignSystemService::createColorVariable(
                    $request->name,
                    $request->base_color,
                    $request->palette_name
                );

                if ($request->description) {
                    $variable->update(['description' => $request->description]);
                }

                return response()->json([
                    'message' => 'Color palette created successfully',
                    'variable' => [
                        'id' => $variable->id,
                        'name' => $variable->name,
                        'value' => $variable->value,
                        'type' => $variable->type,
                        'category' => $variable->category,
                        'description' => $variable->description,
                        'metadata' => $variable->metadata,
                        'created_at' => $variable->created_at->toISOString()
                    ]
                ], 201);

            } catch (\Exception $e) {
                \Log::error('Error creating color palette: ' . $e->getMessage());
                return response()->json([
                    'error' => 'Error creating color palette: ' . $e->getMessage()
                ], 500);
            }
        }

        /**
         * Crear variable de tipografía con escala automática
         */
        public function createTypographySystem(Request $request)
        {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255|regex:/^[a-zA-Z_][a-zA-Z0-9_]*$/',
                'primary_font' => 'required|string|max:100',
                'secondary_font' => 'nullable|string|max:100',
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

                $variable = DesignSystemService::createTypographyVariable(
                    $request->name,
                    $request->primary_font,
                    $request->secondary_font
                );

                if ($request->description) {
                    $variable->update(['description' => $request->description]);
                }

                return response()->json([
                    'message' => 'Typography system created successfully',
                    'variable' => [
                        'id' => $variable->id,
                        'name' => $variable->name,
                        'value' => $variable->value,
                        'type' => $variable->type,
                        'category' => $variable->category,
                        'description' => $variable->description,
                        'metadata' => $variable->metadata,
                        'created_at' => $variable->created_at->toISOString()
                    ]
                ], 201);

            } catch (\Exception $e) {
                \Log::error('Error creating typography system: ' . $e->getMessage());
                return response()->json([
                    'error' => 'Error creating typography system: ' . $e->getMessage()
                ], 500);
            }
        }

        /**
         * Previsualizar paleta de colores antes de guardar
         */
        public function previewColorPalette(Request $request)
        {
            $validator = Validator::make($request->all(), [
                'base_color' => 'required|regex:/^#[0-9A-Fa-f]{6}$/',
                'name' => 'nullable|string|max:50'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'messages' => $validator->errors()
                ], 422);
            }

            try {
                $palette = DesignSystemService::generateColorPalette(
                    $request->base_color,
                    $request->name ?: 'preview'
                );

                return response()->json([
                    'palette' => $palette,
                    'contrast_info' => [
                        'white_text' => TailwindColorService::getContrastRatio($request->base_color, '#FFFFFF'),
                        'black_text' => TailwindColorService::getContrastRatio($request->base_color, '#000000'),
                        'wcag_compliant_white' => TailwindColorService::isWcagCompliant($request->base_color, '#FFFFFF'),
                        'wcag_compliant_black' => TailwindColorService::isWcagCompliant($request->base_color, '#000000')
                    ]
                ]);

            } catch (\Exception $e) {
                return response()->json([
                    'error' => 'Error generating palette preview: ' . $e->getMessage()
                ], 500);
            }
        }

        /**
         * Previsualizar sistema tipográfico
         */
        public function previewTypographySystem(Request $request)
        {
            $validator = Validator::make($request->all(), [
                'primary_font' => 'required|string|max:100',
                'secondary_font' => 'nullable|string|max:100'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'messages' => $validator->errors()
                ], 422);
            }

            try {
                $typography = DesignSystemService::generateTypographySystem(
                    $request->primary_font,
                    $request->secondary_font
                );

                return response()->json([
                    'typography' => $typography,
                    'font_validation' => [
                        'primary_available' => DesignSystemService::validateFont($request->primary_font),
                        'secondary_available' => $request->secondary_font ? DesignSystemService::validateFont($request->secondary_font) : true
                    ]
                ]);

            } catch (\Exception $e) {
                return response()->json([
                    'error' => 'Error generating typography preview: ' . $e->getMessage()
                ], 500);
            }
        }

        /**
         * Obtener CSS completo de design tokens para preview
         */
        public function getDesignTokensCSS()
        {
            try {
                $css = DesignSystemService::exportAllAsCSS();
                
                return response($css)
                    ->header('Content-Type', 'text/css')
                    ->header('Cache-Control', 'public, max-age=3600');

            } catch (\Exception $e) {
                return response()->json([
                    'error' => 'Error generating CSS: ' . $e->getMessage()
                ], 500);
            }
        }

        /**
         * Obtener presets de fuentes disponibles
         */
        public function getFontPresets()
        {
            try {
                return response()->json([
                    'presets' => DesignSystemService::getFontPresets(),
                    'popular_fonts' => [
                        'sans_serif' => ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins'],
                        'serif' => ['Playfair Display', 'Merriweather', 'Lora', 'Crimson Text'],
                        'mono' => ['JetBrains Mono', 'Fira Code', 'Source Code Pro', 'Monaco']
                    ]
                ]);

            } catch (\Exception $e) {
                return response()->json([
                    'error' => 'Error loading font presets: ' . $e->getMessage()
                ], 500);
            }
        }


}
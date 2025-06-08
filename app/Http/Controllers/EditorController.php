<?php

namespace App\Http\Controllers;

use App\Models\Template;
use App\Models\User;
use Illuminate\Http\Request;

class EditorController extends Controller
{
    /**
     * Mostrar el editor con datos iniciales
     */
    public function index()
    {
        $user = auth()->user();
        
        // Datos iniciales que se pasarán a Alpine.js
        $initialData = [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'templates' => Template::forUser($user->id)
                ->latest()
                ->take(10)
                ->get(['id', 'name', 'type', 'created_at']),
            'stats' => [
                'total_templates' => Template::forUser($user->id)->count(),
                'total_users' => User::count(),
                'recent_templates' => Template::forUser($user->id)
                    ->where('created_at', '>=', now()->subDays(7))
                    ->count(),
            ],
            'config' => [
                'auto_save_delay' => 3000,
                'max_templates' => 50,
            ]
        ];

        return view('editor.index', compact('initialData'));
    }

    /**
     * API: Obtener templates del usuario
     */
    public function getTemplates(Request $request)
    {
        $templates = Template::forUser(auth()->id())
            ->when($request->search, function($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->when($request->type, function($query, $type) {
                $query->where('type', $type);
            })
            ->latest()
            ->paginate(20);

        return response()->json($templates);
    }

    /**
     * API: Crear template
     */
    public function storeTemplate(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string',
            'type' => 'required|in:html,css,js'
        ]);

        $template = Template::create([
            ...$validated,
            'user_id' => auth()->id()
        ]);

        return response()->json([
            'success' => true,
            'template' => $template
        ]);
    }

    /**
     * API: Actualizar template
     */
    public function updateTemplate(Request $request, Template $template)
    {
        // Verificar ownership
        if ($template->user_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => 'sometimes|string',
            'type' => 'sometimes|in:html,css,js'
        ]);

        $template->update($validated);

        return response()->json([
            'success' => true,
            'template' => $template
        ]);
    }

    /**
     * API: Eliminar template
     */
    public function deleteTemplate(Template $template)
    {
        if ($template->user_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $template->delete();

        return response()->json(['success' => true]);
    }

    /**
     * API: Obtener usuarios (para admin o stats)
     */
    public function getUsers(Request $request)
    {
        $users = User::select('id', 'name', 'email', 'created_at')
            ->when($request->search, function($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(15);

        return response()->json($users);
    }

    /**
     * API: Estadísticas generales
     */
    public function getStats()
    {
        return response()->json([
            'total_templates' => Template::count(),
            'total_users' => User::count(),
            'templates_today' => Template::whereDate('created_at', today())->count(),
            'templates_this_week' => Template::where('created_at', '>=', now()->subWeek())->count(),
            'user_templates' => Template::forUser(auth()->id())->count(),
        ]);
    }
}

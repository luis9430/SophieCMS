<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error en Preview</title>
    @vite(['resources/css/app.css'])
</head>
<body class="bg-gray-100 p-8">
    <div class="max-w-2xl mx-auto">
        <div class="bg-red-50 border border-red-200 rounded-lg p-6">
            <div class="flex items-center mb-4">
                <div class="text-red-500 text-2xl mr-3">❌</div>
                <h1 class="text-xl font-bold text-red-800">Error en la Vista Previa</h1>
            </div>
            
            <div class="mb-4">
                <h2 class="font-semibold text-red-700 mb-2">Componente:</h2>
                <p class="text-gray-700">{{ $component->name ?? 'Componente desconocido' }}</p>
                @if(isset($component->id))
                    <p class="text-sm text-gray-500">ID: {{ $component->id }}</p>
                @endif
            </div>
            
            <div class="mb-6">
                <h2 class="font-semibold text-red-700 mb-2">Error:</h2>
                <div class="bg-white border border-red-200 rounded p-3">
                    <code class="text-sm text-red-600">{{ $error }}</code>
                </div>
            </div>
            
            <div class="text-center">
                <button onclick="window.location.reload()" 
                        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors mr-2">
                    🔄 Intentar de Nuevo
                </button>
                
                <button onclick="window.close()" 
                        class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors">
                    ✕ Cerrar Ventana
                </button>
            </div>
        </div>
    </div>
</body>
</html>
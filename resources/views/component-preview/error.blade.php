<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Component Error</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-red-50 min-h-screen">
    <div class="min-h-screen flex items-center justify-center p-4">
        <div class="bg-white border border-red-200 rounded-lg shadow-lg p-6 max-w-md w-full">
            <div class="flex items-center mb-4">
                <div class="bg-red-100 rounded-full p-2 mr-3">
                    <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold text-red-800">Error en el Componente</h3>
            </div>
            <div class="bg-red-50 border border-red-200 rounded p-3 mb-4">
                <p class="text-red-700 text-sm font-mono">{{ $errorMessage }}</p>
            </div>
            <p class="text-red-600 text-sm">
                Revisa la sintaxis del código Blade y verifica que todas las variables estén definidas.
            </p>
        </div>
    </div>
</body>
</html>
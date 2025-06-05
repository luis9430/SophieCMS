<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preact Page Builder - SophieCMS</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    
    {{-- Vite assets --}}
    @vite(['resources/css/app.css', 'resources/js/preact-app.jsx'])
    
    <style>
        /* Asegurar que el contenedor ocupe toda la altura */
        html, body {
            height: 100%;
            margin: 0;
            padding: 0;
        }
        
        #preact-page-builder {
            height: 100vh;
            overflow: hidden;
        }
        
        /* Loading placeholder */
        .loading-placeholder {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: #f8f9fa;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #e9ecef;
            border-top: 4px solid #228be6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body class="mantine-page-builder">
    {{-- Contenedor para el Page Builder de Preact --}}
    <div id="preact-page-builder">
        {{-- Loading placeholder mientras carga Preact --}}
        <div class="loading-placeholder">
            <div style="text-align: center;">
                <div class="loading-spinner"></div>
                <p style="margin-top: 1rem; color: #868e96;">
                    Cargando Page Builder...
                </p>
            </div>
        </div>
    </div>

    <script>
        // Inicializar cuando el DOM esté listo
        document.addEventListener('DOMContentLoaded', function() {
            // Dar tiempo a que Vite cargue los módulos
            setTimeout(() => {
                if (window.initPreactPageBuilder) {
                    window.initPreactPageBuilder();
                } else {
                    console.error('❌ initPreactPageBuilder no está disponible');
                }
            }, 100);
        });

        // También intentar inicializar cuando se carguen los assets
        window.addEventListener('load', function() {
            if (window.initPreactPageBuilder && document.getElementById('preact-page-builder').children.length === 1) {
                window.initPreactPageBuilder();
            }
        });
    </script>
</body>
</html>
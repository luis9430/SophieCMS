<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview: {{ $component->name }}</title>
    
    <!-- ✅ Assets normales via Vite - SIN complicaciones -->
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    
    <style>
        body {
            margin: 0;
            padding: 1rem;
            font-family: system-ui, -apple-system, sans-serif;
            background: #f8fafc;
        }
        
        .preview-container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .preview-header {
            background: white;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-bottom: 2rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .preview-content {
            background: white;
            padding: 2rem;
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            min-height: 400px;
        }
        
        .preview-info {
            background: #f3f4f6;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-top: 2rem;
            font-size: 0.875rem;
            color: #6b7280;
        }
        
        .library-badge {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
            margin-right: 0.5rem;
            margin-bottom: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        <!-- Header con información del componente -->
        <div class="preview-header">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-xl font-bold text-gray-900">{{ $component->name }}</h1>
                    <p class="text-gray-600">{{ $component->description ?? 'Vista previa del componente' }}</p>
                </div>
                <div class="text-right">
                    <div class="text-sm text-gray-500">ID: {{ $component->id }}</div>
                    <div class="text-sm text-gray-500">Versión: {{ $component->version ?? '1.0.0' }}</div>
                </div>
            </div>
        </div>
        
        <!-- Contenido del componente renderizado -->
        <div class="preview-content">
            {!! $renderedComponent !!}
        </div>
        
        <!-- Información adicional -->
        <div class="preview-info">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h3 class="font-semibold text-gray-800 mb-2">Librerías detectadas:</h3>
                    @if(count($requiredLibraries) > 0)
                        @foreach($requiredLibraries as $library)
                            <span class="library-badge">{{ ucfirst($library) }}</span>
                        @endforeach
                    @else
                        <span class="text-gray-500">Ninguna librería externa detectada</span>
                    @endif
                </div>
                
                <div>
                    <h3 class="font-semibold text-gray-800 mb-2">Datos de prueba:</h3>
                    <div class="text-xs">
                        @foreach(['title', 'description', 'image', 'button_text'] as $key)
                            @if(isset($testData[$key]))
                                <div><strong>{{ $key }}:</strong> {{ Str::limit($testData[$key], 50) }}</div>
                            @endif
                        @endforeach
                    </div>
                </div>
            </div>
            
            <div class="mt-4 text-center">
                <button onclick="window.location.reload()" 
                        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                    🔄 Refrescar Preview
                </button>
                
                <button onclick="window.close()" 
                        class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors ml-2">
                    ✕ Cerrar Ventana
                </button>
            </div>
        </div>
    </div>

    <!-- ✅ Script super simple para inicialización -->
<script>
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🖼️ Preview window loaded successfully');
            console.log('📚 Required libraries:', @json($requiredLibraries));
            console.log('🔧 Alpine version:', window.Alpine?.version || 'Not loaded');
            console.log('✨ GSAP available:', typeof window.gsap !== 'undefined');
            
            // FORZAR RE-SCAN DE ALPINE DESPUÉS DE 2 SEGUNDOS
            setTimeout(() => {
                console.log('🔄 Forcing Alpine re-scan...');
                
                // Re-escanear elementos Alpine
                if (window.Alpine && window.Alpine.initTree) {
                    try {
                        window.Alpine.initTree(document.body);
                        console.log('✅ Alpine re-scan completed');
                    } catch (error) {
                        console.error('❌ Alpine re-scan failed:', error);
                    }
                }
                
                // Debug después del re-scan
                setTimeout(() => {
                    const alpineElements = document.querySelectorAll('[x-data]');
                    console.log(`🎿 Found ${alpineElements.length} Alpine elements after re-scan`);
                    
                    alpineElements.forEach((el, index) => {
                        console.log(`Element ${index}:`, {
                            xData: el.getAttribute('x-data'),
                            hasAlpineData: !!el._x_dataStack,
                            opacity: window.getComputedStyle(el).opacity,
                            display: window.getComputedStyle(el).display
                        });
                        
                        // Si el elemento no tiene Alpine data, forzar inicialización
                        if (!el._x_dataStack && window.Alpine) {
                            console.log('🔧 Forcing element initialization...');
                            window.Alpine.initTree(el);
                        }
                    });
                }, 500);
                
            }, 2000);
        });
    </script>
</body>
</html>
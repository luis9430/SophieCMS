{{-- resources/views/component-preview/window-with-data.blade.php --}}
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Preview: {{ $component->name }} - Con Props</title>
    
    {{-- CSP Header --}}
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'nonce-{{ $nonce }}' https://cdn.tailwindcss.com https://unpkg.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://unpkg.com; font-src 'self' data: https:; img-src 'self' data: https:; connect-src 'self';">
    
    {{-- Tailwind CSS --}}
    <script nonce="{{ $nonce }}" src="https://cdn.tailwindcss.com"></script>
    
    {{-- Alpine.js --}}
    <script nonce="{{ $nonce }}" defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
    
    {{-- Librerías detectadas dinámicamente --}}
    @if(in_array('gsap', $requiredLibraries))
        <script nonce="{{ $nonce }}" src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    @endif
    
    @if(in_array('swiper', $requiredLibraries))
        <link rel="stylesheet" href="https://unpkg.com/swiper@11/swiper-bundle.min.css">
        <script nonce="{{ $nonce }}" src="https://unpkg.com/swiper@11/swiper-bundle.min.js"></script>
    @endif
    
    <style>
        body { 
            font-family: 'Inter', system-ui, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .preview-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .props-info {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
    </style>
</head>
<body>
    <div class="container mx-auto px-4 py-8">
        <!-- Header con info de props -->
        <div class="text-center mb-6">
            <div class="inline-flex items-center px-4 py-2 props-info text-white mb-4">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
                Preview con Props: {{ $component->name }}
            </div>
            
            @if(!empty($testData))
                <div class="props-info text-white p-3 mb-4 inline-block">
                    <div class="text-sm font-medium mb-2">📊 Props aplicados:</div>
                    <div class="grid grid-cols-2 gap-2 text-xs">
                        @foreach($testData as $key => $value)
                            <div class="flex justify-between">
                                <span class="font-mono">{{ $key }}:</span>
                                <span class="ml-2">
                                    @if(is_array($value))
                                        {{ json_encode($value) }}
                                    @elseif(is_bool($value))
                                        {{ $value ? 'true' : 'false' }}
                                    @else
                                        "{{ $value }}"
                                    @endif
                                </span>
                            </div>
                        @endforeach
                    </div>
                </div>
            @endif
        </div>

        <!-- Preview del componente -->
        <div class="preview-container p-8 mb-6">
            <div class="text-center mb-6">
                <h2 class="text-xl font-semibold text-gray-800 mb-2">{{ $component->name }}</h2>
                <p class="text-gray-600">{{ $component->description ?: 'Vista previa del componente' }}</p>
            </div>
            
            <!-- Componente renderizado -->
            <div class="component-output border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                {!! $renderedComponent !!}
            </div>
        </div>

        <!-- Info adicional -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Librerías detectadas -->
            <div class="bg-white/90 backdrop-blur-sm rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
                    </svg>
                    Librerías Cargadas
                </h3>
                
                @if(!empty($requiredLibraries))
                    <div class="space-y-2">
                        @foreach($requiredLibraries as $library)
                            <div class="flex items-center">
                                <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                <span class="text-sm capitalize">{{ $library }}</span>
                            </div>
                        @endforeach
                    </div>
                @else
                    <p class="text-gray-500 text-sm">Solo librerías básicas (Alpine.js, Tailwind)</p>
                @endif
            </div>

            <!-- Información del componente -->
            <div class="bg-white/90 backdrop-blur-sm rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Info del Componente
                </h3>
                
                <div class="space-y-2 text-sm">
                    <div><strong>ID:</strong> {{ $component->identifier }}</div>
                    <div><strong>Categoría:</strong> {{ ucfirst($component->category) }}</div>
                    <div><strong>Versión:</strong> {{ $component->version }}</div>
                    <div><strong>Props activos:</strong> {{ count($testData) }}</div>
                </div>
            </div>
        </div>

        <!-- Acciones -->
        <div class="text-center mt-8">
            <div class="inline-flex items-center space-x-4 props-info rounded-full px-6 py-3">
                <button onclick="window.location.reload()" 
                        class="flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Recargar
                </button>
                
                <button onclick="window.close()" 
                        class="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    Cerrar
                </button>
                
                <button onclick="window.print()" 
                        class="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                    </svg>
                    Imprimir
                </button>
            </div>
        </div>

        <!-- Footer -->
        <div class="text-center mt-6 text-white/60 text-sm">
            <p>🎭 Preview con Props Personalizados</p>
            <p class="mt-1">Los datos mostrados son solo para testing</p>
        </div>
    </div>

    <!-- Scripts adicionales -->
    <script nonce="{{ $nonce }}">
        // Verificar librerías cargadas
        console.log('🔧 Preview con props cargado');
        console.log('📊 Test Data:', @json($testData));
        console.log('📚 Librerías detectadas:', @json($requiredLibraries));
        
        // Verificar Alpine.js
        document.addEventListener('alpine:init', () => {
            console.log('✅ Alpine.js inicializado');
        });

        // Verificar GSAP si está cargado
        @if(in_array('gsap', $requiredLibraries))
        if (typeof gsap !== 'undefined') {
            console.log('✅ GSAP cargado correctamente');
            
            // Animación de entrada
            gsap.from('.preview-container', {
                duration: 0.8,
                y: 50,
                opacity: 0,
                ease: 'power2.out'
            });
        }
        @endif

        // Log de errores
        window.addEventListener('error', function(e) {
            console.error('❌ Error en preview:', e.error);
        });
    </script>
</body>
</html>
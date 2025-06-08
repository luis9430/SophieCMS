// hooks/useAlpinePreview.js
import { useCallback } from 'preact/hooks';

export const useAlpinePreview = () => {
    
    /**
     * Genera HTML completo con Alpine.js y Tailwind CSS integrados
     */
    const generatePreviewHTML = useCallback((processedCode) => {
        if (!processedCode) return '';

        // 🎯 HTML BASE CON ALPINE.JS Y TAILWIND CSS
        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview - Alpine.js + Tailwind CSS</title>
    
    <!-- 🎨 TAILWIND CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- ⚡ ALPINE.JS -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    
    <style>
        /* 🎨 ESTILOS BASE PARA EL PREVIEW */
        body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
        
        /* 🔧 CLASES PERSONALIZADAS PARA ALPINE */
        [x-cloak] { 
            display: none !important; 
        }
        
        /* 🎯 ANIMACIONES SUAVES */
        .transition-all {
            transition: all 0.3s ease;
        }
        
        /* 📱 RESPONSIVE MEJORADO */
        @media (max-width: 640px) {
            .container {
                padding-left: 1rem;
                padding-right: 1rem;
            }
        }
        
        /* 🎪 EFECTOS HOVER MEJORADOS */
        .hover-lift:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        
        /* 🌟 GRADIENTES PERSONALIZADOS */
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        /* 🎭 SOMBRAS MODERNAS */
        .modern-shadow {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .modern-shadow-lg {
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
    </style>
    
    <script>
        // 🔧 CONFIGURACIÓN DE TAILWIND PERSONALIZADA
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'custom-blue': '#3B82F6',
                        'custom-purple': '#8B5CF6',
                        'custom-pink': '#EC4899',
                    },
                    fontFamily: {
                        'sans': ['Inter', 'system-ui', 'sans-serif'],
                    },
                    animation: {
                        'bounce-slow': 'bounce 2s infinite',
                        'pulse-fast': 'pulse 1s infinite',
                    }
                }
            }
        }
        
        // 🎯 FUNCIONES HELPER PARA ALPINE
        document.addEventListener('alpine:init', () => {
            // 📊 Store global para datos compartidos
            Alpine.store('global', {
                theme: 'light',
                user: {
                    name: 'Usuario Demo',
                    email: 'usuario@demo.com',
                    avatar: '👤'
                },
                toggleTheme() {
                    this.theme = this.theme === 'light' ? 'dark' : 'light';
                }
            });
            
            // 🔧 Datos reactivos globales
            Alpine.data('counter', () => ({
                count: 0,
                increment() { this.count++ },
                decrement() { this.count-- },
                reset() { this.count = 0 }
            }));
            
            // 🎪 Componente modal reutilizable
            Alpine.data('modal', () => ({
                open: false,
                show() { this.open = true },
                hide() { this.open = false },
                toggle() { this.open = !this.open }
            }));
            
            // 📝 Componente formulario
            Alpine.data('form', () => ({
                fields: {},
                errors: {},
                submitted: false,
                validate() {
                    this.errors = {};
                    // Lógica de validación aquí
                    return Object.keys(this.errors).length === 0;
                },
                submit() {
                    if (this.validate()) {
                        this.submitted = true;
                        console.log('Formulario enviado:', this.fields);
                    }
                },
                reset() {
                    this.fields = {};
                    this.errors = {};
                    this.submitted = false;
                }
            }));
        });
        
        // 🎨 UTILIDADES JAVASCRIPT PARA EL PREVIEW
        window.previewUtils = {
            // 🎯 Formatear fechas
            formatDate(date = new Date()) {
                return date.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            },
            
            // ⏰ Formatear tiempo
            formatTime(date = new Date()) {
                return date.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            },
            
            // 🎨 Generar colores aleatorios
            randomColor() {
                const colors = ['blue', 'green', 'purple', 'pink', 'indigo', 'red', 'yellow'];
                return colors[Math.floor(Math.random() * colors.length)];
            },
            
            // 📱 Detectar dispositivo móvil
            isMobile() {
                return window.innerWidth < 768;
            },
            
            // 🎪 Animación de confetti simple
            celebrate() {
                console.log('🎉 ¡Celebrando!');
                // Aquí podrías integrar una librería de confetti
            }
        };
    </script>
</head>

<body class="bg-gray-50">
    <!-- 🚀 CONTENIDO PRINCIPAL DEL PREVIEW -->
    <div id="preview-content">
        ${processedCode}
    </div>
    
    <!-- 🔧 DEBUG INFO (solo en desarrollo) -->
    <div x-data="{ showDebug: false }" class="fixed bottom-4 right-4 z-50">
        <button 
            @click="showDebug = !showDebug"
            class="bg-gray-800 text-white px-3 py-2 rounded-full text-xs font-mono hover:bg-gray-700 transition-colors"
            title="Debug Alpine.js"
        >
            🔧
        </button>
        
        <div x-show="showDebug" x-transition class="absolute bottom-12 right-0 bg-white border rounded-lg shadow-lg p-4 min-w-[200px] text-xs">
            <h4 class="font-bold mb-2">Debug Info:</h4>
            <p><strong>Alpine:</strong> <span class="text-green-600">✅ Cargado</span></p>
            <p><strong>Tailwind:</strong> <span class="text-green-600">✅ Cargado</span></p>
            <p><strong>Viewport:</strong> <span x-text="window.innerWidth + 'x' + window.innerHeight"></span></p>
            <p><strong>Tiempo:</strong> <span x-text="new Date().toLocaleTimeString()"></span></p>
        </div>
    </div>
    
    <!-- 📱 INDICADOR DE CARGA (opcional) -->
    <div x-data="{ loading: true }" x-init="setTimeout(() => loading = false, 500)">
        <div x-show="loading" x-transition class="fixed inset-0 bg-white flex items-center justify-center z-50">
            <div class="text-center">
                <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p class="text-gray-600">Cargando preview...</p>
            </div>
        </div>
    </div>
</body>
</html>`;
    }, []);

    /**
     * Procesa el código reemplazando variables Y añadiendo funcionalidades Alpine
     */
    const processCodeWithAlpine = useCallback((code, variables = {}) => {
        if (!code) return '';

        try {
            let processedCode = code;
            
            // 🔄 REEMPLAZAR VARIABLES PERSONALIZADAS
            const defaultVars = {
                'user.name': 'Juan Pérez',
                'user.email': 'juan@ejemplo.com',
                'user.id': '12345',
                'app.name': 'Mi Aplicación',
                'current.date': new Date().toLocaleDateString('es-ES'),
                'current.time': new Date().toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }),
                ...variables
            };
            
            // Reemplazar variables {{ variable }}
            processedCode = processedCode.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, variable) => {
                const cleanVar = variable.trim();
                
                // Manejar filtros simples como {{ user.name | first_letter }}
                if (cleanVar.includes('|')) {
                    const [varName, filter] = cleanVar.split('|').map(s => s.trim());
                    const value = defaultVars[varName] || varName;
                    
                    switch (filter) {
                        case 'first_letter':
                            return typeof value === 'string' ? value.charAt(0).toUpperCase() : value;
                        case 'uppercase':
                            return typeof value === 'string' ? value.toUpperCase() : value;
                        case 'lowercase':
                            return typeof value === 'string' ? value.toLowerCase() : value;
                        default:
                            return value;
                    }
                }
                
                return defaultVars[cleanVar] !== undefined ? defaultVars[cleanVar] : match;
            });
            
            // 🎯 AÑADIR CLASES DE ALPINE AUTOMÁTICAMENTE
            // Añadir x-cloak a elementos con Alpine para evitar flash
            processedCode = processedCode.replace(
                /(<[^>]+x-data[^>]*>)/g, 
                '$1'.replace('>', ' x-cloak>')
            );
            
            // 🚀 GENERAR HTML COMPLETO
            return generatePreviewHTML(processedCode);
            
        } catch (error) {
            console.error('Error procesando código con Alpine:', error);
            return generatePreviewHTML(`
                <div class="p-8 bg-red-50 border border-red-200 rounded-lg m-4">
                    <h2 class="text-xl font-bold text-red-800 mb-4">❌ Error en el Preview</h2>
                    <p class="text-red-700 mb-2">Hubo un problema procesando el código:</p>
                    <code class="text-sm bg-red-100 p-2 rounded block text-red-800">${error.message}</code>
                    <button onclick="location.reload()" class="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                        🔄 Recargar Preview
                    </button>
                </div>
            `);
        }
    }, [generatePreviewHTML]);

    return {
        processCodeWithAlpine,
        generatePreviewHTML
    };
};
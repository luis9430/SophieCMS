// ===================================================================
// hooks/useAlpinePreview.js - REFACTORIZADO con variableProcessor
// Responsabilidad: Preview HTML + GSAP (USA variableProcessor)
// ===================================================================

import { useCallback } from 'preact/hooks';

// 🎯 IMPORTAR SISTEMA UNIFICADO DE VARIABLES
import { 
    processVariables, 
    getAvailableVariables,
    validateVariable 
} from '../utils/variableProcessor.js';

export const useAlpinePreview = () => {
    
    /**
     * Genera HTML completo con Alpine.js, Tailwind CSS y GSAP integrados
     */
    const generatePreviewHTML = useCallback((processedCode) => {
        if (!processedCode) return '';

        // 🎯 HTML BASE CON ALPINE.JS, TAILWIND CSS Y GSAP
        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview - Alpine.js + Tailwind CSS + GSAP</title>
    
    <!-- 🎨 TAILWIND CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- ⚡ ALPINE.JS -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    
    <!-- 🎬 GSAP CORE + SCROLLTRIGGER -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
    
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

        /* 🎬 GSAP ANIMATION UTILITIES */
        .gsap-fade-in { opacity: 0; }
        .gsap-slide-up { transform: translateY(50px); opacity: 0; }
        .gsap-slide-left { transform: translateX(-50px); opacity: 0; }
        .gsap-slide-right { transform: translateX(50px); opacity: 0; }
        .gsap-scale-up { transform: scale(0); opacity: 0; }
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
        
        // 🎬 GSAP SETUP Y CONFIGURACIÓN
        document.addEventListener('DOMContentLoaded', function() {
            // Registrar ScrollTrigger
            if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
                gsap.registerPlugin(ScrollTrigger);
                console.log('✅ GSAP + ScrollTrigger initialized');
            }
        });
        
        // 🎯 FUNCIONES HELPER PARA ALPINE + GSAP
        document.addEventListener('alpine:init', () => {
            // 📊 Store global con variables del sistema
            Alpine.store('global', {
                theme: 'light',
                user: getSystemUserData(),
                site: getSystemSiteData(),
                app: getSystemAppData(),
                toggleTheme() {
                    this.theme = this.theme === 'light' ? 'dark' : 'light';
                }
            });
            
            // 🔧 Datos reactivos globales
            Alpine.data('counter', () => ({
                count: 0,
                increment() { 
                    this.count++;
                    // Pequeña animación al incrementar
                    pulse(this.$el.querySelector('[x-text="count"]'));
                },
                decrement() { 
                    this.count--;
                    pulse(this.$el.querySelector('[x-text="count"]'));
                },
                reset() { 
                    this.count = 0;
                    bounce(this.$el.querySelector('[x-text="count"]'));
                }
            }));
            
            // 🎪 Componente modal reutilizable (con animaciones GSAP)
            Alpine.data('modal', () => ({
                open: false,
                show() { 
                    this.open = true;
                    this.$nextTick(() => {
                        const modal = this.$el.querySelector('.modal-content');
                        if (modal) {
                            gsap.fromTo(modal, 
                                { scale: 0.8, opacity: 0 }, 
                                { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
                            );
                        }
                    });
                },
                hide() { 
                    const modal = this.$el.querySelector('.modal-content');
                    if (modal) {
                        gsap.to(modal, { 
                            scale: 0.8, 
                            opacity: 0, 
                            duration: 0.2,
                            onComplete: () => { this.open = false; }
                        });
                    } else {
                        this.open = false;
                    }
                },
                toggle() { this.open ? this.hide() : this.show(); }
            }));
            
            // 📝 Componente formulario (con feedback animado)
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
                        // Animación de éxito
                        const successEl = this.$el.querySelector('.success-message');
                        if (successEl) {
                            gsap.fromTo(successEl, 
                                { scale: 0, opacity: 0 }, 
                                { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
                            );
                        }
                        console.log('Formulario enviado:', this.fields);
                    } else {
                        // Animación de error
                        shake(this.$el);
                    }
                },
                reset() {
                    this.fields = {};
                    this.errors = {};
                    this.submitted = false;
                }
            }));

            // 🎬 MAGIC PROPERTIES PARA GSAP
            Alpine.magic('gsap', () => ({
                to: (el, vars) => gsap.to(el, vars),
                from: (el, vars) => gsap.from(el, vars),
                fromTo: (el, fromVars, toVars) => gsap.fromTo(el, fromVars, toVars),
                timeline: () => gsap.timeline(),
                scrollTrigger: (element, animation) => {
                    return gsap.to(element, {
                        ...animation,
                        scrollTrigger: {
                            trigger: element,
                            start: "top 80%",
                            end: "bottom 20%",
                            toggleActions: "play none none reverse"
                        }
                    });
                }
            }));

            // 🎨 MAGIC PROPERTY PARA ANIMACIONES COMUNES
            Alpine.magic('animate', () => ({
                fadeIn: (el, duration = 1) => fadeIn(el, duration),
                slideUp: (el, options = {}) => slideUp(el, options),
                slideDown: (el, options = {}) => slideDown(el, options),
                slideLeft: (el, options = {}) => slideLeft(el, options),
                slideRight: (el, options = {}) => slideRight(el, options),
                bounce: (el) => bounce(el),
                pulse: (el) => pulse(el),
                shake: (el) => shake(el),
                float: (el, distance = 10) => float(el, distance)
            }));
        });

        // 🔧 FUNCIONES PARA OBTENER DATOS DEL SISTEMA (UNIFICADAS)
        function getSystemUserData() {
            // Simular datos del usuario (en producción vendría del servidor)
            return {
                name: window.initialData?.user?.name || 'Usuario Demo',
                email: window.initialData?.user?.email || 'usuario@demo.com',
                id: window.initialData?.user?.id || 1,
                avatar: window.initialData?.user?.avatar || '👤',
                role: window.initialData?.user?.role || 'user'
            };
        }

        function getSystemSiteData() {
            return {
                title: 'Mi Sitio Web',
                description: 'Descripción de mi sitio',
                url: window.location.origin,
                domain: window.location.hostname
            };
        }

        function getSystemAppData() {
            return {
                name: 'Page Builder',
                version: '1.0.0'
            };
        }
        
        // 🎨 UTILIDADES JAVASCRIPT PARA EL PREVIEW (Expandidas con GSAP)
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
            },

            // 🎬 UTILIDADES GSAP ESPECÍFICAS
            gsap: {
                // Animar entrada de página
                pageEnter() {
                    gsap.from('[data-animate]', {
                        y: 50,
                        opacity: 0,
                        duration: 0.8,
                        stagger: 0.1,
                        ease: "power2.out"
                    });
                },

                // Secuencia de elementos
                sequence(selector, animation = {}) {
                    const defaults = { y: 30, opacity: 0, duration: 0.6 };
                    gsap.from(selector, { 
                        ...defaults, 
                        ...animation, 
                        stagger: 0.1 
                    });
                },

                // Parallax simple
                parallax(element, speed = 0.5) {
                    gsap.to(element, {
                        yPercent: -50 * speed,
                        ease: "none",
                        scrollTrigger: {
                            trigger: element,
                            start: "top bottom",
                            end: "bottom top",
                            scrub: true
                        }
                    });
                },

                // Contador animado
                countUp(element, endValue, duration = 2) {
                    const obj = { value: 0 };
                    gsap.to(obj, {
                        value: endValue,
                        duration: duration,
                        ease: "power2.out",
                        onUpdate: () => {
                            element.textContent = Math.round(obj.value);
                        }
                    });
                }
            }
        };

        // 🎬 FUNCIONES GLOBALES GSAP PARA SINTAXIS LIMPIA
        window.fadeIn = (el, duration = 1) => {
            gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration });
        };
        
        window.slideUp = (el, options = {}) => {
            const defaults = { y: 50, opacity: 0, duration: 0.8 };
            gsap.fromTo(el, defaults, { y: 0, opacity: 1, ...options });
        };
        
        window.slideDown = (el, options = {}) => {
            const defaults = { y: -50, opacity: 0, duration: 0.8 };
            gsap.fromTo(el, defaults, { y: 0, opacity: 1, ...options });
        };
        
        window.slideLeft = (el, options = {}) => {
            const defaults = { x: 50, opacity: 0, duration: 0.8 };
            gsap.fromTo(el, defaults, { x: 0, opacity: 1, ...options });
        };
        
        window.slideRight = (el, options = {}) => {
            const defaults = { x: -50, opacity: 0, duration: 0.8 };
            gsap.fromTo(el, defaults, { x: 0, opacity: 1, ...options });
        };
        
        window.bounce = (el) => {
            gsap.fromTo(el, { scale: 0 }, { 
                scale: 1, duration: 0.6, ease: "back.out(1.7)" 
            });
        };
        
        window.pulse = (el) => {
            gsap.to(el, { 
                scale: 1.1, duration: 0.3, yoyo: true, repeat: 1, ease: "power2.inOut"
            });
        };
        
        window.shake = (el) => {
            gsap.to(el, { 
                x: -10, duration: 0.1, repeat: 5, yoyo: true, ease: "power2.inOut"
            });
        };

        window.float = (el, distance = 10) => {
            gsap.to(el, { 
                y: -distance, duration: 2, repeat: -1, yoyo: true, ease: "power2.inOut"
            });
        };

        // 🎭 SCROLL TRIGGERED ANIMATIONS
        window.revealOnScroll = (el, options = {}) => {
            const defaults = { y: 50, opacity: 0, duration: 1 };
            gsap.fromTo(el, defaults, {
                y: 0,
                opacity: 1,
                duration: defaults.duration,
                ...options,
                scrollTrigger: {
                    trigger: el,
                    start: "top 80%",
                    end: "bottom 20%",
                    toggleActions: "play none none reverse"
                }
            });
        };

        window.parallaxMove = (el, speed = 0.5) => {
            gsap.to(el, {
                yPercent: -50 * speed,
                ease: "none",
                scrollTrigger: {
                    trigger: el,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true
                }
            });
        };
    </script>
</head>

<body class="bg-gray-50">
    <!-- 🚀 CONTENIDO PRINCIPAL DEL PREVIEW -->
    <div id="preview-content">
        ${processedCode}
    </div>
    
    <!-- 🔧 DEBUG INFO (mejorado con variables dinámicas) -->
    <div x-data="{ showDebug: false }" class="fixed bottom-4 right-4 z-50">
        <button 
            @click="showDebug = !showDebug; $animate.pulse($el)"
            class="bg-gray-800 text-white px-3 py-2 rounded-full text-xs font-mono hover:bg-gray-700 transition-colors"
            title="Debug Alpine.js + GSAP + Variables"
        >
            🔧
        </button>
        
        <div x-show="showDebug" x-transition class="absolute bottom-12 right-0 bg-white border rounded-lg shadow-lg p-4 min-w-[320px] text-xs">
            <h4 class="font-bold mb-2">Debug Info:</h4>
            <p><strong>Alpine:</strong> <span class="text-green-600">✅ Cargado</span></p>
            <p><strong>Tailwind:</strong> <span class="text-green-600">✅ Cargado</span></p>
            <p><strong>GSAP:</strong> <span class="text-green-600" x-text="typeof gsap !== 'undefined' ? '✅ Cargado' : '❌ Error'"></span></p>
            <p><strong>ScrollTrigger:</strong> <span class="text-green-600" x-text="typeof ScrollTrigger !== 'undefined' ? '✅ Cargado' : '❌ Error'"></span></p>
            <p><strong>Variables:</strong> <span class="text-green-600">✅ Sistema Unificado</span></p>
            <p><strong>Viewport:</strong> <span x-text="window.innerWidth + 'x' + window.innerHeight"></span></p>
            <p><strong>Tiempo:</strong> <span x-text="new Date().toLocaleTimeString()"></span></p>
            
            <!-- Variables del Sistema -->
            <div class="mt-3 pt-2 border-t">
                <h5 class="font-semibold mb-2">Variables del Sistema:</h5>
                <div class="text-xs space-y-1">
                    <p><strong>Usuario:</strong> <span x-text="$store.global.user.name"></span></p>
                    <p><strong>App:</strong> <span x-text="$store.global.app.name + ' v' + $store.global.app.version"></span></p>
                    <p><strong>Sitio:</strong> <span x-text="$store.global.site.title"></span></p>
                </div>
            </div>
            
            <!-- Test GSAP -->
            <div class="mt-3 pt-2 border-t">
                <h5 class="font-semibold mb-2">Test GSAP:</h5>
                <div class="grid grid-cols-2 gap-1">
                    <button 
                        @click="$animate.pulse($el)"
                        class="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                    >
                        Pulse
                    </button>
                    <button 
                        @click="$animate.bounce($el)"
                        class="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                    >
                        Bounce
                    </button>
                    <button 
                        @click="$animate.shake($el)"
                        class="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                    >
                        Shake
                    </button>
                    <button 
                        @click="$gsap.to($el, { rotation: 360, duration: 0.5 })"
                        class="bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600"
                    >
                        Spin
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- 📱 INDICADOR DE CARGA (opcional) -->
    <div x-data="{ loading: true }" x-init="setTimeout(() => { loading = false; fadeIn($el.parentElement); }, 500)">
        <div x-show="loading" x-transition class="fixed inset-0 bg-white flex items-center justify-center z-50">
            <div class="text-center">
                <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p class="text-gray-600">Cargando preview con variables unificadas...</p>
            </div>
        </div>
    </div>
</body>
</html>`;
    }, []);

    /**
     * 🎯 PROCESA EL CÓDIGO USANDO EL SISTEMA UNIFICADO DE VARIABLES
     */
    const processCodeWithAlpine = useCallback((code, customVariables = {}) => {
        if (!code) return '';

        try {
            // 🔄 PASO 1: PROCESAR VARIABLES USANDO EL SISTEMA UNIFICADO
            let processedCode = processVariables(code);
            
            // 🔄 PASO 2: APLICAR VARIABLES PERSONALIZADAS SI EXISTEN
            if (customVariables && Object.keys(customVariables).length > 0) {
                Object.entries(customVariables).forEach(([key, value]) => {
                    const regex = new RegExp(`\\{\\{\\s*${escapeRegExp(key)}\\s*\\}\\}`, 'g');
                    processedCode = processedCode.replace(regex, String(value));
                });
            }
            
            // 🎯 PASO 3: AÑADIR CLASES DE ALPINE AUTOMÁTICAMENTE
            // Añadir x-cloak a elementos con Alpine para evitar flash
            processedCode = processedCode.replace(
                /(<[^>]+x-data[^>]*>)/g, 
                (match) => match.includes('x-cloak') ? match : match.replace('>', ' x-cloak>')
            );
            
            // 🚀 PASO 4: GENERAR HTML COMPLETO
            return generatePreviewHTML(processedCode);
            
        } catch (error) {
            console.error('Error procesando código con Alpine + Variables:', error);
            return generatePreviewHTML(generateErrorHTML(error));
        }
    }, [generatePreviewHTML]);

    /**
     * 🎯 OBTENER VARIABLES DISPONIBLES (PROXY AL SISTEMA UNIFICADO)
     */
    const getVariables = useCallback(() => {
        return getAvailableVariables();
    }, []);

    /**
     * 🔍 VALIDAR VARIABLE (PROXY AL SISTEMA UNIFICADO)
     */
    const isValidVariable = useCallback((variablePath) => {
        return validateVariable(variablePath);
    }, []);

    /**
     * 🛠️ FUNCIONES AUXILIARES
     */
    const generateErrorHTML = (error) => {
        return `
            <div class="p-8 bg-red-50 border border-red-200 rounded-lg m-4">
                <h2 class="text-xl font-bold text-red-800 mb-4">❌ Error en el Preview</h2>
                <p class="text-red-700 mb-2">Hubo un problema procesando el código:</p>
                <code class="text-sm bg-red-100 p-2 rounded block text-red-800 mb-4">${error.message}</code>
                <div class="space-y-2">
                    <p class="text-sm text-red-600">💡 <strong>Sugerencias:</strong></p>
                    <ul class="text-sm text-red-600 list-disc list-inside space-y-1">
                        <li>Verifica que las variables tengan el formato correcto: <code>{{ variable.name }}</code></li>
                        <li>Asegúrate de que las directivas Alpine estén bien escritas</li>
                        <li>Revisa la sintaxis HTML en general</li>
                    </ul>
                </div>
                <button onclick="location.reload()" class="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                    🔄 Recargar Preview
                </button>
            </div>
        `;
    };

    /**
     * Escapa caracteres especiales para regex
     */
    const escapeRegExp = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    // 📤 EXPORTAR FUNCIONES PÚBLICAS
    return {
        processCodeWithAlpine,
        generatePreviewHTML,
        getVariables,
        isValidVariable
    };
};
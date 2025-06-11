// ===================================================================
// plugins/alpine/templates/scripts.js
// Responsabilidad: Template de scripts separado del HTML principal
// ===================================================================

export const alpineScriptsTemplate = `
<script>
    // 🔧 CONFIGURACIÓN DE TAILWIND PERSONALIZADA
    tailwind.config = {
        theme: {
            extend: {
                colors: {
                    'custom-blue': '#3B82F6',
                    'custom-purple': '#8B5CF6',
                    'custom-pink': '#EC4899',
                    'success': '#10b981',
                    'warning': '#f59e0b',
                    'danger': '#ef4444'
                },
                fontFamily: {
                    'sans': ['Inter', 'system-ui', 'sans-serif'],
                    'mono': ['Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'monospace']
                },
                animation: {
                    'bounce-slow': 'bounce 2s infinite',
                    'pulse-fast': 'pulse 1s infinite',
                    'slide-up': 'slideUp 0.5s ease-out',
                    'slide-down': 'slideDown 0.5s ease-out',
                    'fade-in': 'fadeIn 0.3s ease-out',
                    'scale-in': 'scaleIn 0.2s ease-out'
                },
                keyframes: {
                    slideUp: {
                        '0%': { transform: 'translateY(100%)', opacity: '0' },
                        '100%': { transform: 'translateY(0)', opacity: '1' }
                    },
                    slideDown: {
                        '0%': { transform: 'translateY(-100%)', opacity: '0' },
                        '100%': { transform: 'translateY(0)', opacity: '1' }
                    },
                    fadeIn: {
                        '0%': { opacity: '0' },
                        '100%': { opacity: '1' }
                    },
                    scaleIn: {
                        '0%': { transform: 'scale(0.9)', opacity: '0' },
                        '100%': { transform: 'scale(1)', opacity: '1' }
                    }
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
            
            // Configuración global de GSAP
            gsap.defaults({
                duration: 0.6,
                ease: "power2.out"
            });
        }
        
        // Inicializar utilidades del preview
        if (typeof initializePreviewUtils === 'function') {
            initializePreviewUtils();
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
            debug: false,
            
            // Métodos del store
            toggleTheme() {
                this.theme = this.theme === 'light' ? 'dark' : 'light';
                document.documentElement.classList.toggle('dark');
                console.log('🎨 Theme switched to:', this.theme);
            },
            
            toggleDebug() {
                this.debug = !this.debug;
                console.log('🔧 Debug mode:', this.debug ? 'ON' : 'OFF');
            },
            
            notify(message, type = 'info') {
                console.log(\`📢 [\${type.toUpperCase()}] \${message}\`);
                // Aquí se podría integrar con un sistema de notificaciones real
            }
        });
        
        // 🔧 Componente contador mejorado
        Alpine.data('counter', () => ({
            count: 0,
            step: 1,
            min: null,
            max: null,
            
            increment() { 
                if (this.max === null || this.count < this.max) {
                    this.count += this.step;
                    this.animateValue();
                }
            },
            
            decrement() { 
                if (this.min === null || this.count > this.min) {
                    this.count -= this.step;
                    this.animateValue();
                }
            },
            
            reset() { 
                this.count = 0;
                this.animateBounce();
            },
            
            animateValue() {
                const element = this.$el.querySelector('[x-text="count"]');
                if (element && typeof pulse === 'function') {
                    pulse(element);
                }
            },
            
            animateBounce() {
                const element = this.$el.querySelector('[x-text="count"]');
                if (element && typeof bounce === 'function') {
                    bounce(element);
                }
            }
        }));
        
        // 🎪 Componente modal mejorado
        Alpine.data('modal', () => ({
            open: false,
            title: 'Modal',
            
            show() { 
                this.open = true;
                this.$nextTick(() => {
                    const modal = this.$el.querySelector('.modal-content');
                    if (modal && typeof gsap !== 'undefined') {
                        gsap.fromTo(modal, 
                            { scale: 0.8, opacity: 0, y: 20 }, 
                            { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.7)" }
                        );
                    }
                });
            },
            
            hide() { 
                const modal = this.$el.querySelector('.modal-content');
                if (modal && typeof gsap !== 'undefined') {
                    gsap.to(modal, { 
                        scale: 0.8, 
                        opacity: 0, 
                        y: 20,
                        duration: 0.2,
                        onComplete: () => { this.open = false; }
                    });
                } else {
                    this.open = false;
                }
            },
            
            toggle() { 
                this.open ? this.hide() : this.show(); 
            }
        }));
        
        // 📝 Componente formulario con validación
        Alpine.data('form', () => ({
            fields: {},
            errors: {},
            submitted: false,
            loading: false,
            
            init() {
                // Detectar campos del formulario automáticamente
                const inputs = this.$el.querySelectorAll('input, textarea, select');
                inputs.forEach(input => {
                    if (input.name) {
                        this.fields[input.name] = input.value || '';
                    }
                });
            },
            
            validate() {
                this.errors = {};
                let isValid = true;
                
                // Validaciones básicas
                Object.entries(this.fields).forEach(([field, value]) => {
                    const input = this.$el.querySelector(\`[name="\${field}"]\`);
                    if (input && input.required && (!value || value.trim() === '')) {
                        this.errors[field] = 'Este campo es requerido';
                        isValid = false;
                    }
                    
                    // Validación de email
                    if (input && input.type === 'email' && value) {
                        const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
                        if (!emailRegex.test(value)) {
                            this.errors[field] = 'Email inválido';
                            isValid = false;
                        }
                    }
                });
                
                return isValid;
            },
            
            async submit() {
                if (!this.validate()) {
                    // Animación de error
                    if (typeof shake === 'function') {
                        shake(this.$el);
                    }
                    return;
                }
                
                this.loading = true;
                
                try {
                    // Simular envío
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    this.submitted = true;
                    
                    // Animación de éxito
                    const successEl = this.$el.querySelector('.success-message');
                    if (successEl && typeof gsap !== 'undefined') {
                        gsap.fromTo(successEl, 
                            { scale: 0, opacity: 0 }, 
                            { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
                        );
                    }
                    
                    console.log('📋 Formulario enviado:', this.fields);
                    
                } catch (error) {
                    console.error('❌ Error enviando formulario:', error);
                } finally {
                    this.loading = false;
                }
            },
            
            reset() {
                this.fields = {};
                this.errors = {};
                this.submitted = false;
                this.loading = false;
                
                // Limpiar inputs del DOM
                const inputs = this.$el.querySelectorAll('input, textarea, select');
                inputs.forEach(input => {
                    input.value = '';
                });
            }
        }));
        
        // 📱 Componente responsive helper
        Alpine.data('responsive', () => ({
            isMobile: false,
            isTablet: false,
            isDesktop: false,
            
            init() {
                this.checkBreakpoint();
                window.addEventListener('resize', () => this.checkBreakpoint());
            },
            
            checkBreakpoint() {
                const width = window.innerWidth;
                this.isMobile = width < 768;
                this.isTablet = width >= 768 && width < 1024;
                this.isDesktop = width >= 1024;
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
            },
            
            // Animaciones predefinidas
            fadeIn: (el, options = {}) => gsap.fromTo(el, 
                { opacity: 0 }, 
                { opacity: 1, duration: 0.5, ...options }
            ),
            
            slideIn: (el, direction = 'up', options = {}) => {
                const directions = {
                    up: { y: 50 },
                    down: { y: -50 },
                    left: { x: 50 },
                    right: { x: -50 }
                };
                
                return gsap.fromTo(el,
                    { ...directions[direction], opacity: 0 },
                    { x: 0, y: 0, opacity: 1, duration: 0.6, ...options }
                );
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
            float: (el, distance = 10) => float(el, distance),
            
            // Nuevas animaciones
            zoomIn: (el) => zoomIn(el),
            zoomOut: (el) => zoomOut(el),
            flipX: (el) => flipX(el),
            flipY: (el) => flipY(el)
        }));
        
        // 🔧 MAGIC PROPERTY PARA UTILIDADES
        Alpine.magic('utils', () => ({
            formatDate: (date = new Date()) => window.previewUtils.formatDate(date),
            formatTime: (date = new Date()) => window.previewUtils.formatTime(date),
            randomColor: () => window.previewUtils.randomColor(),
            isMobile: () => window.previewUtils.isMobile(),
            celebrate: () => window.previewUtils.celebrate(),
            
            // Nuevas utilidades
            slugify: (text) => text.toLowerCase().replace(/[^\\w\\s-]/g, '').replace(/[\\s_-]+/g, '-').trim('-'),
            truncate: (text, length = 50) => text.length > length ? text.substring(0, length) + '...' : text,
            capitalize: (text) => text.charAt(0).toUpperCase() + text.slice(1),
            randomId: () => Math.random().toString(36).substr(2, 9)
        }));
    });

    // 🔧 FUNCIONES PARA OBTENER DATOS DEL SISTEMA (MEJORADAS)
    function getSystemUserData() {
        const userData = window.initialData?.user || {};
        return {
            name: userData.name || 'Usuario Demo',
            email: userData.email || 'usuario@demo.com',
            id: userData.id || 1,
            avatar: userData.avatar || '👤',
            role: userData.role || 'user',
            firstName: userData.firstName || userData.name?.split(' ')[0] || 'Usuario',
            lastName: userData.lastName || userData.name?.split(' ').slice(1).join(' ') || 'Demo',
            initials: (userData.name || 'Usuario Demo').split(' ').map(n => n[0]).join('').toUpperCase(),
            isAdmin: userData.role === 'admin',
            isLoggedIn: !!userData.id
        };
    }

    function getSystemSiteData() {
        const siteData = window.initialData?.site || {};
        return {
            title: siteData.title || 'Mi Sitio Web',
            description: siteData.description || 'Descripción de mi sitio',
            url: window.location.origin,
            domain: window.location.hostname,
            protocol: window.location.protocol,
            path: window.location.pathname,
            language: siteData.language || 'es',
            theme: siteData.theme || 'light'
        };
    }

    function getSystemAppData() {
        const appData = window.initialData?.app || {};
        return {
            name: appData.name || 'Page Builder',
            version: appData.version || '2.0.0-plugins',
            environment: appData.environment || 'development',
            features: appData.features || ['templates', 'variables', 'plugins']
        };
    }
    
    // 🎨 UTILIDADES JAVASCRIPT MEJORADAS PARA EL PREVIEW
    window.previewUtils = {
        // Formateo de fechas y tiempo
        formatDate(date = new Date()) {
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        },
        
        formatTime(date = new Date()) {
            return date.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        
        formatDateTime(date = new Date()) {
            return \`\${this.formatDate(date)} a las \${this.formatTime(date)}\`;
        },
        
        // Utilidades de color
        randomColor() {
            const colors = ['blue', 'green', 'purple', 'pink', 'indigo', 'red', 'yellow', 'teal', 'orange', 'cyan'];
            return colors[Math.floor(Math.random() * colors.length)];
        },
        
        hexToRgb(hex) {
            const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        },
        
        // Utilidades de dispositivo
        isMobile() {
            return window.innerWidth < 768;
        },
        
        isTablet() {
            return window.innerWidth >= 768 && window.innerWidth < 1024;
        },
        
        isDesktop() {
            return window.innerWidth >= 1024;
        },
        
        // Utilidades de string
        slugify(text) {
            return text.toLowerCase()
                .replace(/[^\\w\\s-]/g, '')
                .replace(/[\\s_-]+/g, '-')
                .trim('-');
        },
        
        truncate(text, length = 50) {
            return text.length > length ? text.substring(0, length) + '...' : text;
        },
        
        // Utilidades de interacción
        celebrate() {
            console.log('🎉 ¡Celebrando!');
            // Aquí se podría añadir confetti o animaciones
        },
        
        copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                console.log('📋 Copiado al portapapeles:', text);
            });
        },
        
        // Utilidades de validación
        isEmail(email) {
            return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
        },
        
        isUrl(url) {
            try {
                new URL(url);
                return true;
            } catch {
                return false;
            }
        },
        
        // Utilidades de almacenamiento
        store(key, value) {
            localStorage.setItem(key, JSON.stringify(value));
        },
        
        retrieve(key) {
            try {
                return JSON.parse(localStorage.getItem(key));
            } catch {
                return null;
            }
        }
    };

    // 🎬 FUNCIONES GLOBALES GSAP MEJORADAS
    window.fadeIn = (el, duration = 1) => {
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration });
        }
    };
    
    window.slideUp = (el, options = {}) => {
        if (typeof gsap !== 'undefined') {
            const defaults = { y: 50, opacity: 0, duration: 0.8 };
            gsap.fromTo(el, defaults, { y: 0, opacity: 1, ...options });
        }
    };
    
    window.slideDown = (el, options = {}) => {
        if (typeof gsap !== 'undefined') {
            const defaults = { y: -50, opacity: 0, duration: 0.8 };
            gsap.fromTo(el, defaults, { y: 0, opacity: 1, ...options });
        }
    };
    
    window.slideLeft = (el, options = {}) => {
        if (typeof gsap !== 'undefined') {
            const defaults = { x: 50, opacity: 0, duration: 0.8 };
            gsap.fromTo(el, defaults, { x: 0, opacity: 1, ...options });
        }
    };
    
    window.slideRight = (el, options = {}) => {
        if (typeof gsap !== 'undefined') {
            const defaults = { x: -50, opacity: 0, duration: 0.8 };
            gsap.fromTo(el, defaults, { x: 0, opacity: 1, ...options });
        }
    };
    
    window.bounce = (el) => {
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(el, { scale: 0 }, { 
                scale: 1, duration: 0.6, ease: "back.out(1.7)" 
            });
        }
    };
    
    window.pulse = (el) => {
        if (typeof gsap !== 'undefined') {
            gsap.to(el, { 
                scale: 1.1, duration: 0.3, yoyo: true, repeat: 1, ease: "power2.inOut"
            });
        }
    };
    
    window.shake = (el) => {
        if (typeof gsap !== 'undefined') {
            gsap.to(el, { 
                x: -10, duration: 0.1, repeat: 5, yoyo: true, ease: "power2.inOut"
            });
        }
    };

    window.float = (el, distance = 10) => {
        if (typeof gsap !== 'undefined') {
            gsap.to(el, { 
                y: -distance, duration: 2, repeat: -1, yoyo: true, ease: "power2.inOut"
            });
        }
    };
    
    // 🎬 NUEVAS ANIMACIONES GSAP
    window.zoomIn = (el) => {
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(el, { scale: 0, opacity: 0 }, { 
                scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" 
            });
        }
    };
    
    window.zoomOut = (el) => {
        if (typeof gsap !== 'undefined') {
            gsap.to(el, { 
                scale: 0, opacity: 0, duration: 0.3, ease: "power2.in"
            });
        }
    };
    
    window.flipX = (el) => {
        if (typeof gsap !== 'undefined') {
            gsap.to(el, { rotationY: 180, duration: 0.6, ease: "power2.inOut" });
        }
    };
    
    window.flipY = (el) => {
        if (typeof gsap !== 'undefined') {
            gsap.to(el, { rotationX: 180, duration: 0.6, ease: "power2.inOut" });
        }
    };

    // 🎭 SCROLL TRIGGERED ANIMATIONS MEJORADAS
    window.revealOnScroll = (el, options = {}) => {
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
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
        }
    };

    window.parallaxMove = (el, speed = 0.5) => {
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
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
        }
    };
    
    // 🔧 FUNCIÓN DE INICIALIZACIÓN DE UTILIDADES
    window.initializePreviewUtils = function() {
        console.log('🚀 Preview utilities initialized');
        
        // Auto-aplicar animaciones de entrada a elementos marcados
        document.querySelectorAll('[data-animate]').forEach(el => {
            const animation = el.dataset.animate;
            switch (animation) {
                case 'fade-in':
                    fadeIn(el);
                    break;
                case 'slide-up':
                    slideUp(el);
                    break;
                case 'bounce':
                    bounce(el);
                    break;
                case 'reveal':
                    revealOnScroll(el);
                    break;
            }
        });
        
        // Auto-aplicar parallax a elementos marcados
        document.querySelectorAll('[data-parallax]').forEach(el => {
            const speed = parseFloat(el.dataset.parallax) || 0.5;
            parallaxMove(el, speed);
        });
    };
    
    // 🎨 FUNCIONES DE DEBUG
    window.debugPreview = {
        logAlpineComponents() {
            console.log('🔍 Alpine Components:', Array.from(document.querySelectorAll('[x-data]')));
        },
        
        logGlobalStore() {
            if (typeof Alpine !== 'undefined') {
                console.log('📊 Alpine Global Store:', Alpine.store('global'));
            }
        },
        
        testAnimations() {
            const testEl = document.createElement('div');
            testEl.innerHTML = '🎬 Test';
            testEl.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);padding:2rem;background:#3B82F6;color:white;border-radius:8px;z-index:9999;';
            document.body.appendChild(testEl);
            
            bounce(testEl);
            
            setTimeout(() => {
                document.body.removeChild(testEl);
            }, 2000);
        }
    };
</script>

<!-- 🔧 DEBUG INFO (mejorado con variables dinámicas) -->
<div x-data="{ showDebug: false }" class="fixed bottom-4 right-4 z-50">
    <button 
        @click="showDebug = !showDebug; $animate.pulse($el)"
        class="bg-gray-800 text-white px-3 py-2 rounded-full text-xs font-mono hover:bg-gray-700 transition-colors"
        title="Debug Alpine.js + GSAP + Variables + Templates"
    >
        🔧 Debug
    </button>
    
    <div x-show="showDebug" x-transition class="absolute bottom-12 right-0 bg-white border rounded-lg shadow-lg p-4 min-w-[350px] text-xs max-h-96 overflow-y-auto">
        <h4 class="font-bold mb-3 text-sm">🔧 Debug Panel (Template Engine)</h4>
        
        <!-- Estado del sistema -->
        <div class="mb-3 pb-2 border-b">
            <h5 class="font-semibold mb-2 text-xs">Sistema:</h5>
            <p><strong>Alpine:</strong> <span class="text-green-600" x-text="typeof Alpine !== 'undefined' ? '✅ v' + Alpine.version : '❌ Error'"></span></p>
            <p><strong>Tailwind:</strong> <span class="text-green-600">✅ CDN</span></p>
            <p><strong>GSAP:</strong> <span class="text-green-600" x-text="typeof gsap !== 'undefined' ? '✅ v' + gsap.version : '❌ Error'"></span></p>
            <p><strong>ScrollTrigger:</strong> <span class="text-green-600" x-text="typeof ScrollTrigger !== 'undefined' ? '✅ Loaded' : '❌ Error'"></span></p>
            <p><strong>Templates:</strong> <span class="text-green-600">✅ Engine Active</span></p>
        </div>
        
        <!-- Información del dispositivo -->
        <div class="mb-3 pb-2 border-b">
            <h5 class="font-semibold mb-2 text-xs">Dispositivo:</h5>
            <p><strong>Viewport:</strong> <span x-text="window.innerWidth + 'x' + window.innerHeight"></span></p>
            <p><strong>Tipo:</strong> <span x-text="$utils.isMobile() ? '📱 Mobile' : ($utils.isTablet() ? '📱 Tablet' : '💻 Desktop')"></span></p>
            <p><strong>Tiempo:</strong> <span x-text="$utils.formatTime()"></span></p>
        </div>
        
        <!-- Variables del Sistema -->
        <div class="mb-3 pb-2 border-b">
            <h5 class="font-semibold mb-2 text-xs">Variables Globales:</h5>
            <div class="text-xs space-y-1">
                <p><strong>Usuario:</strong> <span x-text="$store.global.user.name"></span></p>
                <p><strong>App:</strong> <span x-text="$store.global.app.name + ' v' + $store.global.app.version"></span></p>
                <p><strong>Tema:</strong> <span x-text="$store.global.theme"></span></p>
                <p><strong>Sitio:</strong> <span x-text="$store.global.site.title"></span></p>
            </div>
        </div>
        
        <!-- Controles de Test -->
        <div class="mb-3 pb-2 border-b">
            <h5 class="font-semibold mb-2 text-xs">Test Animaciones:</h5>
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
        
        <!-- Utilidades -->
        <div class="mb-3">
            <h5 class="font-semibold mb-2 text-xs">Utilidades:</h5>
            <div class="space-y-1">
                <button 
                    @click="$store.global.toggleTheme()"
                    class="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 w-full"
                >
                    🎨 Cambiar Tema
                </button>
                <button 
                    @click="window.debugPreview.testAnimations()"
                    class="bg-indigo-500 text-white px-2 py-1 rounded text-xs hover:bg-indigo-600 w-full"
                >
                    🎬 Test Animaciones
                </button>
                <button 
                    @click="window.debugPreview.logAlpineComponents()"
                    class="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 w-full"
                >
                    🔍 Log Componentes
                </button>
            </div>
        </div>
        
        <!-- Info del Template -->
        <div class="text-xs text-gray-500">
            <p><strong>Template:</strong> Scripts Template v2.0</p>
            <p><strong>Generated:</strong> <span x-text="new Date().toLocaleTimeString()"></span></p>
        </div>
    </div>
</div>

<!-- 📱 INDICADOR DE CARGA MEJORADO -->
<div x-data="{ loading: true }" x-init="setTimeout(() => { loading = false; fadeIn($el.parentElement); }, 800)">
    <div x-show="loading" x-transition:opacity class="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div class="text-center">
            <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p class="text-gray-600 mb-2">Cargando preview con template engine...</p>
            <div class="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <span class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                <span>Inicializando Alpine.js</span>
            </div>
        </div>
    </div>
</div>
`;

export default alpineScriptsTemplate;
// ===================================================================
// plugins/alpine/preview.js - FASE 4: PREVIEW COMO PLUGIN
// Responsabilidad: Migración completa de useAlpinePreview.js a plugin
// ===================================================================

import templateEngine from '../../../core/TemplateEngine.js';
import templateValidator from '../../../security/TemplateValidator.js';

/**
 * Clase AlpinePreview que reemplaza useAlpinePreview.js
 * Usa templates editables en lugar de HTML hardcodeado
 */
export class AlpinePreview {
    constructor(options = {}) {
        this.templateEngine = templateEngine;
        this.templateValidator = templateValidator;
        
        // Configuración del preview
        this.config = {
            defaultTemplate: 'base',
            enableScriptGeneration: true,
            enableStyleGeneration: true,
            enableDebugMode: false,
            cacheDuration: 5 * 60 * 1000, // 5 minutos
            ...options
        };
        
        // Cache de HTML generado
        this.htmlCache = new Map();
        
        // Estadísticas
        this.stats = {
            generatedPreviews: 0,
            cacheHits: 0,
            errors: 0,
            lastGenerated: null
        };
        
        console.log('🎬 AlpinePreview initialized with template engine');
    }

    // ===================================================================
    // API PRINCIPAL - COMPATIBLE CON useAlpinePreview
    // ===================================================================

    /**
     * Genera HTML completo usando templates
     * @param {string} processedCode - Código ya procesado con variables
     * @param {Object} options - Opciones adicionales
     * @returns {Promise<string>} HTML completo renderizado
     */
    async generatePreviewHTML(processedCode, options = {}) {
        try {
            const templateName = options.template || this.config.defaultTemplate;
            const debugMode = options.debug || this.config.enableDebugMode;
            
            // Verificar cache
            const cacheKey = this._getCacheKey(processedCode, templateName, options);
            if (this.htmlCache.has(cacheKey)) {
                const cached = this.htmlCache.get(cacheKey);
                if (this._isCacheValid(cached)) {
                    this.stats.cacheHits++;
                    console.log('📋 Preview HTML served from cache');
                    return cached.html;
                }
                this.htmlCache.delete(cacheKey);
            }

            // Preparar variables para el template
            const templateVariables = {
                TITLE: this._generateTitle(processedCode),
                CONTENT: processedCode,
                STYLES: await this._generateStyles(options),
                SCRIPTS: await this._generateScripts(options),
                HEAD_EXTRA: this._generateHeadExtra(options),
                BODY_CLASS: this._generateBodyClass(options),
                META_TAGS: this._generateMetaTags(options),
                ANALYTICS: this._generateAnalytics(options),
                CUSTOM_CSS: this._generateCustomCSS(options)
            };

            // Usar template de debug si está habilitado
            const finalTemplate = debugMode ? 'debug' : templateName;
            
            // Renderizar usando template engine
            const html = await this.templateEngine.renderTemplate('alpine', finalTemplate, templateVariables);
            
            // Validar HTML generado
            const validation = this.templateValidator.validate(html);
            if (!validation.isValid) {
                const criticalErrors = validation.errors.filter(e => e.severity === 'critical');
                if (criticalErrors.length > 0) {
                    throw new Error(`Generated HTML validation failed: ${criticalErrors[0].message}`);
                }
                console.warn('⚠️ Generated HTML has warnings:', validation.warnings);
            }

            // Guardar en cache
            this._saveToCache(cacheKey, html);
            
            // Actualizar estadísticas
            this.stats.generatedPreviews++;
            this.stats.lastGenerated = new Date().toISOString();
            
            console.log(`🎬 Preview HTML generated using template: ${finalTemplate}`);
            return html;

        } catch (error) {
            this.stats.errors++;
            console.error('❌ Error generating preview HTML:', error);
            
            // Generar HTML de error como fallback
            return this._generateErrorHTML(error, processedCode);
        }
    }

    /**
     * Procesa código con Alpine + Variables (compatible con useAlpinePreview)
     * @param {string} code - Código HTML con variables
     * @param {Object} customVariables - Variables personalizadas
     * @param {Object} options - Opciones de procesamiento
     * @returns {Promise<string>} HTML completo procesado
     */
    async processCodeWithAlpine(code, customVariables = {}, options = {}) {
        try {
            if (!code || typeof code !== 'string') {
                return await this.generatePreviewHTML('', options);
            }

            console.log('🔄 Processing code with Alpine + Variables + Templates...');

            // PASO 1: Procesar variables usando el sistema unificado
            let processedCode = code;
            
            // Usar bridge para procesar variables si está disponible
            if (window.legacyBridge && window.legacyBridge.processCodeWithAllPlugins) {
                processedCode = await window.legacyBridge.processCodeWithAllPlugins(code);
            } else if (window.processVariables) {
                processedCode = window.processVariables(code);
            }
            
            // PASO 2: Aplicar variables personalizadas
            if (customVariables && Object.keys(customVariables).length > 0) {
                Object.entries(customVariables).forEach(([key, value]) => {
                    const regex = new RegExp(`\\{\\{\\s*${this._escapeRegExp(key)}\\s*\\}\\}`, 'g');
                    processedCode = processedCode.replace(regex, String(value));
                });
            }
            
            // PASO 3: Añadir clases Alpine automáticamente
            processedCode = this._enhanceAlpineCode(processedCode);
            
            // PASO 4: Generar HTML completo usando templates
            return await this.generatePreviewHTML(processedCode, options);
            
        } catch (error) {
            console.error('❌ Error processing code with Alpine:', error);
            return this._generateErrorHTML(error, code);
        }
    }

    // ===================================================================
    // GENERACIÓN DE COMPONENTES DEL TEMPLATE
    // ===================================================================

    /**
     * Generar título dinámico
     * @private
     */
    _generateTitle(code) {
        // Extraer título del código si existe
        const titleMatch = code.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        if (titleMatch) {
            return `${titleMatch[1]} - Page Builder Preview`;
        }
        
        // Título basado en contenido Alpine
        if (code.includes('x-data')) {
            return 'Alpine.js Component - Page Builder';
        }
        
        return 'Page Builder - Preview';
    }

    /**
     * Generar estilos personalizados
     * @private
     */
    async _generateStyles(options) {
        if (!this.config.enableStyleGeneration) {
            return '<!-- Style generation disabled -->';
        }

        const styles = [];
        
        // Estilos base para el preview
        styles.push(`
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
        `);

        // Estilos personalizados del usuario
        if (options.customStyles) {
            styles.push(`<style>\n${options.customStyles}\n</style>`);
        }

        return styles.join('\n');
    }

    /**
     * Generar scripts dinámicos
     * @private
     */
    async _generateScripts(options) {
        if (!this.config.enableScriptGeneration) {
            return '<!-- Script generation disabled -->';
        }

        // Cargar template de scripts
        try {
            const scriptsTemplate = await this.templateEngine.loadTemplate('alpine', 'scripts');
            return scriptsTemplate;
        } catch (error) {
            // Fallback: generar scripts inline
            return this._generateInlineScripts(options);
        }
    }

    /**
     * Generar scripts inline como fallback
     * @private
     */
    _generateInlineScripts(options) {
        return `
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

            // 🔧 FUNCIONES PARA OBTENER DATOS DEL SISTEMA
            function getSystemUserData() {
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
                    version: '2.0.0-plugins'
                };
            }
            
            // 🎨 UTILIDADES JAVASCRIPT PARA EL PREVIEW
            window.previewUtils = {
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
                
                randomColor() {
                    const colors = ['blue', 'green', 'purple', 'pink', 'indigo', 'red', 'yellow'];
                    return colors[Math.floor(Math.random() * colors.length)];
                },
                
                isMobile() {
                    return window.innerWidth < 768;
                },
                
                celebrate() {
                    console.log('🎉 ¡Celebrando!');
                }
            };

            // 🎬 FUNCIONES GLOBALES GSAP
            window.fadeIn = (el, duration = 1) => {
                gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration });
            };
            
            window.slideUp = (el, options = {}) => {
                const defaults = { y: 50, opacity: 0, duration: 0.8 };
                gsap.fromTo(el, defaults, { y: 0, opacity: 1, ...options });
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

            ${options.customScripts || ''}
        </script>
        `;
    }

    /**
     * Generar elementos HEAD adicionales
     * @private
     */
    _generateHeadExtra(options) {
        const extras = [];
        
        // PWA manifest si está disponible
        if (options.pwa) {
            extras.push('<link rel="manifest" href="/manifest.json">');
        }
        
        // Fonts adicionales
        if (options.fonts) {
            options.fonts.forEach(font => {
                extras.push(`<link href="https://fonts.googleapis.com/css2?family=${font}" rel="stylesheet">`);
            });
        }
        
        return extras.join('\n');
    }

    /**
     * Generar clases del body
     * @private
     */
    _generateBodyClass(options) {
        const classes = [];
        
        if (options.theme === 'dark') {
            classes.push('dark');
        }
        
        if (options.bodyClass) {
            classes.push(options.bodyClass);
        }
        
        return classes.join(' ');
    }

    /**
     * Generar meta tags
     * @private
     */
    _generateMetaTags(options) {
        const tags = [];
        
        tags.push('<meta name="generator" content="Page Builder - Alpine.js Plugin">');
        
        if (options.description) {
            tags.push(`<meta name="description" content="${options.description}">`);
        }
        
        if (options.keywords) {
            tags.push(`<meta name="keywords" content="${options.keywords}">`);
        }
        
        return tags.join('\n');
    }

    /**
     * Generar código de analytics
     * @private
     */
    _generateAnalytics(options) {
        if (!options.analytics) {
            return '<!-- Analytics disabled -->';
        }
        
        return `
        <!-- Analytics placeholder -->
        <script>
            console.log('📊 Analytics would be initialized here');
        </script>
        `;
    }

    /**
     * Generar CSS personalizado
     * @private
     */
    _generateCustomCSS(options) {
        if (!options.customCSS) {
            return '/* No custom CSS */';
        }
        
        return options.customCSS;
    }

    // ===================================================================
    // MEJORAS DE ALPINE
    // ===================================================================

    /**
     * Mejorar código Alpine automáticamente
     * @private
     */
    _enhanceAlpineCode(code) {
        let enhanced = code;
        
        // Añadir x-cloak a elementos con Alpine para evitar flash
        enhanced = enhanced.replace(
            /(<[^>]+x-data[^>]*>)/g, 
            (match) => match.includes('x-cloak') ? match : match.replace('>', ' x-cloak>')
        );
        
        return enhanced;
    }

    // ===================================================================
    // GESTIÓN DE ERRORES
    // ===================================================================

    /**
     * Generar HTML de error
     * @private
     */
    _generateErrorHTML(error, originalCode) {
        return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Error - Page Builder Preview</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-50">
            <div class="container mx-auto p-8">
                <div class="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h2 class="text-xl font-bold text-red-800 mb-4">❌ Error en el Preview</h2>
                    <p class="text-red-700 mb-2">Hubo un problema generando el preview:</p>
                    <code class="text-sm bg-red-100 p-2 rounded block text-red-800 mb-4">${error.message}</code>
                    
                    <div class="space-y-2">
                        <p class="text-sm text-red-600"><strong>💡 Posibles soluciones:</strong></p>
                        <ul class="text-sm text-red-600 list-disc list-inside space-y-1">
                            <li>Verifica que las variables tengan el formato correcto: <code>{{ variable.name }}</code></li>
                            <li>Asegúrate de que las directivas Alpine estén bien escritas</li>
                            <li>Revisa la sintaxis HTML en general</li>
                            <li>Verifica que el template seleccionado exista</li>
                        </ul>
                    </div>
                    
                    <details class="mt-4">
                        <summary class="cursor-pointer text-sm font-medium text-red-700">Ver código original</summary>
                        <pre class="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">${originalCode}</pre>
                    </details>
                    
                    <button onclick="location.reload()" class="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                        🔄 Recargar Preview
                    </button>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    // ===================================================================
    // UTILIDADES PRIVADAS
    // ===================================================================

    /**
     * Generar clave de cache
     * @private
     */
    _getCacheKey(code, template, options) {
        const optionsStr = JSON.stringify(options);
        return `${template}_${this._hash(code + optionsStr)}`;
    }

    /**
     * Hash simple para cache
     * @private
     */
    _hash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Verificar validez del cache
     * @private
     */
    _isCacheValid(cached) {
        return (Date.now() - cached.timestamp) < this.config.cacheDuration;
    }

    /**
     * Guardar en cache
     * @private
     */
    _saveToCache(key, html) {
        this.htmlCache.set(key, {
            html,
            timestamp: Date.now()
        });
        
        // Limpiar cache si es muy grande
        if (this.htmlCache.size > 50) {
            const oldestKey = this.htmlCache.keys().next().value;
            this.htmlCache.delete(oldestKey);
        }
    }

    /**
     * Escapar caracteres especiales para regex
     * @private
     */
    _escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // ===================================================================
    // API PÚBLICA - CONFIGURACIÓN Y ESTADÍSTICAS
    // ===================================================================

    /**
     * Actualizar configuración
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('⚙️ AlpinePreview config updated');
    }

    /**
     * Obtener estadísticas
     */
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.htmlCache.size,
            templatesAvailable: this.templateEngine.getStats().templatesCount
        };
    }

    /**
     * Limpiar cache
     */
    clearCache() {
        this.htmlCache.clear();
        console.log('🧹 AlpinePreview cache cleared');
    }

    /**
     * Hot reload de template
     */
    async hotReloadTemplate(templateName, newContent) {
        try {
            await this.templateEngine.hotReload('alpine', templateName, newContent);
            this.clearCache(); // Limpiar cache para forzar regeneración
            console.log(`🔥 Template hot-reloaded: ${templateName}`);
            return true;
        } catch (error) {
            console.error(`❌ Hot reload failed:`, error);
            throw error;
        }
    }
}

// ===================================================================
// FUNCIONES DE COMPATIBILIDAD CON useAlpinePreview
// ===================================================================

/**
 * Hook de compatibilidad que simula useAlpinePreview
 * Usa internamente AlpinePreview
 */
export const useAlpinePreview = (options = {}) => {
    const alpinePreview = new AlpinePreview(options);
    
    return {
        // Funciones principales (compatibles)
        generatePreviewHTML: (code) => alpinePreview.generatePreviewHTML(code),
        processCodeWithAlpine: (code, vars, opts) => alpinePreview.processCodeWithAlpine(code, vars, opts),
        
        // Funciones adicionales del plugin
        getStats: () => alpinePreview.getStats(),
        clearCache: () => alpinePreview.clearCache(),
        updateConfig: (config) => alpinePreview.updateConfig(config),
        hotReloadTemplate: (name, content) => alpinePreview.hotReloadTemplate(name, content),
        
        // Acceso directo a la instancia
        _instance: alpinePreview
    };
};

// ===================================================================
// EXPORTACIONES
// ===================================================================

export default AlpinePreview;

// ===================================================================
// DEBUGGING EN DESARROLLO
// ===================================================================

if (process.env.NODE_ENV === 'development') {
    window.AlpinePreview = AlpinePreview;
    window.useAlpinePreview = useAlpinePreview;
    
    console.log('🔧 AlpinePreview plugin ready');
    
    // Test básico
    const testPreview = new AlpinePreview();
    console.log('📊 AlpinePreview test stats:', testPreview.getStats());
}
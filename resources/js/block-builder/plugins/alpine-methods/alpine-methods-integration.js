// ===================================================================
// resources/js/alpine-methods-integration.js
// Script de integración para cargar en tu aplicación principal
// ===================================================================

import { 
    initializeAlpineMethodsPlugin, 
    testAlpineMethodsPlugin,
    debugAlpineMethodsPlugin,
    getAlpineMethodsPlugin 
} from './block-builder/plugins/alpine-methods/init.js';

/**
 * Configuración principal de integración
 */
const INTEGRATION_CONFIG = {
    autoInitialize: true,
    enableTesting: true,
    enableDebugMode: true,
    exposeToWindow: true
};

/**
 * Integración principal del plugin Alpine Methods
 */
class AlpineMethodsIntegration {
    constructor(config = {}) {
        this.config = { ...INTEGRATION_CONFIG, ...config };
        this.initialized = false;
        this.plugin = null;
        
        console.log('🔧 Alpine Methods Integration created');
    }

    /**
     * Inicializar la integración completa
     */
    async initialize() {
        if (this.initialized) {
            console.warn('⚠️ Alpine Methods Integration already initialized');
            return this.plugin;
        }

        try {
            console.log('🚀 Starting Alpine Methods Integration...');

            // 1. Inicializar el plugin
            this.plugin = await initializeAlpineMethodsPlugin();

            // 2. Configurar funciones de desarrollo
            if (this.config.enableTesting) {
                this.setupDevelopmentHelpers();
            }

            // 3. Configurar CodeMirror Integration
            this.setupCodeMirrorIntegration();

            // 4. Exponer funciones globales si está habilitado
            if (this.config.exposeToWindow) {
                this.exposeGlobalHelpers();
            }

            // 5. Configurar eventos
            this.setupEventListeners();

            this.initialized = true;
            console.log('✅ Alpine Methods Integration completed successfully');

            // 6. Test automático en desarrollo
            if (this.config.enableTesting && this.config.enableDebugMode) {
                setTimeout(() => this.runInitialTests(), 1000);
            }

            return this.plugin;

        } catch (error) {
            console.error('❌ Alpine Methods Integration failed:', error);
            throw error;
        }
    }

    /**
     * Configurar helpers para desarrollo
     */
    setupDevelopmentHelpers() {
        if (typeof window !== 'undefined') {
            window.alpineMethodsTest = testAlpineMethodsPlugin;
            window.alpineMethodsDebug = debugAlpineMethodsPlugin;
            window.alpineMethodsPlugin = () => getAlpineMethodsPlugin();
            
            console.log('🛠️ Development helpers exposed to window');
        }
    }

    /**
     * Configurar integración específica con CodeMirror
     */
    setupCodeMirrorIntegration() {
        // Verificar si CodeMirror está disponible
        if (typeof window !== 'undefined' && window.CodeMirror) {
            this.integrateWithCodeMirror5();
        }

        // Verificar si hay extensiones de CodeMirror 6
        if (typeof window !== 'undefined' && window.codemirrorExtensions) {
            this.integrateWithCodeMirror6();
        }

        console.log('🎨 CodeMirror integration configured');
    }

    /**
     * Integración con CodeMirror 5 (si está disponible)
     */
    integrateWithCodeMirror5() {
        if (!window.CodeMirror) return;

        // Registrar hint helper para métodos Alpine
        window.CodeMirror.registerHelper('hint', 'alpine-methods', (cm) => {
            const cursor = cm.getCursor();
            const token = cm.getTokenAt(cursor);
            
            const completions = window.getAlpineMethodCompletions({
                getCursor: () => cursor,
                getTokenAt: () => token,
                getLine: (line) => cm.getLine(line)
            });
            
            return {
                list: completions,
                from: window.CodeMirror.Pos(cursor.line, token.start),
                to: window.CodeMirror.Pos(cursor.line, token.end)
            };
        });

        console.log('🔧 CodeMirror 5 integration ready');
    }

    /**
     * Integración con CodeMirror 6 (si está disponible)
     */
    integrateWithCodeMirror6() {
        // Integración con el sistema de extensiones de CodeMirror 6
        if (window.codemirrorExtensions && window.codemirrorExtensions.addCompletionSource) {
            window.codemirrorExtensions.addCompletionSource('alpine-methods', (context) => {
                const completions = window.getAlpineMethodCompletions(context);
                
                if (completions.length === 0) return null;

                return {
                    from: context.pos,
                    options: completions.map(completion => ({
                        label: completion.label,
                        type: completion.type,
                        info: completion.info,
                        detail: completion.detail,
                        apply: completion.apply,
                        boost: completion.boost
                    }))
                };
            });
        }

        console.log('🔧 CodeMirror 6 integration ready');
    }

    /**
     * Exponer helpers globales útiles
     */
    exposeGlobalHelpers() {
        if (typeof window === 'undefined') return;

        // Helper para obtener todos los métodos disponibles
        window.getAvailableAlpineMethods = () => {
            const plugin = getAlpineMethodsPlugin();
            return plugin ? plugin.getAllMethods() : [];
        };

        // Helper para procesar código con métodos Alpine
        window.convertAlpineMethodsToCode = (code) => {
            const plugin = getAlpineMethodsPlugin();
            return plugin ? plugin.processCode(code) : code;
        };

        // Helper para buscar métodos
        window.findAlpineMethods = (searchTerm) => {
            const plugin = getAlpineMethodsPlugin();
            return plugin ? plugin.searchMethods(searchTerm) : [];
        };

        // Helper para obtener estadísticas
        window.getAlpineMethodsStats = () => {
            const plugin = getAlpineMethodsPlugin();
            return plugin ? plugin.getUsageStats() : null;
        };

        console.log('🌐 Global helpers exposed');
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        if (typeof window === 'undefined') return;

        // Escuchar cuando CodeMirror procese código
        window.addEventListener('codemirrorCodeProcessed', (event) => {
            const { code, editor } = event.detail;
            
            // Procesar métodos Alpine automáticamente si se detectan
            if (code.includes('@') && this.plugin) {
                try {
                    const processedCode = this.plugin.processCode(code);
                    if (processedCode !== code) {
                        console.log('🔄 Alpine methods processed in code');
                        
                        // Emitir evento con código procesado
                        window.dispatchEvent(new CustomEvent('alpineMethodsProcessed', {
                            detail: { originalCode: code, processedCode, editor }
                        }));
                    }
                } catch (error) {
                    console.warn('⚠️ Error processing Alpine methods:', error);
                }
            }
        });

        // Escuchar cambios en el editor para validación en tiempo real
        window.addEventListener('codemirrorChange', (event) => {
            const { code } = event.detail;
            
            if (code.includes('@') && this.plugin) {
                try {
                    const validation = this.plugin.validateEditorSyntax(code);
                    if (validation.errors.length > 0 || validation.warnings.length > 0) {
                        window.dispatchEvent(new CustomEvent('alpineMethodsValidation', {
                            detail: { validation, code }
                        }));
                    }
                } catch (error) {
                    console.warn('⚠️ Error validating Alpine methods:', error);
                }
            }
        });

        console.log('👂 Event listeners configured');
    }

    /**
     * Ejecutar tests iniciales para verificar que todo funciona
     */
    async runInitialTests() {
        console.log('🧪 Running initial Alpine Methods tests...');

        try {
            // Test básico del plugin
            const testResult = await testAlpineMethodsPlugin();
            
            if (testResult) {
                console.log('✅ Initial tests passed');
                
                // Mostrar información de debug
                if (this.config.enableDebugMode) {
                    debugAlpineMethodsPlugin();
                }
            } else {
                console.warn('⚠️ Some initial tests failed');
            }

        } catch (error) {
            console.error('❌ Initial tests error:', error);
        }
    }

    /**
     * Recargar métodos manualmente
     */
    async reload() {
        if (!this.plugin) {
            console.warn('⚠️ Plugin not initialized');
            return;
        }

        try {
            console.log('🔄 Reloading Alpine methods...');
            await this.plugin.loadMethods();
            console.log('✅ Methods reloaded successfully');
            
            return this.plugin.getAllMethods();
        } catch (error) {
            console.error('❌ Error reloading methods:', error);
            throw error;
        }
    }

    /**
     * Obtener información de estado
     */
    getStatus() {
        return {
            initialized: this.initialized,
            plugin: !!this.plugin,
            methodsCount: this.plugin ? this.plugin.getAllMethods().length : 0,
            config: this.config,
            globalFunctionsAvailable: !!(
                window.getAlpineMethodCompletions &&
                window.validateAlpineMethodSyntax &&
                window.processAlpineMethodCode
            )
        };
    }

    /**
     * Cleanup completo
     */
    cleanup() {
        if (this.plugin && this.plugin.cleanup) {
            this.plugin.cleanup();
        }

        // Limpiar helpers globales
        if (typeof window !== 'undefined') {
            delete window.alpineMethodsTest;
            delete window.alpineMethodsDebug;
            delete window.alpineMethodsPlugin;
            delete window.getAvailableAlpineMethods;
            delete window.convertAlpineMethodsToCode;
            delete window.findAlpineMethods;
            delete window.getAlpineMethodsStats;
        }

        this.initialized = false;
        this.plugin = null;
        
        console.log('🧹 Alpine Methods Integration cleaned up');
    }
}

// ===================================================================
// INSTANCIA GLOBAL Y AUTO-INICIALIZACIÓN
// ===================================================================

// Crear instancia global
const alpineMethodsIntegration = new AlpineMethodsIntegration();

// Auto-inicializar cuando sea apropiado
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            await alpineMethodsIntegration.initialize();
        });
    } else {
        // DOM ya está listo, inicializar después de un breve delay
        setTimeout(async () => {
            await alpineMethodsIntegration.initialize();
        }, 100);
    }
}

// ===================================================================
// EXPORTACIONES
// ===================================================================

export { alpineMethodsIntegration as default };
export { AlpineMethodsIntegration };

// Exponer globalmente para debugging
if (typeof window !== 'undefined') {
    window.alpineMethodsIntegration = alpineMethodsIntegration;
}
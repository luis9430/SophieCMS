// ===================================================================
// resources/js/block-builder/core/CoreSystemInitializer.js
// CORREGIDO - Inicialización sin conflictos de Alpine Methods
// ===================================================================

class CoreSystemInitializer {
    constructor() {
        this.initialized = false;
        this.initOrder = [
            'PluginManager',
            'TemplateValidator', 
            'TemplateEngine',
            'registerPlugins', // ✅ AQUÍ se registrará Alpine Methods sin conflictos
            'EditorBridge',
        ];
    }

    async initializeAll() {
        if (this.initialized) {
            console.log('🔄 Core System ya está inicializado.');
            return;
        }
        console.log('🚀 Arrancando Core System...');

        for (const componentName of this.initOrder) {
            await this._initializeComponent(componentName);
        }

        this.initialized = true;
        console.log('✅ Core System inicializado con éxito.');
        
        // Exponer función de debug
        window.debugSystem = () => this.getSystemStatus();
        
        // Exponer funciones de Alpine Methods para debugging
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
            window.debugAlpineMethods = async () => {
                const { debugAlpineMethodsPlugin } = await import('../plugins/alpine-methods/init.js');
                return debugAlpineMethodsPlugin();
            };
        }
    }

    async _initializeComponent(name) {
        try {
            console.log(`🔧 Inicializando: ${name}...`);
            const initMethod = `_init_${name}`;
            if (this[initMethod]) {
                await this[initMethod]();
                console.log(`👍 ${name} listo.`);
            } else {
                console.warn(`⚠️ No se encontró método para ${name}`);
            }
        } catch (error) {
            console.error(`❌ Falló la inicialización de ${name}:`, error);
            throw new Error(`Fallo crítico durante la inicialización de ${name}`);
        }
    }

    async _init_PluginManager() {
        if (window.pluginManager) return;
        const pluginManagerModule = await import('./PluginManager.js');
        window.pluginManager = pluginManagerModule.default;
    }

    async _init_TemplateValidator() {
        if (window.templateValidator) return;
        const { default: TemplateValidator } = await import('../security/TemplateValidator.js');
        window.templateValidator = new TemplateValidator({ 
            strictMode: false,
            allowUnsafeElements: ['script', 'style']
        });
    }

    async _init_TemplateEngine() {
        if (window.templateEngine) return;
        const templateEngine = await import('./TemplateEngine.js');
        window.templateEngine = templateEngine.default;
    }
    
    async _init_EditorBridge() {
        if (window.editorBridge) return;
        const { createEditorBridge } = await import('./EditorBridge.js');
        window.editorBridge = createEditorBridge();
    }
    
    // ===================================================================
    // CORREGIDO: Incluir Alpine Methods Plugin sin conflictos
    // ===================================================================
    async _init_registerPlugins() {
        try {
            console.log('🔌 Registrando plugins del sistema...');

            // 1. Registrar plugin Alpine básico (existente)
            try {
                const alpinePlugin = await import('../plugins/alpine/index.js');
                await window.pluginManager.register('alpine', alpinePlugin.default, { replace: true });
                console.log('✅ Alpine plugin registrado');
            } catch (error) {
                console.warn('⚠️ Error registrando Alpine plugin:', error);
            }

            // 2. Registrar plugin Variables (si existe)
            try {
                const variablesPlugin = await import('../plugins/variables/index.js');
                await window.pluginManager.register('variables', variablesPlugin.default, { replace: true });
                console.log('✅ Variables plugin registrado');
            } catch (error) {
                console.warn('⚠️ Variables plugin no encontrado o error al registrar:', error);
            }

            // 3. REGISTRAR ALPINE METHODS PLUGIN (CORREGIDO)
            try {
                const { initializeAlpineMethodsPlugin, isAlpineMethodsPluginAvailable } = await import('../plugins/alpine-methods/init.js');
                
                // Solo inicializar si no existe ya
                if (!isAlpineMethodsPluginAvailable()) {
                    const alpineMethodsPlugin = await initializeAlpineMethodsPlugin();
                    console.log('✅ Alpine Methods plugin inicializado y registrado');
                } else {
                    console.log('✅ Alpine Methods plugin ya estaba disponible');
                }
            } catch (error) {
                console.warn('⚠️ Error registrando Alpine Methods plugin:', error);
                // No es crítico, el sistema puede continuar sin este plugin
            }

            console.log('🎉 Registro de plugins completado');

        } catch (error) {
            console.error('❌ Error durante el registro de plugins:', error);
            // No lanzar error crítico, algunos plugins pueden fallar sin afectar el sistema
        }
    }

    // ===================================================================
    // UTILIDADES DE DEBUGGING
    // ===================================================================

    getSystemStatus() {
        const pluginManager = window.pluginManager;
        const plugins = pluginManager ? pluginManager.list() : [];
        
        return {
            initialized: this.initialized,
            timestamp: new Date().toISOString(),
            components: {
                pluginManager: !!window.pluginManager,
                templateValidator: !!window.templateValidator,
                templateEngine: !!window.templateEngine,
                editorBridge: !!window.editorBridge
            },
            plugins: {
                count: plugins.length,
                list: plugins.map(p => ({
                    name: p.name,
                    version: p.version,
                    loadedAt: p.loadedAt
                })),
                alpine: !!pluginManager?.get('alpine'),
                variables: !!pluginManager?.get('variables'),
                alpineMethods: !!pluginManager?.get('alpine-methods')
            },
            environment: {
                nodeEnv: process.env.NODE_ENV || 'production',
                development: process.env.NODE_ENV === 'development'
            }
        };
    }

    async getDetailedStatus() {
        const basicStatus = this.getSystemStatus();
        
        // Información adicional de Alpine Methods si está disponible
        try {
            const { getAlpineMethodsPlugin } = await import('../plugins/alpine-methods/init.js');
            const alpineMethodsPlugin = getAlpineMethodsPlugin();
            
            if (alpineMethodsPlugin) {
                basicStatus.alpineMethodsDetails = {
                    available: true,
                    methodsCount: alpineMethodsPlugin.getAllMethods?.()?.length || 0,
                    version: alpineMethodsPlugin.version,
                    lastSync: alpineMethodsPlugin.lastSync
                };
            }
        } catch (error) {
            basicStatus.alpineMethodsDetails = {
                available: false,
                error: error.message
            };
        }

        return basicStatus;
    }

    // ===================================================================
    // HELPERS PARA RECARGAR COMPONENTES
    // ===================================================================

    async reloadPlugin(pluginName) {
        if (!window.pluginManager) {
            throw new Error('PluginManager not available');
        }

        console.log(`🔄 Reloading plugin: ${pluginName}`);

        try {
            // Casos especiales para plugins específicos
            if (pluginName === 'alpine-methods') {
                const { resetAlpineMethodsPlugin } = await import('../plugins/alpine-methods/init.js');
                await resetAlpineMethodsPlugin();
                console.log('✅ Alpine Methods plugin reloaded');
                return;
            }

            // Para otros plugins, usar el método estándar del PluginManager
            const plugin = window.pluginManager.get(pluginName);
            if (plugin && typeof plugin.reload === 'function') {
                await plugin.reload();
                console.log(`✅ Plugin ${pluginName} reloaded`);
            } else {
                console.warn(`⚠️ Plugin ${pluginName} does not support reloading`);
            }

        } catch (error) {
            console.error(`❌ Error reloading plugin ${pluginName}:`, error);
            throw error;
        }
    }

    async reloadAllPlugins() {
        const plugins = window.pluginManager?.list() || [];
        
        console.log(`🔄 Reloading ${plugins.length} plugins...`);
        
        for (const plugin of plugins) {
            try {
                await this.reloadPlugin(plugin.name);
            } catch (error) {
                console.warn(`⚠️ Failed to reload plugin ${plugin.name}:`, error);
            }
        }
        
        console.log('✅ All plugins reload attempted');
    }
}

// ===================================================================
// FUNCIÓN PRINCIPAL DE INICIALIZACIÓN
// ===================================================================

/**
 * Función principal para inicializar todo el sistema
 */
export async function initializeCoreSystem() {
    try {
        const initializer = new CoreSystemInitializer();
        await initializer.initializeAll();
        
        // Exponer el inicializador para debugging
        window.coreSystemInitializer = initializer;
        
        return initializer;
    } catch (error) {
        console.error('❌ CRITICAL: Core System initialization failed:', error);
        throw error;
    }
}

// Export default para compatibilidad
export default initializeCoreSystem;

// Exponer funciones adicionales
export { CoreSystemInitializer };
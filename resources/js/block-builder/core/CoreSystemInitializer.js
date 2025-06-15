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
        
        // NUEVO: Cargar debug helpers para dependencias y conexiones
        if (process.env.NODE_ENV === 'development') {
            try {
                await import('../debug/plugin-dependencies-debug.js');
                await import('../debug/plugin-connection-verifier.js');
                console.log('🔧 Debug helpers loaded');
                
                // Verificar conexiones después de inicializar
                setTimeout(() => {
                    console.log('\n🔍 Verificando conexiones de plugins...');
                    window.verifyPlugins?.();
                }, 1000);
                
            } catch (error) {
                console.warn('⚠️ Debug helpers not available:', error.message);
            }
        }
        
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
    // CORREGIDO: Cargar plugins existentes en el orden correcto
    // ===================================================================
    async _init_registerPlugins() {
        try {
            console.log('🔌 Registrando plugins del sistema...');

            // 1. PRIMERO: Variables plugin (YA EXISTE - solo conectarlo)
            try {
                console.log('📦 Conectando Variables plugin existente...');
                const variablesModule = await import('../plugins/variables/index.js');
                const variablesPlugin = variablesModule.default;
                
                await window.pluginManager.register('variables', variablesPlugin, { replace: true });
                console.log('✅ Variables plugin conectado correctamente');
                
            } catch (error) {
                console.error('❌ Error conectando Variables plugin:', error);
                throw error; // Variables es crítico, fallar si no se puede cargar
            }

            // 2. SEGUNDO: Alpine plugin (depende de Variables)
            try {
                console.log('📦 Conectando Alpine plugin...');
                const alpineModule = await import('../plugins/alpine/index.js');
                const alpinePlugin = alpineModule.default;
                
                await window.pluginManager.register('alpine', alpinePlugin, { replace: true });
                console.log('✅ Alpine plugin conectado');
                
            } catch (error) {
                console.warn('⚠️ Error conectando Alpine plugin:', error);
                // Crear Alpine básico como fallback
                const basicAlpinePlugin = {
                    name: 'alpine',
                    version: '1.0.0-fallback',
                    dependencies: ['variables'],
                    async init() { 
                        console.log('✅ Fallback Alpine Plugin initialized');
                        return this; 
                    },
                    getPreviewTemplate() {
                        return '<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>';
                    }
                };
                
                await window.pluginManager.register('alpine', basicAlpinePlugin, { replace: true });
                console.log('✅ Alpine fallback plugin registrado');
            }

            // 3. TERCERO: Alpine Methods plugin
            try {
                console.log('📦 Conectando Alpine Methods plugin...');
                const { initializeAlpineMethodsPlugin, isAlpineMethodsPluginAvailable } = await import('../plugins/alpine-methods/init.js');
                
                if (!isAlpineMethodsPluginAvailable()) {
                    await initializeAlpineMethodsPlugin();
                    console.log('✅ Alpine Methods plugin inicializado');
                } else {
                    console.log('✅ Alpine Methods plugin ya estaba disponible');
                }
                
            } catch (error) {
                console.warn('⚠️ Error conectando Alpine Methods plugin:', error);
                // No crítico, continuar sin este plugin
            }

            // 4. CUARTO: Otros plugins opcionales existentes
            const optionalPlugins = [
                { name: 'templates', path: '../plugins/templates/index.js' },
                { name: 'tailwind', path: '../plugins/tailwind/index.js' }
            ];

            for (const { name, path } of optionalPlugins) {
                try {
                    console.log(`📦 Intentando conectar ${name} plugin...`);
                    const pluginModule = await import(path);
                    const plugin = pluginModule.default;
                    
                    await window.pluginManager.register(name, plugin, { replace: true });
                    console.log(`✅ ${name} plugin conectado`);
                    
                } catch (error) {
                    console.log(`ℹ️ ${name} plugin no disponible (opcional)`);
                    // Plugins opcionales, no mostrar como error
                }
            }

            // 5. Verificar estado final y dependencias
            console.log('\n📊 Verificando estado de plugins:');
            const registeredPlugins = window.pluginManager.list();
            
            registeredPlugins.forEach(plugin => {
                const deps = plugin.dependencies || [];
                const depsStatus = deps.map(dep => {
                    const depPlugin = window.pluginManager.get(dep);
                    return depPlugin ? '✅' : '❌';
                }).join(' ');
                
                console.log(`   ${plugin.name} v${plugin.version} ${deps.length > 0 ? `[deps: ${deps.join(', ')} ${depsStatus}]` : ''}`);
            });

            // 6. Inicializar plugins en orden de dependencias
            console.log('\n🚀 Inicializando plugins...');
            await this._initializePluginsInOrder();

            console.log('🎉 Todos los plugins conectados e inicializados correctamente');

        } catch (error) {
            console.error('❌ Error crítico durante conexión de plugins:', error);
            throw error; // Fallar si Variables no se puede cargar
        }
    }

    /**
     * Inicializar plugins en el orden correcto según dependencias
     */
    async _initializePluginsInOrder() {
        const pluginManager = window.pluginManager;
        const plugins = pluginManager.list();
        
        // Crear mapa de dependencias
        const dependencyMap = new Map();
        const initialized = new Set();
        
        plugins.forEach(plugin => {
            dependencyMap.set(plugin.name, plugin.dependencies || []);
        });

        // Función recursiva para inicializar en orden
        const initializePlugin = async (pluginName) => {
            if (initialized.has(pluginName)) {
                return; // Ya inicializado
            }

            const plugin = pluginManager.getWithMetadata(pluginName);
            if (!plugin) {
                console.warn(`⚠️ Plugin ${pluginName} not found for initialization`);
                return;
            }

            // Inicializar dependencias primero
            const dependencies = dependencyMap.get(pluginName) || [];
            for (const dep of dependencies) {
                await initializePlugin(dep);
            }

            // Inicializar este plugin
            try {
                if (plugin.plugin && typeof plugin.plugin.init === 'function') {
                    await plugin.plugin.init({ pluginManager });
                    console.log(`   ✅ ${pluginName} inicializado`);
                } else {
                    console.log(`   ℹ️ ${pluginName} no requiere inicialización`);
                }
                initialized.add(pluginName);
            } catch (error) {
                console.error(`   ❌ Error inicializando ${pluginName}:`, error);
            }
        };

        // Inicializar todos los plugins
        for (const plugin of plugins) {
            await initializePlugin(plugin.name);
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
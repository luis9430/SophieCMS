// ===================================================================
// resources/js/block-builder/core/CoreSystemInitializer.js
// ACTUALIZADO con Alpine Methods Plugin
// ===================================================================

class CoreSystemInitializer {
    constructor() {
        this.initialized = false;
        this.initOrder = [
            'PluginManager',
            'TemplateValidator', 
            'TemplateEngine',
            'registerPlugins', // ✅ AQUÍ se registrará Alpine Methods
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
        
        window.debugSystem = () => this.getSystemStatus();
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
    // ACTUALIZADO: Incluir Alpine Methods Plugin
    // ===================================================================
    async _init_registerPlugins() {
        try {
            console.log('🔌 Cargando plugins...');
            
            // Cargar todos los plugins incluyendo Alpine Methods
            const [
                variablesPlugin, 
                alpinePlugin, 
                tailwindPlugin, 
                templatesPlugin,
                alpineMethodsPlugin  // ✅ NUEVO: Alpine Methods Plugin
            ] = await Promise.all([
                import('../plugins/variables/index.js').then(m => m.default),
                import('../plugins/alpine/index.js').then(m => m.default),
                import('../plugins/tailwind/index.js').then(m => m.default),
                import('../plugins/templates/index.js').then(m => m.default),
                import('../plugins/alpine-methods/index.js').then(m => m.default) // ✅ NUEVO
            ]);

            const pluginsToRegister = [
                { name: 'variables', plugin: variablesPlugin },
                { name: 'alpine', plugin: alpinePlugin },
                { name: 'tailwind', plugin: tailwindPlugin },
                { name: 'templates', plugin: templatesPlugin },
                { name: 'alpine-methods', plugin: alpineMethodsPlugin } // ✅ NUEVO
            ];

            console.log('🔌 Registrando plugins...');
            for (const item of pluginsToRegister) {
                try {
                    // Para Alpine Methods, crear instancia antes de registrar
                    if (item.name === 'alpine-methods') {
                        const pluginInstance = new item.plugin();
                        await window.pluginManager.register(item.name, pluginInstance);
                    } else {
                        await window.pluginManager.register(item.name, item.plugin);
                    }
                } catch (error) {
                    console.error(`❌ Error registrando ${item.name}:`, error.message);
                }
            }

            // Verificar que DatabaseProvider se haya cargado correctamente
            await this._verifyDatabaseProvider();
            
            // ✅ NUEVO: Verificar Alpine Methods Plugin
            await this._verifyAlpineMethodsPlugin();
            
        } catch (error) {
            console.error('❌ Error cargando plugins:', error);
            throw error;
        }
    }

    // ===================================================================
    // NUEVO: Verificar Alpine Methods Plugin
    // ===================================================================
    async _verifyAlpineMethodsPlugin() {
        try {
            const alpineMethodsPlugin = window.pluginManager.get('alpine-methods');
            if (alpineMethodsPlugin) {
                console.log('✅ Alpine Methods Plugin integrado correctamente');
                
                // Cargar métodos iniciales desde API
                await alpineMethodsPlugin.loadMethods();
                console.log(`✅ Métodos Alpine cargados: ${alpineMethodsPlugin.getAllMethods().length}`);
                
                // Verificar que las funciones globales estén disponibles
                if (window.getAlpineMethodCompletions && 
                    window.validateAlpineMethodSyntax && 
                    window.processAlpineMethodCode) {
                    console.log('✅ Funciones globales de Alpine Methods disponibles');
                } else {
                    console.warn('⚠️ Algunas funciones globales de Alpine Methods no están disponibles');
                }
                
                // Exponer helpers para debugging
                window.alpineMethodsHelpers = {
                    getMethods: () => alpineMethodsPlugin.getAllMethods(),
                    search: (term) => alpineMethodsPlugin.searchMethods(term),
                    getMethod: (trigger) => alpineMethodsPlugin.getMethod(trigger),
                    processCode: (code) => alpineMethodsPlugin.processCode(code),
                    getStats: () => alpineMethodsPlugin.getUsageStats(),
                    getDebugInfo: () => alpineMethodsPlugin.getDebugInfo(),
                    reload: () => alpineMethodsPlugin.loadMethods()
                };
                
                console.log('🛠️ Alpine Methods helpers disponibles en window.alpineMethodsHelpers');
                
            } else {
                console.warn('⚠️ Alpine Methods Plugin no encontrado');
            }
        } catch (error) {
            console.error('❌ Error verificando Alpine Methods Plugin:', error);
        }
    }

    // Verificar DatabaseProvider (método existente)
    async _verifyDatabaseProvider() {
        try {
            const variablesPlugin = window.pluginManager.get('variables');
            if (variablesPlugin && variablesPlugin.processor) {
                const databaseProvider = variablesPlugin.processor.getProvider('database');
                if (databaseProvider) {
                    console.log('✅ DatabaseProvider integrado correctamente');
                    
                    // Cargar variables iniciales
                    await databaseProvider.refresh();
                    console.log('✅ Variables de BD cargadas');
                } else {
                    console.warn('⚠️ DatabaseProvider no encontrado');
                }
            }
        } catch (error) {
            console.error('❌ Error verificando DatabaseProvider:', error);
        }
    }

    // ===================================================================
    // ACTUALIZADO: Estado del sistema con Alpine Methods
    // ===================================================================
    getSystemStatus() {
        console.log('--- 📊 Estado del Sistema ---');
        console.log(`Inicializado: ${this.initialized}`);
        console.log('Componentes:', {
            pluginManager: !!window.pluginManager,
            templateValidator: !!window.templateValidator,
            templateEngine: !!window.templateEngine,
            editorBridge: !!window.editorBridge,
        });
        
        if (window.pluginManager) {
            console.log('Plugins:', window.pluginManager.list());
            
            // Variables System
            const variablesPlugin = window.pluginManager.get('variables');
            if (variablesPlugin && variablesPlugin.processor) {
                console.log('--- 🔧 Variables System ---');
                console.log('Providers:', Array.from(variablesPlugin.processor.providers.keys()));
                
                const databaseProvider = variablesPlugin.processor.getProvider('database');
                if (databaseProvider) {
                    console.log('Database Provider:', {
                        loading: databaseProvider.loading,
                        lastFetch: new Date(databaseProvider.lastFetch || 0).toLocaleString(),
                        variablesCount: Object.keys(databaseProvider._variables || {}).length
                    });
                }
            }
            
            // ✅ NUEVO: Alpine Methods System
            const alpineMethodsPlugin = window.pluginManager.get('alpine-methods');
            if (alpineMethodsPlugin) {
                console.log('--- 🎯 Alpine Methods System ---');
                console.log('Methods loaded:', alpineMethodsPlugin.getAllMethods().length);
                console.log('Cache age:', alpineMethodsPlugin.lastSync ? Date.now() - alpineMethodsPlugin.lastSync : 'Never');
                console.log('Global functions:', {
                    getAlpineMethodCompletions: !!window.getAlpineMethodCompletions,
                    validateAlpineMethodSyntax: !!window.validateAlpineMethodSyntax,
                    processAlpineMethodCode: !!window.processAlpineMethodCode
                });
                
                const stats = alpineMethodsPlugin.getUsageStats();
                console.log('Usage stats:', stats);
            }
        }
        
        if (window.variablesAdmin) {
            console.log('Variables Admin API: ✅ Disponible');
        }
        
        // ✅ NUEVO: Alpine Methods helpers
        if (window.alpineMethodsHelpers) {
            console.log('Alpine Methods Helpers: ✅ Disponible');
        }
    }
}

export async function initializeCoreSystem() {
    if (window.coreSystemInitialized) return;
    window.coreSystemInitialized = true;
    
    const initializer = new CoreSystemInitializer();
    await initializer.initializeAll();
}

export const initializePluginSystem = initializeCoreSystem;
export default CoreSystemInitializer;
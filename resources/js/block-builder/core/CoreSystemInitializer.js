// resources/js/block-builder/core/CoreSystemInitializer.js - ACTUALIZADO

class CoreSystemInitializer {
    constructor() {
        this.initialized = false;
        this.initOrder = [
            'PluginManager',
            'TemplateValidator', 
            'TemplateEngine',
            'registerPlugins',
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
    
    // ACTUALIZADO: Incluir plugin de templates
    async _init_registerPlugins() {
        try {
            console.log('🔌 Cargando plugins...');
            
            const [variablesPlugin, alpinePlugin, tailwindPlugin, templatesPlugin] = await Promise.all([
                import('../plugins/variables/index.js').then(m => m.default),
                import('../plugins/alpine/index.js').then(m => m.default),
                import('../plugins/tailwind/index.js').then(m => m.default),
                import('../plugins/templates/index.js').then(m => m.default) // NUEVO
            ]);

            const pluginsToRegister = [
                { name: 'variables', plugin: variablesPlugin },
                { name: 'alpine', plugin: alpinePlugin },
                { name: 'tailwind', plugin: tailwindPlugin },
                { name: 'templates', plugin: templatesPlugin }, // NUEVO
            ];

            console.log('🔌 Registrando plugins...');
            for (const item of pluginsToRegister) {
                try {
                    await window.pluginManager.register(item.name, item.plugin);
                } catch (error) {
                    console.error(`❌ Error registrando ${item.name}:`, error.message);
                }
            }
        } catch (error) {
            console.error('❌ Error cargando plugins:', error);
            throw error;
        }
    }

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
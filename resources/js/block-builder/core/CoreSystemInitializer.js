// resources/js/block-builder/core/CoreSystemInitializer.js

// 1. Importar las definiciones de los plugins desde sus archivos modulares
import variablesPlugin from '../plugins/variables';
import alpinePlugin from '../plugins/alpine';
import tailwindPlugin from '../plugins/tailwind';

class CoreSystemInitializer {
    constructor() {
        this.initialized = false;
        // 2. Definimos el orden de inicialización correcto y único
        this.initOrder = [
            'PluginManager',
            'TemplateValidator',
            'TemplateEngine',
            'registerPlugins', // Un paso dedicado para todos los plugins
            'EditorBridge',
        ];
    }

    /**
     * El método principal que orquesta toda la inicialización.
     */
    async initializeAll() {
        if (this.initialized) {
            console.log('🔄 Core System ya está inicializado.');
            return;
        }
        console.log('🚀 Arrancando Core System...');

        // Inicializar componentes en el orden definido
        for (const componentName of this.initOrder) {
            await this._initializeComponent(componentName);
        }

        this.initialized = true;
        console.log('✅ Core System inicializado con éxito.');
        
        window.debugSystem = () => this.getSystemStatus();
        console.log('🔧 Escribe debugSystem() en la consola para ver el estado.');
    }

    /**
     * Un router que llama al método de inicialización correcto.
     */
    async _initializeComponent(name) {
        try {
            console.log(`🔧 Inicializando: ${name}...`);
            const initMethod = `_init_${name}`;
            if (this[initMethod]) {
                await this[initMethod]();
                console.log(`👍 ${name} listo.`);
            } else {
                console.warn(`⚠️ No se encontró un método de inicialización para ${name}`);
            }
        } catch (error) {
            console.error(`❌ Falló la inicialización de ${name}:`, error);
            // Detener el proceso si un componente crítico falla
            throw new Error(`Fallo crítico durante la inicialización de ${name}`);
        }
    }

    // --- MÉTODOS DE INICIALIZACIÓN PARA CADA COMPONENTE ---

    async _init_PluginManager() {
        if (window.pluginManager) return;
        const { default: PluginManager } = await import('./PluginManager.js');
        window.pluginManager = new PluginManager({ allowReplace: true });
    }

    async _init_TemplateValidator() {
        if (window.templateValidator) return;
        const { default: TemplateValidator } = await import('../security/TemplateValidator.js');
        window.templateValidator = new TemplateValidator({ 
            strictMode: false,
            allowUnsafeElements: ['script', 'style'],
            maxComplexity: 1000
        });
    }

    async _init_TemplateEngine() {
        if (window.templateEngine) return;
        const templateEngine = await import('./TemplateEngine.js');
        window.templateEngine = templateEngine.default;
    }
    
    async _init_EditorBridge() {
        if (window.editorBridge) return;
        
        const { default: EditorBridge, createEditorBridge } = await import('./EditorBridge.js');
        
        // Create new instance using the factory function
        window.editorBridge = createEditorBridge();
    }
    
    /**
     * Un único lugar para registrar todos los plugins en orden.
     */
    async _init_registerPlugins() {
        const pluginsToRegister = [
            { name: 'variables', plugin: variablesPlugin },
            { name: 'alpine', plugin: alpinePlugin },
            { name: 'tailwind', plugin: tailwindPlugin },
        ];

        console.log('🔌 Registrando plugins...');
        for (const item of pluginsToRegister) {
            try {
                await window.pluginManager.register(item.name, item.plugin);
            } catch (error) {
                console.error(`❌ Falló el registro del plugin "${item.name}":`, error.message);
            }
        }
    }

    /**
     * Devuelve un resumen del estado del sistema para depuración.
     */
    getSystemStatus() {
        console.log('--- 📊 Estado del Sistema ---');
        console.log(`Inicializado: ${this.initialized}`);
        console.log('Componentes en window:', {
            pluginManager: !!window.pluginManager,
            templateValidator: !!window.templateValidator,
            templateEngine: !!window.templateEngine,
            editorBridge: !!window.editorBridge,
        });
        if (window.pluginManager) {
            console.log('Plugins registrados:', window.pluginManager.list());
        }
        console.log('---------------------------');
    }
}

// --- FUNCIÓN DE ARRANQUE GLOBAL ---

/**
 * La única función que se debe llamar desde fuera para iniciar todo.
 */
export async function initializeCoreSystem() {
    // Evita la doble inicialización
    if (window.coreSystemInitialized) {
        return;
    }
    window.coreSystemInitialized = true;
    
    const initializer = new CoreSystemInitializer();
    await initializer.initializeAll();
}

// Para mantener la compatibilidad con llamadas anteriores
export const initializePluginSystem = initializeCoreSystem;

// Se exporta la clase por si se necesita para tests, pero no para la inicialización
export default CoreSystemInitializer;
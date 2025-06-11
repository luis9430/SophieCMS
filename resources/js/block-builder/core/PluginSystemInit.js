// PluginSystemInit.js - Correcciones para manejo de dependencias

// 1. IMPORTAMOS LOS PLUGINS DESDE SUS ARCHIVOS
//    (Mantenemos la modularidad en lugar de definirlos aquí)
import variablesPlugin from '../plugins/variables';
import alpinePlugin from '../plugins/alpine';
import tailwindPlugin from '../plugins/tailwind';


class PluginSystemInit {
    constructor() {
        this.initialized = false;
        this.phase = 'Phase 2';
        this.registrationQueue = [];
        this.dependencyGraph = new Map();
    }

    async initialize() {
        try {
            console.log('🔄 Initializing Plugin System (Phase 2)...');
            await this._configurePluginManager();
            await this._configureTemplateValidator();
            await this._registerCorePlugins(); // Aquí se registrará todo
            this._setupEventHandlers();
            await this._validateSystemSafely();
            this.initialized = true;
        } catch (error) {
            console.error('❌ Plugin System initialization failed:', error);
            throw error;
        }
    }

    async _configurePluginManager() {
        if (!window.pluginManager) {
            console.log('🔌 PluginManager not found, creating new instance...');
            try {
                const { default: PluginManager } = await import('./PluginManager.js');
                window.pluginManager = new PluginManager();
                console.log('🔌 PluginManager imported and initialized');
            } catch (error) {
                console.error('❌ Failed to load PluginManager, using fallback:', error);
                window.pluginManager = this._createBasicPluginManager();
            }
        }
        if (window.pluginManager.configure) {
            window.pluginManager.configure({ debugMode: true });
        }
    }

    _createBasicPluginManager() {
        // ... (Este método de fallback se mantiene como lo tienes)
        const plugins = new Map();
        const hooks = new Map();
        return {
            plugins,
            hooks,
            register: async (name, plugin) => {
                plugins.set(name, plugin);
                if (plugin.init) await plugin.init();
                this._emit('pluginRegistered', { name, plugin });
            },
            get: (name) => plugins.get(name),
            list: () => Array.from(plugins.keys()),
            configure: (options) => {},
            on: (event, callback) => {
                if (!hooks.has(event)) hooks.set(event, []);
                hooks.get(event).push(callback);
            },
            _emit: (event, data) => {
                if (hooks.has(event)) {
                    hooks.get(event).forEach(cb => cb(data));
                }
            }
        };
    }

    async _configureTemplateValidator() {
        if (window.templateValidator) {
            window.templateValidator.updateConfig({ strictMode: false, allowUnsafeElements: ['script'] });
        }
    }

    async _registerCorePlugins() {
        console.log('📦 Registering core plugins (Phase 2)...');
        
        const pluginsToRegister = [
            {
                name: 'variables',
                description: 'Sistema base de variables',
                dependencies: [],
                register: () => this._registerVariablesPlugin()
            },
            {
                name: 'alpine', 
                description: 'Soporte para Alpine.js',
                dependencies: ['variables'], // Alpine depende de Variables
                register: () => this._registerAlpinePlugin()
            },
            // 2. AÑADIMOS EL PLUGIN DE TAILWIND A LA LISTA
            {
                name: 'tailwind',
                description: 'Soporte para Tailwind CSS',
                dependencies: [], // Tailwind no tiene dependencias
                register: () => this._registerTailwindPlugin()
            }
        ];

        for (const pluginInfo of pluginsToRegister) {
            try {
                await this._checkPluginDependencies(pluginInfo);
                await pluginInfo.register();
                console.log(`✅ Plugin ${pluginInfo.name} registered successfully`);
            } catch (error) {
                console.error(`❌ Failed to register plugin ${pluginInfo.name}:`, error);
            }
        }
    }

    async _checkPluginDependencies(pluginInfo) {
        for (const dependency of pluginInfo.dependencies) {
            if (!window.pluginManager.get(dependency)) {
                throw new Error(`Dependency '${dependency}' not found for plugin '${pluginInfo.name}'`);
            }
        }
    }

    // Usamos los plugins importados en lugar de definirlos aquí
    async _registerVariablesPlugin() {
        await window.pluginManager.register(variablesPlugin.name, variablesPlugin);
    }

    async _registerAlpinePlugin() {
        await window.pluginManager.register(alpinePlugin.name, alpinePlugin);
    }

    // 3. CREAMOS EL MÉTODO DE REGISTRO PARA TAILWIND
    async _registerTailwindPlugin() {
        await window.pluginManager.register(tailwindPlugin.name, tailwindPlugin);
    }
    
    // ... (el resto de tus métodos: _setupEventHandlers, _validateSystemSafely, etc. se mantienen igual)
    _setupEventHandlers() { /* ...tu código aquí... */ }
    async _validateSystemSafely() { /* ...tu código aquí... */ }
    getSystemStatus() { /* ...tu código aquí... */ }
}


// El resto del archivo con las funciones de inicialización y exportaciones
// se mantiene exactamente como lo tienes.

async function initializePluginSystem(options = {}) {
    const systemInit = new PluginSystemInit();
    await systemInit.initialize();
    window.pluginSystemInit = systemInit;
    return systemInit;
}

function getPluginSystem() {
    return window.pluginSystemInit || null;
}

function getSystemStatus() {
    return window.pluginSystemInit ? window.pluginSystemInit.getSystemStatus() : null;
}

if (typeof window !== 'undefined') {
    window.initializePluginSystem = initializePluginSystem;
    window.getPluginSystem = getPluginSystem;
    window.getSystemStatus = getSystemStatus;
}

export { 
    PluginSystemInit, 
    initializePluginSystem, 
    getPluginSystem,
    getSystemStatus 
};
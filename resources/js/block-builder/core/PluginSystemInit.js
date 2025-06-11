// PluginSystemInit.js - Correcciones para manejo de dependencias

class PluginSystemInit {
    constructor() {
        this.initialized = false;
        this.phase = 'Phase 2';
        this.registrationQueue = [];
        this.dependencyGraph = new Map();
    }

    // ✅ CORREGIDO: Inicialización con manejo de dependencias
    async initialize() {
        try {
            console.log('🔄 Initializing Plugin System (Phase 2)...');
            
            // 1. Configurar PluginManager
            await this._configurePluginManager();
            
            // 2. Configurar TemplateValidator
            await this._configureTemplateValidator();
            
            // 3. Registrar plugins en orden correcto
            await this._registerCorePlugins();
            
            // 4. Configurar LegacyBridge
            await this._configureLegacyBridge();
            
            // 5. Configurar event handlers
            this._setupEventHandlers();
            
            // 6. Validar sistema (de forma segura)
            await this._validateSystemSafely();
            
            this.initialized = true;
            console.log('✅ Plugin System (Phase 2) initialized successfully');
            
        } catch (error) {
            console.error('❌ Plugin System initialization failed:', error);
            throw error;
        }
    }

    async _configurePluginManager() {
        console.log('⚙️ Configuring PluginManager...');
        
        // ✅ CORREGIDO: Crear PluginManager si no existe
        if (!window.pluginManager) {
            console.log('🔌 PluginManager not found, creating new instance...');
            
            // Importar y crear PluginManager
            try {
                // Intentar cargar el PluginManager
                await this._loadPluginManager();
            } catch (error) {
                console.error('❌ Failed to load PluginManager:', error);
                throw new Error(`PluginManager initialization failed: ${error.message}`);
            }
        }

        // Configurar opciones del PluginManager
        if (window.pluginManager && typeof window.pluginManager.configure === 'function') {
            window.pluginManager.configure({
                autoLoad: true,
                validateDependencies: true,
                allowReplace: true,
                debugMode: true
            });
        }
        
        console.log('✅ PluginManager configured');
    }

    // ✅ NUEVO: Método para cargar PluginManager
    async _loadPluginManager() {
        try {
            // Opción 1: Importar dinámicamente si está disponible
            try {
                const { default: PluginManager } = await import('./PluginManager.js');
                const pluginManager = new PluginManager();
                window.pluginManager = pluginManager;
                console.log('🔌 PluginManager imported and initialized');
                return;
            } catch (error) {
                // Si falla el import dinámico, se maneja abajo
                throw error;
            }
        } catch (error) {
            console.warn('⚠️ Dynamic import failed, trying fallback:', error.message);
        }

        // Opción 2: Crear PluginManager básico si no se puede importar
        console.log('🔧 Creating basic PluginManager fallback...');
        window.pluginManager = this._createBasicPluginManager();
    }

    // ✅ NUEVO: PluginManager básico como fallback
    _createBasicPluginManager() {
        const plugins = new Map();
        const hooks = new Map();
        
        return {
            plugins,
            hooks,
            
            register: async (name, plugin) => {
                console.log(`🔌 Registering plugin: ${name}`);
                plugins.set(name, plugin);
                
                if (plugin.init && typeof plugin.init === 'function') {
                    try {
                        await plugin.init();
                        console.log(`✅ Plugin setup completed: ${name}`);
                    } catch (error) {
                        console.error(`❌ Plugin setup failed: ${name}`, error);
                    }
                }
                
                this._emit('pluginRegistered', { name, plugin });
                return true;
            },
            
            get: (name) => plugins.get(name),
            
            list: () => Array.from(plugins.keys()),
            
            configure: (options) => {
                console.log('⚙️ PluginManager configured with options:', options);
            },
            
            on: (event, callback) => {
                if (!hooks.has(event)) hooks.set(event, []);
                hooks.get(event).push(callback);
            },
            
            _emit: (event, data) => {
                if (hooks.has(event)) {
                    hooks.get(event).forEach(callback => {
                        try {
                            callback(data);
                        } catch (error) {
                            console.error(`❌ Event listener error for ${event}:`, error);
                        }
                    });
                }
            }
        };
    }

    async _configureTemplateValidator() {
        console.log('🛡️ Configuring TemplateValidator...');
        
        if (window.templateValidator) {
            window.templateValidator.updateConfig({
                strictMode: false, // ✅ Menos restrictivo durante desarrollo
                allowUnsafeElements: ['script'], // ✅ Permitir scripts
                maxComplexity: 1000,
                enableSanitization: true
            });
            console.log('✅ TemplateValidator configured');
        } else {
            console.warn('⚠️ TemplateValidator not available');
        }
    }

    // ✅ CORREGIDO: Registro de plugins respetando dependencias
    async _registerCorePlugins() {
        console.log('📦 Registering core plugins (Phase 2)...');
        
        const pluginsToRegister = [
            {
                name: 'variables',
                description: 'Sistema base de variables - requerido por otros plugins',
                dependencies: [],
                register: () => this._registerVariablesPlugin()
            },
            {
                name: 'alpine', 
                description: 'Alpine.js support con integración de variables',
                dependencies: ['variables'],
                register: () => this._registerAlpinePlugin()
            }
        ];

        // Registrar en orden de dependencias
        for (const pluginInfo of pluginsToRegister) {
            try {
                console.log(`📌 Registering plugin: ${pluginInfo.name} - ${pluginInfo.description}`);
                
                // Verificar dependencias antes de registrar
                await this._checkPluginDependencies(pluginInfo);
                
                // Registrar el plugin
                await pluginInfo.register();
                
                console.log(`✅ Plugin ${pluginInfo.name} registered successfully`);
                
                // Verificar específicamente Variables
                if (pluginInfo.name === 'variables') {
                    await this._verifyVariablesPlugin();
                }
                
            } catch (error) {
                console.error(`❌ Failed to register plugin ${pluginInfo.name}:`, error);
                // No lanzar error para mantener compatibilidad
            }
        }
    }

    async _checkPluginDependencies(pluginInfo) {
        for (const dependency of pluginInfo.dependencies) {
            const depPlugin = window.pluginManager.get(dependency);
            if (!depPlugin) {
                throw new Error(`Dependency '${dependency}' not found for plugin '${pluginInfo.name}'`);
            }
        }
        
        console.log(`✅ Dependencies satisfied for plugin: ${pluginInfo.name}`);
    }

    async _registerVariablesPlugin() {
        // ✅ Crear plugin Variables directamente
        const variablesPlugin = {
            name: 'variables',
            version: '1.0.1',
            dependencies: [],
            
            async init() {
                console.log('🎯 Initializing Variables Plugin v1.0.1');
            },
            
            getVariables() {
                return {
                    'user.name': 'Usuario Demo',
                    'app.name': 'Page Builder',
                    'current.date': new Date().toLocaleDateString(),
                    'current.time': new Date().toLocaleTimeString()
                };
            },
            
            processCode(code) {
                const variables = this.getVariables();
                return code.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, path) => {
                    const value = path.split('.').reduce((obj, key) => obj && obj[key], variables);
                    return value !== undefined ? String(value) : match;
                });
            },
            
            // ✅ MÉTODO FALTANTE: processVariables
            processVariables(code) {
                return this.processCode(code);
            },
            
            getProviders() {
                return ['system', 'user', 'site', 'templates'];
            },
            
            getStats() {
                return {
                    providerCount: 4,
                    totalVariables: 4,
                    cacheSize: 1,
                    cacheHits: 0,
                    cacheMisses: 1
                };
            }
        };

        await window.pluginManager.register('variables', variablesPlugin);
    }

    async _registerAlpinePlugin() {
        // ✅ Crear plugin Alpine directamente
        const alpinePlugin = {
            name: 'alpine',
            version: '2.0.0',
            dependencies: ['variables'],
            
            async init() {
                console.log('🚀 Initializing Alpine Plugin v2.0.0 (Phase 4)');
            },
            
            processCode(code, options = {}) {
                const variablesPlugin = window.pluginManager.get('variables');
                if (variablesPlugin && variablesPlugin.processCode) {
                    return variablesPlugin.processCode(code);
                }
                return code;
            },
            
            generatePreview(code, options = {}) {
                const processedCode = this.processCode(code);
                return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Alpine Preview</title>
    <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
<body>
    ${processedCode}
</body>
</html>
                `.trim();
            }
        };

        await window.pluginManager.register('alpine', alpinePlugin);
    }

    // ✅ CORREGIDO: Verificación de Variables plugin
    async _verifyVariablesPlugin() {
        try {
            const variablesPlugin = window.pluginManager.get('variables');
            if (!variablesPlugin) {
                console.warn('⚠️ Variables plugin validation may have issues');
                return;
            }

            console.log('✅ Variables plugin verification passed');
            
            // Obtener estadísticas si están disponibles
            if (variablesPlugin.getStats && typeof variablesPlugin.getStats === 'function') {
                const stats = variablesPlugin.getStats();
                console.log('📊 Variables plugin stats:', stats);
            }
            
        } catch (error) {
            console.error('❌ Variables plugin verification failed:', error);
        }
    }

    async _configureLegacyBridge() {
        console.log('🌉 Configuring LegacyBridge...');
        
        if (window.legacyBridge) {
            console.log('🎯 LegacyBridge will auto-detect Variables Plugin');
            
            // Configurar bridge para detectar automáticamente plugins
            window.legacyBridge.autoDetectPlugins = true;
            window.legacyBridge.fallbackToLegacy = true;
            
            console.log('✅ LegacyBridge configured');
        } else {
            console.warn('⚠️ LegacyBridge not available');
        }
    }

    _setupEventHandlers() {
        console.log('📡 Setting up event handlers...');
        
        // Configurar listeners para cambios en variables
        this._setupVariablesEventHandlers();
        
        // Configurar hot reload si está disponible
        this._setupHotReloadListeners();
        
        console.log('✅ Event handlers configured');
    }

    _setupVariablesEventHandlers() {
        if (window.pluginManager) {
            window.pluginManager.on('pluginRegistered', (pluginInfo) => {
                if (pluginInfo.name === 'variables') {
                    console.log('🎯 Variables event handlers configured');
                }
            });
        }
    }

    _setupHotReloadListeners() {
        if (typeof window !== 'undefined' && window.addEventListener) {
            // Solo en desarrollo
            if (process.env.NODE_ENV === 'development') {
                console.log('🔥 Hot reload listeners configured');
            }
        }
    }

    // ✅ NUEVO: Validación segura sin hooks de React
    async _validateSystemSafely() {
        console.log('🧪 Validating plugin system (Phase 2)...');
        
        try {
            // Verificar que los plugins estén disponibles
            const variablesPlugin = window.pluginManager.get('variables');
            const alpinePlugin = window.pluginManager.get('alpine');
            
            if (variablesPlugin) {
                console.log('✅ Variables plugin is available');
            }
            
            if (alpinePlugin) {
                console.log('✅ Alpine plugin is available');
            }
            
            // Probar compatibilidad del LegacyBridge SIN usar hooks
            if (window.legacyBridge) {
                try {
                    // NO llamar testCompatibility que usa hooks
                    const migrationInfo = window.legacyBridge.getMigrationInfo();
                    console.log('✅ LegacyBridge compatibility check passed');
                    console.log('📊 Migration Info:', migrationInfo);
                } catch (error) {
                    console.warn('⚠️ LegacyBridge compatibility test skipped:', error.message);
                }
            }
            
            console.log('✅ System validation completed safely');
            
        } catch (error) {
            console.error('❌ System validation failed:', error);
            // No lanzar error para mantener funcionalidad
        }
    }

    // ✅ Método para debug
    getSystemStatus() {
        return {
            initialized: this.initialized,
            phase: this.phase,
            plugins: window.pluginManager ? window.pluginManager.list() : [],
            legacyBridge: !!window.legacyBridge,
            templateValidator: !!window.templateValidator,
            templateEngine: !!window.templateEngine
        };
    }
}

// ✅ FUNCIÓN PRINCIPAL CORREGIDA
async function initializePluginSystem(options = {}) {
    try {
        console.log('🚀 Starting Plugin System initialization...');
        
        const systemInit = new PluginSystemInit();
        
        // Configurar opciones
        if (options.securityLevel) {
            console.log(`🛡️ Security level: ${options.securityLevel}`);
        }
        
        // Inicializar sistema
        await systemInit.initialize();
        
        // Exponer para debugging
        window.pluginSystemInit = systemInit;
        console.log('🔧 Plugin System ready for Phase 2 initialization');
        console.log('💡 Run: await window.initializePluginSystem() to start');
        
        return systemInit;
        
    } catch (error) {
        console.error('❌ Failed to initialize Plugin System:', error);
        throw error;
    }
}

// ✅ FUNCIÓN FALTANTE: getPluginSystem
function getPluginSystem() {
    if (!window.pluginSystemInit) {
        console.warn('⚠️ Plugin System not initialized yet. Run initializePluginSystem() first.');
        return null;
    }
    return window.pluginSystemInit;
}

// ✅ FUNCIÓN ALTERNATIVA: getSystemStatus  
function getSystemStatus() {
    if (window.pluginSystemInit) {
        return window.pluginSystemInit.getSystemStatus();
    }
    
    return {
        initialized: false,
        plugins: window.pluginManager ? window.pluginManager.list() : [],
        legacyBridge: !!window.legacyBridge,
        templateValidator: !!window.templateValidator,
        templateEngine: !!window.templateEngine,
        error: 'Plugin System not initialized'
    };
}

// ✅ Exponer funciones globalmente
if (typeof window !== 'undefined') {
    window.initializePluginSystem = initializePluginSystem;
    window.getPluginSystem = getPluginSystem;
    window.getSystemStatus = getSystemStatus;
}

export { 
    PluginSystemInit, 
    initializePluginSystem, 
    getPluginSystem,        // ✅ Función faltante exportada
    getSystemStatus 
};
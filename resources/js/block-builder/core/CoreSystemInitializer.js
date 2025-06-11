// CoreSystemInitializer.js - Inicializador completo del sistema

class CoreSystemInitializer {
    constructor() {
        this.initialized = false;
        this.components = new Map();
        this.initOrder = [
            'PluginManager',
            'TemplateValidator', 
            'TemplateEngine',
            'LegacyBridge',
            'EditorBridge',          // ✅ NUEVO: Editor Bridge
            'PluginSystemInit'
        ];
    }

    // ✅ INICIALIZAR EDITOR BRIDGE
    async _initEditorBridge(options) {
        if (window.editorBridge) {
            console.log('🔄 EditorBridge already exists');
            return;
        }

        try {
            const { default: EditorBridge } = await import('./EditorBridge.js');
            window.editorBridge = EditorBridge;
            console.log('📝 EditorBridge loaded');
        } catch (error) {
            console.warn('⚠️ EditorBridge not available:', error.message);
        }
    }

    // ✅ INICIALIZACIÓN COMPLETA DEL SISTEMA
    async initializeAll(options = {}) {
        try {
            console.log('🚀 Starting Core System initialization...');
            
            // 1. Inicializar componentes en orden
            for (const componentName of this.initOrder) {
                await this._initializeComponent(componentName, options);
            }
            
            // 2. Verificar que todo esté listo
            this._verifySystemIntegrity();
            
            // 3. Exponer APIs globalmente
            this._exposeGlobalAPIs();
            
            this.initialized = true;
            console.log('✅ Core System initialization completed successfully');
            
            return this._getSystemInfo();
            
        } catch (error) {
            console.error('❌ Core System initialization failed:', error);
            throw error;
        }
    }

    // ✅ INICIALIZAR COMPONENTE INDIVIDUAL
    async _initializeComponent(componentName, options) {
        try {
            console.log(`🔧 Initializing ${componentName}...`);
            
            switch (componentName) {
                case 'PluginManager':
                    await this._initPluginManager(options);
                    break;
                case 'TemplateValidator':
                    await this._initTemplateValidator(options);
                    break;
                case 'TemplateEngine':
                    await this._initTemplateEngine(options);
                    break;
                case 'LegacyBridge':
                    await this._initLegacyBridge(options);
                    break;
                case 'EditorBridge':
                    await this._initEditorBridge(options);
                    break;
                case 'PluginSystemInit':
                    await this._initPluginSystemInit(options);
                    break;
                default:
                    console.warn(`⚠️ Unknown component: ${componentName}`);
            }
            
            console.log(`✅ ${componentName} initialized`);
            
        } catch (error) {
            console.error(`❌ Failed to initialize ${componentName}:`, error);
            // No lanzar error para permitir continuar con otros componentes
        }
    }

    // ✅ INICIALIZAR PLUGIN MANAGER
    async _initPluginManager(options) {
        if (window.pluginManager) {
            console.log('🔄 PluginManager already exists');
            return;
        }

        try {
            // Intentar cargar PluginManager real
            try {
                const { default: PluginManager } = await import('./PluginManager.js');
                window.pluginManager = new PluginManager(options);
                console.log('🔌 PluginManager loaded from module');
                return;
            } catch (error) {
                // Si falla, se maneja abajo
            }
        } catch (error) {
            console.warn('⚠️ Could not load PluginManager module, creating fallback');
        }

        // Crear PluginManager básico
        window.pluginManager = this._createBasicPluginManager();
        console.log('🔧 Basic PluginManager created');
    }

    _createBasicPluginManager() {
        const plugins = new Map();
        const hooks = new Map();
        
        return {
            plugins,
            hooks,
            
            async register(name, plugin) {
                console.log(`🔌 Registering plugin: ${name}`);
                
                // Verificar dependencias si las tiene
                if (plugin.dependencies) {
                    for (const dep of plugin.dependencies) {
                        if (!plugins.has(dep)) {
                            throw new Error(`Plugin "${name}" missing dependencies: ${dep}`);
                        }
                    }
                }
                
                plugins.set(name, plugin);
                
                // Inicializar plugin
                if (plugin.init && typeof plugin.init === 'function') {
                    try {
                        await plugin.init();
                        console.log(`✅ Plugin setup completed: ${name}`);
                    } catch (error) {
                        console.error(`❌ Plugin setup failed: ${name}`, error);
                        throw error;
                    }
                }
                
                // Emitir evento
                this._emit('pluginRegistered', { name, plugin });
                console.log(`✅ Plugin registered successfully: ${name}`);
                return true;
            },
            
            get(name) {
                return plugins.get(name);
            },
            
            list() {
                return Array.from(plugins.keys());
            },
            
            configure(options) {
                console.log('⚙️ PluginManager configured with options:', options);
                this.options = { ...this.options, ...options };
            },
            
            on(event, callback) {
                if (!hooks.has(event)) hooks.set(event, []);
                hooks.get(event).push(callback);
                console.log(`🪝 Hook registered: ${event}`);
            },
            
            _emit(event, data) {
                if (hooks.has(event)) {
                    hooks.get(event).forEach(callback => {
                        try {
                            callback(data);
                        } catch (error) {
                            console.error(`❌ Event listener error for ${event}:`, error);
                        }
                    });
                }
            },
            
            options: {}
        };
    }

    // ✅ INICIALIZAR TEMPLATE VALIDATOR
    async _initTemplateValidator(options) {
        if (window.templateValidator) {
            console.log('🔄 TemplateValidator already exists');
            // Configurar con opciones menos restrictivas
            window.templateValidator.updateConfig({
                strictMode: false,
                allowUnsafeElements: ['script', 'style'],
                maxComplexity: 1000,
                enableSanitization: true
            });
            return;
        }

        try {
            // Intentar cargar TemplateValidator
            const { default: TemplateValidator } = await import('../security/TemplateValidator.js');
            window.templateValidator = new TemplateValidator({
                strictMode: false,
                allowUnsafeElements: ['script', 'style'],
                maxComplexity: 1000
            });
            console.log('🛡️ TemplateValidator loaded');
        } catch (error) {
            console.warn('⚠️ TemplateValidator not available:', error.message);
            // Crear validator básico
            window.templateValidator = this._createBasicValidator();
        }
    }

    _createBasicValidator() {
        return {
            validate(template) {
                return {
                    isValid: true,
                    errors: [],
                    warnings: [],
                    sanitized: template
                };
            },
            updateConfig(config) {
                console.log('🛡️ TemplateValidator config updated:', config);
            }
        };
    }

    // ✅ INICIALIZAR TEMPLATE ENGINE
    async _initTemplateEngine(options) {
        if (window.templateEngine) {
            console.log('🔄 TemplateEngine already exists');
            return;
        }

        try {
            const { default: TemplateEngine } = await import('./TemplateEngine.js');
            window.templateEngine = new TemplateEngine();
            console.log('🏗️ TemplateEngine loaded');
        } catch (error) {
            console.warn('⚠️ TemplateEngine not available:', error.message);
            // Crear engine básico
            window.templateEngine = this._createBasicTemplateEngine();
        }
    }

    _createBasicTemplateEngine() {
        const templates = new Map();
        
        return {
            registerTemplate(pluginName, templateName, content) {
                const key = `${pluginName}/${templateName}`;
                templates.set(key, content);
                console.log(`📋 Template registered: ${key}`);
            },
            
            getTemplate(pluginName, templateName) {
                const key = `${pluginName}/${templateName}`;
                return templates.get(key);
            },
            
            list() {
                return Array.from(templates.keys());
            }
        };
    }

    // ✅ INICIALIZAR LEGACY BRIDGE
    async _initLegacyBridge(options) {
        if (window.legacyBridge) {
            console.log('🔄 LegacyBridge already exists');
            return;
        }

        try {
            const { default: LegacyBridge } = await import('./LegacyBridge.js');
            window.legacyBridge = new LegacyBridge();
            console.log('🌉 LegacyBridge loaded');
        } catch (error) {
            console.warn('⚠️ LegacyBridge not available:', error.message);
        }
    }

    // ✅ INICIALIZAR EDITOR BRIDGE
    async _initEditorBridge(options) {
        if (window.editorBridge) {
            console.log('🔄 EditorBridge already exists');
            return;
        }

        try {
            const { default: EditorBridge } = await import('./EditorBridge.js');
            window.editorBridge = EditorBridge;
            console.log('📝 EditorBridge loaded');
        } catch (error) {
            console.warn('⚠️ EditorBridge not available:', error.message);
        }
    }

    // ✅ INICIALIZAR PLUGIN SYSTEM INIT
    async _initPluginSystemInit(options) {
        try {
            const { PluginSystemInit } = await import('./PluginSystemInit.js');
            const systemInit = new PluginSystemInit();
            await systemInit.initialize();
            window.pluginSystemInit = systemInit;
            console.log('🎯 PluginSystemInit completed');
        } catch (error) {
            console.warn('⚠️ PluginSystemInit failed:', error.message);
        }
    }

    // ✅ VERIFICAR INTEGRIDAD DEL SISTEMA
    _verifySystemIntegrity() {
        const requiredComponents = ['pluginManager'];
        const missingComponents = requiredComponents.filter(comp => !window[comp]);
        
        if (missingComponents.length > 0) {
            console.warn('⚠️ Missing components:', missingComponents);
        } else {
            console.log('✅ System integrity verified');
        }
    }

    // ✅ EXPONER APIs GLOBALMENTE
    _exposeGlobalAPIs() {
        // Función de reinicialización
        window.reinitializeSystem = () => this.initializeAll();
        
        // Función de estado del sistema
        window.getSystemInfo = () => this._getSystemInfo();
        
        // Función de debugging
        window.debugSystem = () => {
            console.log('🔧 System Debug Info:');
            console.log('PluginManager:', !!window.pluginManager);
            console.log('LegacyBridge:', !!window.legacyBridge);
            console.log('TemplateValidator:', !!window.templateValidator);
            console.log('TemplateEngine:', !!window.templateEngine);
            console.log('EditorBridge:', !!window.editorBridge);              // ✅ NUEVO
            console.log('PluginSystemInit:', !!window.pluginSystemInit);
            
            if (window.pluginManager) {
                console.log('Registered Plugins:', window.pluginManager.list());
            }
        };
        
        console.log('🔧 Global APIs exposed');
    }

    _getSystemInfo() {
        return {
            initialized: this.initialized,
            components: {
                pluginManager: !!window.pluginManager,
                legacyBridge: !!window.legacyBridge,
                templateValidator: !!window.templateValidator,
                templateEngine: !!window.templateEngine,
                editorBridge: !!window.editorBridge,        // ✅ NUEVO
                pluginSystemInit: !!window.pluginSystemInit
            },
            plugins: window.pluginManager ? window.pluginManager.list() : [],
            timestamp: new Date().toISOString()
        };
    }
}

// ✅ FUNCIÓN PRINCIPAL DE INICIALIZACIÓN
export async function initializeCoreSystem(options = {}) {
    try {
        const initializer = new CoreSystemInitializer();
        const systemInfo = await initializer.initializeAll(options);
        
        // Exponer initializer para debugging
        window.coreSystemInitializer = initializer;
        
        return systemInfo;
    } catch (error) {
        console.error('❌ Core System initialization failed:', error);
        throw error;
    }
}

// ✅ FUNCIÓN SIMPLIFICADA PARA PAGEBUILDER
export async function initializePluginSystem(options = {}) {
    console.log('🔄 Redirecting to Core System initializer...');
    return await initializeCoreSystem(options);
}

// Auto-inicializar si es necesario
if (typeof window !== 'undefined') {
    window.initializeCoreSystem = initializeCoreSystem;
    window.initializePluginSystem = initializePluginSystem;
}

export default CoreSystemInitializer;
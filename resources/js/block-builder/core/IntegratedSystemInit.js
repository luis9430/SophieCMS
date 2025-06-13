// ===================================================================
// resources/js/block-builder/core/IntegratedSystemInit.js
// Sistema de Inicialización Completo - Backend + Frontend
// ===================================================================

import { PluginManager } from './PluginManager.js';
import { TemplateValidator } from '../security/TemplateValidator.js';
import templatesApi from '../services/templatesApi.js';

// Importar plugins
import alpinePlugin from '../plugins/alpine/index.js';
import templatesPlugin from '../plugins/templates/index.js';

class IntegratedSystemInit {
    constructor() {
        this.initialized = false;
        this.initializationPromise = null;
        this.config = {
            // Configuración por defecto
            securityLevel: 'medium',
            enableHotReload: false,
            autoRegister: true,
            validateOnLoad: true,
            backendEnabled: true,
            cacheEnabled: true,
            debugMode: process.env.NODE_ENV === 'development'
        };
    }

    // ===================================================================
    // INICIALIZACIÓN PRINCIPAL
    // ===================================================================

    async initialize(customConfig = {}) {
        // Evitar inicialización múltiple
        if (this.initialized) {
            return this.getSystemInfo();
        }

        if (this.initializationPromise) {
            return await this.initializationPromise;
        }

        this.initializationPromise = this._performInitialization(customConfig);
        return await this.initializationPromise;
    }

    async _performInitialization(customConfig) {
        console.log('🚀 Initializing Integrated Page Builder System...');
        
        try {
            // 1. Configurar sistema
            this._setupConfiguration(customConfig);
            
            // 2. Verificar dependencias
            await this._checkDependencies();
            
            // 3. Inicializar componentes principales
            await this._initializeCoreComponents();
            
            // 4. Configurar integración con backend
            await this._setupBackendIntegration();
            
            // 5. Registrar plugins
            await this._registerPlugins();
            
            
            // 7. Configurar sistema de eventos
            this._setupEventSystem();
            
            // 8. Validar sistema completo
            await this._validateSystem();
            
            this.initialized = true;
            console.log('✅ Integrated Page Builder System initialized successfully!');
            
            return this.getSystemInfo();
            
        } catch (error) {
            console.error('❌ System initialization failed:', error);
            throw error;
        }
    }

    // ===================================================================
    // CONFIGURACIÓN DEL SISTEMA
    // ===================================================================

    _setupConfiguration(customConfig) {
        this.config = { ...this.config, ...customConfig };
        
        // Configurar modo debug
        if (this.config.debugMode) {
            console.log('🔧 Debug mode enabled');
            window.DEBUG_PAGE_BUILDER = true;
        }
        
        console.log('⚙️ System configuration:', this.config);
    }

    async _checkDependencies() {
        const requiredGlobals = [];
        const optionalGlobals = [];
        
        // Verificar dependencias requeridas
        if (typeof window === 'undefined') {
            throw new Error('Window object not available');
        }
        
        // Verificar dependencias opcionales
        if (!window.Alpine) {
            optionalGlobals.push('Alpine.js');
        }
        
        if (!window.Liquid) {
            optionalGlobals.push('Liquid.js');
        }
        
        if (optionalGlobals.length > 0) {
            console.warn('⚠️ Optional dependencies not found:', optionalGlobals);
        }
        
        console.log('📋 Dependencies check completed');
    }

    // ===================================================================
    // INICIALIZACIÓN DE COMPONENTES PRINCIPALES
    // ===================================================================

    async _initializeCoreComponents() {
        console.log('🔧 Initializing core components...');
        
        // 1. Plugin Manager
        this.pluginManager = new PluginManager({
            securityLevel: this.config.securityLevel,
            enableHotReload: this.config.enableHotReload,
            validateOnLoad: this.config.validateOnLoad
        });
        
        window.pluginManager = this.pluginManager;
        
        // 2. Template Validator
        this.templateValidator = new TemplateValidator({
            securityLevel: this.config.securityLevel
        });
        
        window.templateValidator = this.templateValidator;
        
        console.log('✅ Core components initialized');
    }

    // ===================================================================
    // INTEGRACIÓN CON BACKEND
    // ===================================================================

    async _setupBackendIntegration() {
        console.log('🔗 Setting up backend integration...');
        
        try {
            // 1. Configurar API service
            window.templatesApi = templatesApi;
            
            // 2. Test de conectividad con backend
            if (this.config.backendEnabled) {
                await this._testBackendConnectivity();
            }
            
            // 3. Disparar evento de API lista
            window.dispatchEvent(new CustomEvent('templatesApiReady', {
                detail: { 
                    api: templatesApi,
                    available: this.backendAvailable 
                }
            }));
            
            console.log('✅ Backend integration configured');
            
        } catch (error) {
            console.warn('⚠️ Backend integration failed, continuing in frontend-only mode:', error);
            this.backendAvailable = false;
        }
    }

    async _testBackendConnectivity() {
        try {
            console.log('🔍 Testing backend connectivity...');
            
            // Test básico de conectividad
            const response = await fetch('/api/test', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (response.ok) {
                this.backendAvailable = true;
                console.log('✅ Backend connectivity confirmed');
            } else {
                throw new Error(`Backend responded with ${response.status}`);
            }
            
        } catch (error) {
            console.warn('⚠️ Backend not available:', error.message);
            this.backendAvailable = false;
        }
    }

    // ===================================================================
    // REGISTRO DE PLUGINS
    // ===================================================================

    async _registerPlugins() {
        console.log('🔌 Registering plugins...');
        
        const pluginsToRegister = [
            // Plugin de Alpine.js
            {
                plugin: alpinePlugin,
                name: 'Alpine.js Plugin',
                required: false
            },
            
            // Plugin de Templates (integrado)
            {
                plugin: templatesPlugin,
                name: 'Integrated Templates Plugin',
                required: true
            }
        ];
        
        for (const { plugin, name, required } of pluginsToRegister) {
            try {
                await this.pluginManager.register(plugin);
                console.log(`✅ ${name} registered successfully`);
                
            } catch (error) {
                console.error(`❌ Failed to register ${name}:`, error);
                
                if (required) {
                    throw new Error(`Required plugin failed to register: ${name}`);
                }
            }
        }
        
        console.log(`✅ ${this.pluginManager.list().length} plugins registered`);
    }

    // ===================================================================
    // SISTEMA DE EVENTOS
    // ===================================================================

    _setupEventSystem() {
        console.log('📡 Setting up event system...');
        
        // Eventos del sistema
        const systemEvents = [
            'pageBuilderReady',
            'pluginRegistered',
            'pluginUnregistered',
            'templateSaved',
            'templateLoaded',
            'previewUpdated'
        ];
        
        // Crear event dispatcher
        this.eventDispatcher = {
            listeners: new Map(),
            
            on(event, callback) {
                if (!this.listeners.has(event)) {
                    this.listeners.set(event, []);
                }
                this.listeners.get(event).push(callback);
            },
            
            off(event, callback) {
                if (this.listeners.has(event)) {
                    const callbacks = this.listeners.get(event);
                    const index = callbacks.indexOf(callback);
                    if (index > -1) {
                        callbacks.splice(index, 1);
                    }
                }
            },
            
            emit(event, data) {
                if (this.listeners.has(event)) {
                    this.listeners.get(event).forEach(callback => {
                        try {
                            callback(data);
                        } catch (error) {
                            console.error(`Error in event listener for ${event}:`, error);
                        }
                    });
                }
                
                // También disparar como evento DOM
                window.dispatchEvent(new CustomEvent(event, { detail: data }));
            }
        };
        
        window.pageBuilderEvents = this.eventDispatcher;
        
        console.log('✅ Event system configured');
    }

    // ===================================================================
    // VALIDACIÓN DEL SISTEMA
    // ===================================================================

    async _validateSystem() {
        console.log('🔍 Validating system integrity...');
        
        const validations = [
            // Validar Plugin Manager
            {
                name: 'Plugin Manager',
                test: () => this.pluginManager && typeof this.pluginManager.register === 'function'
            },
            
            // Validar Templates API
            {
                name: 'Templates API',
                test: () => window.templatesApi && typeof window.templatesApi.getTemplates === 'function'
            },
            
            // Validar al menos un plugin registrado
            {
                name: 'Plugins Registered',
                test: () => this.pluginManager.list().length > 0
            },
            
            // Validar Template Validator
            {
                name: 'Template Validator',
                test: () => this.templateValidator && typeof this.templateValidator.validate === 'function'
            },
            
        ];
        
        const failed = [];
        
        for (const validation of validations) {
            try {
                if (!validation.test()) {
                    failed.push(validation.name);
                }
            } catch (error) {
                console.error(`Validation failed for ${validation.name}:`, error);
                failed.push(validation.name);
            }
        }
        
        if (failed.length > 0) {
            throw new Error(`System validation failed: ${failed.join(', ')}`);
        }
        
        console.log('✅ System validation passed');
    }

    // ===================================================================
    // INFORMACIÓN DEL SISTEMA
    // ===================================================================

    getSystemInfo() {
        return {
            initialized: this.initialized,
            config: this.config,
            backendAvailable: this.backendAvailable,
            plugins: this.pluginManager?.list() || [],
            version: '2.0.0',
            timestamp: new Date().toISOString()
        };
    }

    getHealthCheck() {
        return {
            status: this.initialized ? 'healthy' : 'initializing',
            components: {
                pluginManager: !!this.pluginManager,
                templatesApi: !!window.templatesApi,
                templateValidator: !!this.templateValidator,
                backendConnection: this.backendAvailable
            },
            pluginCount: this.pluginManager?.list().length || 0,
            uptime: Date.now() - (this.initTime || Date.now())
        };
    }

    // ===================================================================
    // UTILIDADES PÚBLICAS
    // ===================================================================

    async reinitialize(newConfig = {}) {
        console.log('🔄 Reinitializing system...');
        
        this.initialized = false;
        this.initializationPromise = null;
        
        return await this.initialize(newConfig);
    }

    destroy() {
        console.log('🗑️ Destroying system...');
        
        // Limpiar event listeners
        if (this.eventDispatcher) {
            this.eventDispatcher.listeners.clear();
        }
        
        // Cleanup plugins
        if (this.pluginManager) {
            this.pluginManager.unregisterAll();
        }
        
        // Cleanup globals
        delete window.pluginManager;
        delete window.templateValidator;
        delete window.pageBuilderEvents;
        
        this.initialized = false;
        console.log('✅ System destroyed');
    }
}

// ===================================================================
// INSTANCIA SINGLETON Y FUNCIÓN DE INICIALIZACIÓN
// ===================================================================

const integratedSystem = new IntegratedSystemInit();

/**
 * Función principal de inicialización del sistema integrado
 */
export const initializeIntegratedPageBuilder = async (config = {}) => {
    return await integratedSystem.initialize(config);
};

/**
 * Obtener información del sistema
 */
export const getSystemInfo = () => {
    return integratedSystem.getSystemInfo();
};

/**
 * Health check del sistema
 */
export const getHealthCheck = () => {
    return integratedSystem.getHealthCheck();
};

/**
 * Reinicializar sistema
 */
export const reinitializeSystem = async (config = {}) => {
    return await integratedSystem.reinitialize(config);
};

/**
 * Destruir sistema
 */
export const destroySystem = () => {
    integratedSystem.destroy();
};

// ===================================================================
// AUTO-INICIALIZACIÓN (OPCIONAL)
// ===================================================================

// Auto-inicializar si se detecta que estamos en el contexto correcto
if (typeof window !== 'undefined' && !window.pageBuilderInitialized) {
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            if (!window.pageBuilderInitialized) {
                try {
                    await initializeIntegratedPageBuilder();
                    window.pageBuilderInitialized = true;
                    
                    // Disparar evento global
                    window.dispatchEvent(new CustomEvent('pageBuilderReady', {
                        detail: getSystemInfo()
                    }));
                    
                } catch (error) {
                    console.error('❌ Auto-initialization failed:', error);
                }
            }
        });
    } else {
        // DOM ya está listo
        setTimeout(async () => {
            if (!window.pageBuilderInitialized) {
                try {
                    await initializeIntegratedPageBuilder();
                    window.pageBuilderInitialized = true;
                    
                    window.dispatchEvent(new CustomEvent('pageBuilderReady', {
                        detail: getSystemInfo()
                    }));
                    
                } catch (error) {
                    console.error('❌ Auto-initialization failed:', error);
                }
            }
        }, 100);
    }
}

// ===================================================================
// DEBUG HELPERS (DEVELOPMENT)
// ===================================================================

if (process.env.NODE_ENV === 'development') {
    window.debugIntegratedSystem = {
        getInfo: getSystemInfo,
        getHealth: getHealthCheck,
        reinit: reinitializeSystem,
        destroy: destroySystem,
        
        testBackend: async () => {
            try {
                const result = await window.templatesApi.getTemplates();
                console.log('✅ Backend test successful:', result);
                return result;
            } catch (error) {
                console.error('❌ Backend test failed:', error);
                return error;
            }
        },
        
        testPlugins: () => {
            const plugins = window.pluginManager?.list() || [];
            console.table(plugins);
            return plugins;
        }
    };
}

export default integratedSystem;
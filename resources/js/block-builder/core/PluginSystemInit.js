// ===================================================================
// core/PluginSystemInit.js
// Responsabilidad: Inicialización completa del sistema de plugins
// ===================================================================

import pluginManager from './pluginManager.js';
import legacyBridge from './LegacyBridge.js';
import templateValidator from '../security/TemplateValidator.js';

// Importar plugins disponibles
import AlpinePlugin, { registerAlpinePlugin } from '../plugins/alpine/index.js';

/**
 * Inicializador del sistema de plugins
 * Configura y registra todos los plugins disponibles
 */
class PluginSystemInit {
    constructor() {
        this.initialized = false;
        this.plugins = new Map();
        this.config = {
            autoRegister: true,
            validateOnLoad: true,
            enableHotReload: true,
            securityLevel: 'high'
        };
        
        console.log('🚀 PluginSystemInit created');
    }

    // ===================================================================
    // INICIALIZACIÓN PRINCIPAL
    // ===================================================================

    /**
     * Inicializar sistema completo de plugins
     */
    async initialize(config = {}) {
        try {
            console.log('🔄 Initializing Plugin System...');
            
            // Actualizar configuración
            this.config = { ...this.config, ...config };
            
            // 1. Configurar PluginManager
            await this._configurePluginManager();
            
            // 2. Configurar validador de seguridad
            this._configureTemplateValidator();
            
            // 3. Registrar plugins core
            await this._registerCorePlugins();
            
            // 4. Configurar LegacyBridge
            this._configureLegacyBridge();
            
            // 5. Setup de eventos y debugging
            this._setupEventHandlers();
            
            // 6. Validación post-inicialización
            await this._validateSystem();
            
            this.initialized = true;
            console.log('✅ Plugin System initialized successfully');
            
            return {
                success: true,
                pluginCount: pluginManager.list().length,
                bridge: legacyBridge,
                validator: templateValidator
            };
            
        } catch (error) {
            console.error('❌ Plugin System initialization failed:', error);
            throw error;
        }
    }

    // ===================================================================
    // CONFIGURACIÓN DE COMPONENTES
    // ===================================================================

    /**
     * Configurar PluginManager
     * @private
     */
    async _configurePluginManager() {
        console.log('⚙️ Configuring PluginManager...');
        
        // Configuración específica del manager
        pluginManager.updateConfig?.({
            hotReload: this.config.enableHotReload,
            validatePlugins: this.config.validateOnLoad,
            maxLoadTime: 8000, // 8 segundos para plugins complejos
            allowDependencies: true
        });
        
        // Listeners para eventos importantes
        pluginManager.on('pluginRegistered', (data) => {
            console.log(`✅ Plugin registered: ${data.name}`);
            this._onPluginRegistered(data);
        });
        
        pluginManager.on('pluginError', (data) => {
            console.error(`❌ Plugin error in ${data.name}:`, data.error);
            this._onPluginError(data);
        });
        
        pluginManager.on('pluginReloaded', (data) => {
            console.log(`🔄 Plugin reloaded: ${data.name}`);
            this._onPluginReloaded(data);
        });
    }

    /**
     * Configurar TemplateValidator
     * @private
     */
    _configureTemplateValidator() {
        console.log('🛡️ Configuring TemplateValidator...');
        
        const securityConfig = {
            strictMode: this.config.securityLevel === 'high',
            maxTemplateSize: this.config.securityLevel === 'high' ? 300000 : 500000,
            allowedTags: new Set([
                // HTML estándar
                'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'a', 'img', 'ul', 'ol', 'li', 'br', 'hr',
                'button', 'input', 'textarea', 'select', 'option',
                'form', 'label', 'fieldset', 'legend',
                'table', 'thead', 'tbody', 'tr', 'td', 'th',
                'article', 'section', 'header', 'footer', 'nav', 'main',
                // Alpine.js específico
                'template'
            ])
        };
        
        templateValidator.updateConfig(securityConfig);
    }

    /**
     * Configurar LegacyBridge
     * @private
     */
    _configureLegacyBridge() {
        console.log('🌉 Configuring LegacyBridge...');
        
        // El bridge se auto-configura cuando se registran plugins
        // Aquí podríamos añadir configuración específica si fuera necesario
    }

    // ===================================================================
    // REGISTRO DE PLUGINS
    // ===================================================================

    /**
     * Registrar plugins principales
     * @private
     */
    async _registerCorePlugins() {
        console.log('📦 Registering core plugins...');
        
        const pluginsToRegister = [
            {
                name: 'alpine',
                plugin: AlpinePlugin,
                autoRegister: registerAlpinePlugin,
                priority: 1,
                critical: true
            }
            // Aquí se añadirán más plugins cuando estén listos:
            // { name: 'variables', plugin: VariablesPlugin, priority: 2 },
            // { name: 'gsap', plugin: GSAPPlugin, priority: 3 },
            // { name: 'liquid', plugin: LiquidPlugin, priority: 4 }
        ];

        // Registrar en orden de prioridad
        pluginsToRegister.sort((a, b) => a.priority - b.priority);
        
        for (const { name, plugin, autoRegister, critical } of pluginsToRegister) {
            try {
                console.log(`📌 Registering plugin: ${name}`);
                
                if (autoRegister && typeof autoRegister === 'function') {
                    await autoRegister(pluginManager);
                } else {
                    await pluginManager.register(name, plugin);
                }
                
                this.plugins.set(name, { 
                    registered: true, 
                    critical,
                    registeredAt: new Date().toISOString() 
                });
                
                console.log(`✅ Plugin ${name} registered successfully`);
                
            } catch (error) {
                console.error(`❌ Failed to register plugin ${name}:`, error);
                
                if (critical) {
                    throw new Error(`Critical plugin ${name} failed to register: ${error.message}`);
                }
                
                this.plugins.set(name, { 
                    registered: false, 
                    error: error.message,
                    critical 
                });
            }
        }
    }

    // ===================================================================
    // EVENT HANDLERS
    // ===================================================================

    /**
     * Configurar manejadores de eventos
     * @private
     */
    _setupEventHandlers() {
        console.log('📡 Setting up event handlers...');
        
        // Eventos del sistema de plugins
        if (typeof window !== 'undefined') {
            // Hot reload listener (para desarrollo)
            if (this.config.enableHotReload) {
                this._setupHotReloadListeners();
            }
            
            // Error reporting
            this._setupErrorReporting();
            
            // Performance monitoring
            this._setupPerformanceMonitoring();
        }
    }

    /**
     * Configurar hot reload
     * @private
     */
    _setupHotReloadListeners() {
        // En un entorno real, esto escucharía cambios en archivos
        console.log('🔥 Hot reload listeners configured');
        
        // Simular hot reload para desarrollo
        if (process.env.NODE_ENV === 'development') {
            window.hotReloadPlugin = async (pluginName, newPluginCode) => {
                try {
                    // Aquí iría la lógica de hot reload real
                    console.log(`🔄 Hot reloading plugin: ${pluginName}`);
                    
                    // Por ahora, solo loggear
                    console.log('Hot reload would execute here');
                    
                } catch (error) {
                    console.error(`❌ Hot reload failed for ${pluginName}:`, error);
                }
            };
        }
    }

    /**
     * Configurar reporte de errores
     * @private
     */
    _setupErrorReporting() {
        window.addEventListener('error', (event) => {
            if (event.error && event.error.message?.includes('plugin')) {
                console.error('🚨 Plugin-related error detected:', event.error);
                // Aquí se podría enviar a un servicio de monitoring
            }
        });
    }

    /**
     * Configurar monitoreo de rendimiento
     * @private
     */
    _setupPerformanceMonitoring() {
        // Monitorear rendimiento de plugins
        setInterval(() => {
            const stats = pluginManager.getStats?.();
            if (stats && stats.memoryUsage > 1000000) { // 1MB
                console.warn('⚠️ High plugin memory usage detected:', stats.memoryUsage);
            }
        }, 30000); // Check cada 30 segundos
    }

    // ===================================================================
    // CALLBACKS DE EVENTOS
    // ===================================================================

    /**
     * Callback cuando se registra un plugin
     * @private
     */
    _onPluginRegistered(data) {
        const { name } = data;
        
        // Actualizar estado interno
        if (this.plugins.has(name)) {
            const pluginInfo = this.plugins.get(name);
            pluginInfo.registered = true;
            pluginInfo.registeredAt = new Date().toISOString();
        }
        
        // Notificar a otros sistemas si es necesario
        this._notifySystemUpdate('pluginRegistered', { name });
    }

    /**
     * Callback cuando ocurre error en plugin
     * @private
     */
    _onPluginError(data) {
        const { name, error, phase } = data;
        
        // Log detallado del error
        console.error(`🚨 Plugin ${name} error in ${phase}:`, error);
        
        // Actualizar estado
        if (this.plugins.has(name)) {
            const pluginInfo = this.plugins.get(name);
            pluginInfo.lastError = {
                message: error.message,
                phase,
                timestamp: new Date().toISOString()
            };
        }
        
        // Manejo especial para plugins críticos
        const pluginInfo = this.plugins.get(name);
        if (pluginInfo?.critical) {
            console.error(`🚨 CRITICAL: Critical plugin ${name} has errors!`);
            // En producción, esto podría triggear fallback a legacy
        }
    }

    /**
     * Callback cuando se recarga un plugin
     * @private
     */
    _onPluginReloaded(data) {
        const { name } = data;
        console.log(`🔄 Plugin ${name} reloaded successfully`);
        
        // Limpiar errores previos
        if (this.plugins.has(name)) {
            const pluginInfo = this.plugins.get(name);
            delete pluginInfo.lastError;
            pluginInfo.lastReload = new Date().toISOString();
        }
    }

    // ===================================================================
    // VALIDACIÓN Y TESTING
    // ===================================================================

    /**
     * Validar que el sistema esté funcionando correctamente
     * @private
     */
    async _validateSystem() {
        console.log('🧪 Validating plugin system...');
        
        const validationResults = {
            pluginManager: false,
            legacyBridge: false,
            templateValidator: false,
            plugins: {}
        };

        try {
            // Test PluginManager
            const pmStats = pluginManager.getStats?.();
            validationResults.pluginManager = pmStats && pmStats.totalPlugins > 0;
            
            // Test LegacyBridge
            const bridgeTest = await legacyBridge.testCompatibility();
            validationResults.legacyBridge = bridgeTest.overall === 'pass';
            
            // Test TemplateValidator
            const validatorTest = templateValidator.isSafe('<div>Test</div>');
            validationResults.templateValidator = validatorTest === true;
            
            // Test cada plugin registrado
            for (const [name, info] of this.plugins.entries()) {
                if (info.registered) {
                    const plugin = pluginManager.get(name);
                    validationResults.plugins[name] = !!plugin;
                }
            }
            
            const allValid = Object.values(validationResults).every(result => 
                typeof result === 'boolean' ? result : Object.values(result).every(Boolean)
            );
            
            if (allValid) {
                console.log('✅ System validation passed');
            } else {
                console.warn('⚠️ System validation has issues:', validationResults);
            }
            
            return validationResults;
            
        } catch (error) {
            console.error('❌ System validation failed:', error);
            throw error;
        }
    }

    // ===================================================================
    // API PÚBLICA
    // ===================================================================

    /**
     * Obtener estado completo del sistema
     */
    getSystemState() {
        return {
            initialized: this.initialized,
            config: this.config,
            plugins: Object.fromEntries(this.plugins),
            pluginManager: {
                stats: pluginManager.getStats?.(),
                debugInfo: pluginManager.getDebugInfo?.()
            },
            legacyBridge: {
                migrationInfo: legacyBridge.getMigrationInfo?.()
            },
            templateValidator: {
                config: templateValidator.getConfig?.()
            }
        };
    }

    /**
     * Registrar plugin adicional en runtime
     */
    async registerPlugin(name, plugin, options = {}) {
        try {
            await pluginManager.register(name, plugin, options);
            
            this.plugins.set(name, {
                registered: true,
                registeredAt: new Date().toISOString(),
                runtime: true
            });
            
            console.log(`✅ Runtime plugin registered: ${name}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Failed to register runtime plugin ${name}:`, error);
            throw error;
        }
    }

    /**
     * Hot reload de plugin específico
     */
    async hotReloadPlugin(name, newPlugin) {
        try {
            await pluginManager.reload(name, newPlugin);
            console.log(`🔄 Plugin ${name} hot-reloaded successfully`);
            return true;
        } catch (error) {
            console.error(`❌ Hot reload failed for ${name}:`, error);
            throw error;
        }
    }

    /**
     * Reinicializar sistema completo
     */
    async reinitialize(newConfig = {}) {
        console.log('🔄 Reinitializing plugin system...');
        
        // Limpiar estado actual
        await pluginManager.clear();
        this.plugins.clear();
        this.initialized = false;
        
        // Reinicializar con nueva configuración
        return await this.initialize(newConfig);
    }

    // ===================================================================
    // UTILS
    // ===================================================================

    /**
     * Notificar actualización del sistema
     * @private
     */
    _notifySystemUpdate(eventType, data) {
        // Emit evento personalizado para otros sistemas
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            const event = new CustomEvent('pluginSystemUpdate', {
                detail: { eventType, data, timestamp: new Date().toISOString() }
            });
            window.dispatchEvent(event);
        }
    }

    /**
     * Obtener información de debugging
     */
    getDebugInfo() {
        return {
            system: this.getSystemState(),
            performance: {
                memory: JSON.stringify(this).length,
                pluginCount: this.plugins.size,
                uptime: this.initialized ? Date.now() - new Date(this.initTime).getTime() : 0
            }
        };
    }
}

// ===================================================================
// INSTANCIA SINGLETON
// ===================================================================

const pluginSystemInit = new PluginSystemInit();

// ===================================================================
// FUNCIONES DE CONVENIENCIA
// ===================================================================

/**
 * Inicializar sistema de plugins (función principal)
 */
export const initializePluginSystem = async (config = {}) => {
    return await pluginSystemInit.initialize(config);
};

/**
 * Obtener sistema inicializado
 */
export const getPluginSystem = () => {
    if (!pluginSystemInit.initialized) {
        throw new Error('Plugin system not initialized. Call initializePluginSystem() first.');
    }
    
    return {
        pluginManager,
        legacyBridge,
        templateValidator,
        init: pluginSystemInit
    };
};

// ===================================================================
// EXPORTACIONES
// ===================================================================

export default pluginSystemInit;
export { 
    pluginManager, 
    legacyBridge, 
    templateValidator,
    PluginSystemInit 
};

// ===================================================================
// AUTO-INICIALIZACIÓN EN DESARROLLO
// ===================================================================

if (process.env.NODE_ENV === 'development') {
    // Exponer para debugging
    window.pluginSystemInit = pluginSystemInit;
    window.initializePluginSystem = initializePluginSystem;
    
    // Auto-inicializar en desarrollo
    console.log('🔧 Plugin System ready for initialization');
    console.log('💡 Run: await window.initializePluginSystem() to start');
    
    // Opcional: Auto-inicializar
    // setTimeout(() => initializePluginSystem(), 1000);
}
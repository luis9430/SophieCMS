// ===================================================================
// core/PluginSystemInit.js - ACTUALIZADO PARA FASE 2
// Responsabilidad: Inicialización completa del sistema de plugins
// ===================================================================

import pluginManager from './pluginManager.js';
import legacyBridge from './LegacyBridge.js';
import templateValidator from '../security/TemplateValidator.js';

// Importar plugins disponibles
import AlpinePlugin, { registerAlpinePlugin } from '../plugins/alpine/index.js';
import VariablesPlugin, { registerVariablesPlugin } from '../plugins/variables/index.js'; // 🎯 NUEVO

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
        
        console.log('🚀 PluginSystemInit created (Fase 2)');
    }

    // ===================================================================
    // INICIALIZACIÓN PRINCIPAL
    // ===================================================================

    /**
     * Inicializar sistema completo de plugins
     */
    async initialize(config = {}) {
        try {
            console.log('🔄 Initializing Plugin System (Phase 2)...');
            
            // Actualizar configuración
            this.config = { ...this.config, ...config };
            
            // 1. Configurar PluginManager
            await this._configurePluginManager();
            
            // 2. Configurar validador de seguridad
            this._configureTemplateValidator();
            
            // 3. Registrar plugins core (ORDEN IMPORTANTE)
            await this._registerCorePlugins();
            
            // 4. Configurar LegacyBridge
            this._configureLegacyBridge();
            
            // 5. Setup de eventos y debugging
            this._setupEventHandlers();
            
            // 6. Validación post-inicialización
            await this._validateSystem();
            
            this.initialized = true;
            console.log('✅ Plugin System initialized successfully (Phase 2)');
            
            return {
                success: true,
                pluginCount: pluginManager.list().length,
                bridge: legacyBridge,
                validator: templateValidator,
                phase: 2,
                features: ['Variables Plugin', 'Alpine Plugin', 'Legacy Bridge']
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
            maxLoadTime: 10000, // 10 segundos para plugins con más funcionalidad
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
            ]),
            // 🎯 CONFIGURACIÓN ESPECÍFICA PARA VARIABLES
            validateVariables: true,
            allowedVariablePattern: /^[\w.-]+$/,
            maxVariablesPerTemplate: 50
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
        // En Fase 2, el bridge ahora puede detectar el plugin de variables
        console.log('🎯 LegacyBridge will auto-detect Variables Plugin');
    }

    // ===================================================================
    // REGISTRO DE PLUGINS - FASE 2
    // ===================================================================

    /**
     * Registrar plugins principales (ORDEN IMPORTANTE EN FASE 2)
     * @private
     */
    async _registerCorePlugins() {
        console.log('📦 Registering core plugins (Phase 2)...');
        
        const pluginsToRegister = [
            // 🎯 VARIABLES PLUGIN - PRIMERA PRIORIDAD
            {
                name: 'variables',
                plugin: VariablesPlugin,
                autoRegister: registerVariablesPlugin,
                priority: 1,
                critical: true,
                description: 'Sistema base de variables - requerido por otros plugins'
            },
            // 🔗 ALPINE PLUGIN - SEGUNDA PRIORIDAD (depende de variables)
            {
                name: 'alpine',
                plugin: AlpinePlugin,
                autoRegister: registerAlpinePlugin,
                priority: 2,
                critical: true,
                description: 'Alpine.js support con integración de variables'
            }
            // 🔮 FUTUROS PLUGINS EN FASE 3+:
            // { name: 'gsap', plugin: GSAPPlugin, priority: 3 },
            // { name: 'liquid', plugin: LiquidPlugin, priority: 4 }
        ];

        // Registrar en orden de prioridad
        pluginsToRegister.sort((a, b) => a.priority - b.priority);
        
        for (const { name, plugin, autoRegister, critical, description } of pluginsToRegister) {
            try {
                console.log(`📌 Registering plugin: ${name} - ${description}`);
                
                if (autoRegister && typeof autoRegister === 'function') {
                    await autoRegister(pluginManager);
                } else {
                    await pluginManager.register(name, plugin);
                }
                
                this.plugins.set(name, { 
                    registered: true, 
                    critical,
                    registeredAt: new Date().toISOString(),
                    description
                });
                
                console.log(`✅ Plugin ${name} registered successfully`);
                
                // 🎯 VERIFICACIÓN ESPECIAL PARA VARIABLES PLUGIN
                if (name === 'variables') {
                    await this._verifyVariablesPlugin();
                }
                
            } catch (error) {
                console.error(`❌ Failed to register plugin ${name}:`, error);
                
                if (critical) {
                    throw new Error(`Critical plugin ${name} failed to register: ${error.message}`);
                }
                
                this.plugins.set(name, { 
                    registered: false, 
                    error: error.message,
                    critical,
                    description
                });
            }
        }
    }

    /**
     * Verificar que el plugin de variables está funcionando correctamente
     * @private
     */
    async _verifyVariablesPlugin() {
        try {
            const variablesPlugin = pluginManager.get('variables');
            if (!variablesPlugin) {
                throw new Error('Variables plugin not found after registration');
            }

            // Test básico de funcionalidad
            const testVars = variablesPlugin.getAvailableVariables();
            if (!testVars || Object.keys(testVars).length === 0) {
                throw new Error('Variables plugin returned empty variables');
            }

            // Test de procesamiento
            const testCode = 'Hello {{ user.name }}!';
            const processed = variablesPlugin.processVariables(testCode);
            if (processed === testCode) {
                console.warn('⚠️ Variables plugin may not be processing correctly');
            }

            // Test de validación
            const isValid = variablesPlugin.validateVariable('user.name');
            if (!isValid) {
                console.warn('⚠️ Variables plugin validation may have issues');
            }

            console.log('✅ Variables plugin verification passed');
            
            // Imprimir estadísticas del plugin
            const stats = variablesPlugin.getStats();
            console.log('📊 Variables plugin stats:', stats);
            
        } catch (error) {
            console.error('❌ Variables plugin verification failed:', error);
            throw error;
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

            // 🎯 EVENTOS ESPECÍFICOS PARA VARIABLES
            this._setupVariablesEventHandlers();
        }
    }

    /**
     * Configurar manejadores específicos para variables
     * @private
     */
    _setupVariablesEventHandlers() {
        // Escuchar cambios en window.initialData
        let lastInitialData = JSON.stringify(window.initialData || {});
        
        setInterval(() => {
            const currentInitialData = JSON.stringify(window.initialData || {});
            if (currentInitialData !== lastInitialData) {
                console.log('🔄 Initial data changed, refreshing variables...');
                
                const variablesPlugin = pluginManager.get('variables');
                if (variablesPlugin) {
                    variablesPlugin.refreshAllProviders?.();
                }
                
                lastInitialData = currentInitialData;
            }
        }, 5000); // Check cada 5 segundos

        // Listener para eventos customizados de variables
        window.addEventListener('variablesUpdated', (event) => {
            console.log('🎯 Variables updated event received:', event.detail);
            
            const variablesPlugin = pluginManager.get('variables');
            if (variablesPlugin && event.detail.provider) {
                variablesPlugin.refreshProvider?.(event.detail.provider);
            }
        });

        console.log('🎯 Variables event handlers configured');
    }

    /**
     * Configurar hot reload
     * @private
     */
    _setupHotReloadListeners() {
        console.log('🔥 Hot reload listeners configured');
        
        // Hot reload para desarrollo
        if (process.env.NODE_ENV === 'development') {
            window.hotReloadPlugin = async (pluginName, newPluginCode) => {
                try {
                    console.log(`🔄 Hot reloading plugin: ${pluginName}`);
                    
                    if (pluginName === 'variables') {
                        console.log('🎯 Hot reloading Variables plugin...');
                        // Lógica específica para variables plugin
                    }
                    
                    console.log('Hot reload would execute here');
                    
                } catch (error) {
                    console.error(`❌ Hot reload failed for ${pluginName}:`, error);
                }
            };

            // 🎯 FUNCIÓN ESPECÍFICA PARA RECARGAR VARIABLES
            window.reloadVariables = async () => {
                try {
                    const variablesPlugin = pluginManager.get('variables');
                    if (variablesPlugin) {
                        await variablesPlugin.refreshAllProviders();
                        console.log('✅ Variables reloaded successfully');
                    }
                } catch (error) {
                    console.error('❌ Error reloading variables:', error);
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
                
                // 🎯 MANEJO ESPECÍFICO PARA ERRORES DE VARIABLES
                if (event.error.message?.includes('variable')) {
                    console.error('🎯 Variable-related error detected');
                    this._handleVariableError(event.error);
                }
            }
        });
    }

    /**
     * Manejar errores específicos de variables
     * @private
     */
    _handleVariableError(error) {
        try {
            const variablesPlugin = pluginManager.get('variables');
            if (variablesPlugin) {
                const stats = variablesPlugin.getStats();
                console.log('📊 Variables plugin stats during error:', stats);
                
                // Intentar auto-recuperación
                setTimeout(() => {
                    variablesPlugin.refreshAllProviders?.();
                }, 1000);
            }
        } catch (recoveryError) {
            console.error('❌ Error during variable error recovery:', recoveryError);
        }
    }

    /**
     * Configurar monitoreo de rendimiento
     * @private
     */
    _setupPerformanceMonitoring() {
        // Monitorear rendimiento de plugins
        setInterval(() => {
            const stats = pluginManager.getStats?.();
            if (stats && stats.memoryUsage > 2000000) { // 2MB
                console.warn('⚠️ High plugin memory usage detected:', stats.memoryUsage);
            }

            // 🎯 MONITOREO ESPECÍFICO DE VARIABLES
            const variablesPlugin = pluginManager.get('variables');
            if (variablesPlugin) {
                const varStats = variablesPlugin.getStats();
                if (varStats.cacheSize > 500) {
                    console.warn('⚠️ Large variables cache detected:', varStats.cacheSize);
                }
            }
        }, 60000); // Check cada minuto
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
        
        // 🎯 ACCIÓN ESPECÍFICA CUANDO SE REGISTRA VARIABLES PLUGIN
        if (name === 'variables') {
            console.log('🎯 Variables plugin registered - setting up integrations');
            this._setupVariablesIntegrations();
        }
        
        // Notificar a otros sistemas
        this._notifySystemUpdate('pluginRegistered', { name });
    }

    /**
     * Configurar integraciones específicas del plugin de variables
     * @private
     */
    _setupVariablesIntegrations() {
        try {
            const variablesPlugin = pluginManager.get('variables');
            if (!variablesPlugin) return;

            // Configurar auto-refresh si está en desarrollo
            if (process.env.NODE_ENV === 'development') {
                variablesPlugin.configure?.({
                    autoRefresh: true,
                    refreshInterval: 15000 // 15 segundos en desarrollo
                });
            }

            // Exponer funciones útiles para debugging
            if (window) {
                window.getVariables = () => variablesPlugin.getAvailableVariables();
                window.processVariables = (code) => variablesPlugin.processVariables(code);
                window.variableStats = () => variablesPlugin.getStats();
            }

            console.log('✅ Variables plugin integrations configured');
            
        } catch (error) {
            console.error('❌ Error setting up variables integrations:', error);
        }
    }

    /**
     * Callback cuando ocurre error en plugin
     * @private
     */
    _onPluginError(data) {
        const { name, error, phase } = data;
        
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
        
        // 🎯 MANEJO ESPECÍFICO PARA ERRORES DEL PLUGIN DE VARIABLES
        if (name === 'variables') {
            console.error('🎯 CRITICAL: Variables plugin has errors!');
            this._handleVariablesPluginError(error, phase);
        }
        
        // Manejo para plugins críticos
        const pluginInfo = this.plugins.get(name);
        if (pluginInfo?.critical) {
            console.error(`🚨 CRITICAL: Critical plugin ${name} has errors!`);
        }
    }

    /**
     * Manejar errores específicos del plugin de variables
     * @private
     */
    _handleVariablesPluginError(error, phase) {
        // Intentar recuperación automática
        setTimeout(async () => {
            try {
                console.log('🔄 Attempting Variables plugin recovery...');
                
                const variablesPlugin = pluginManager.get('variables');
                if (variablesPlugin) {
                    // Intentar refrescar providers
                    await variablesPlugin.refreshAllProviders?.();
                    console.log('✅ Variables plugin recovery successful');
                } else {
                    // Intentar re-registrar el plugin
                    await registerVariablesPlugin(pluginManager);
                    console.log('✅ Variables plugin re-registered successfully');
                }
            } catch (recoveryError) {
                console.error('❌ Variables plugin recovery failed:', recoveryError);
            }
        }, 2000);
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

        // 🎯 RECONFIGURAR INTEGRACIONES PARA VARIABLES
        if (name === 'variables') {
            this._setupVariablesIntegrations();
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
        console.log('🧪 Validating plugin system (Phase 2)...');
        
        const validationResults = {
            pluginManager: false,
            legacyBridge: false,
            templateValidator: false,
            plugins: {},
            variablesPlugin: false // 🎯 NUEVA VALIDACIÓN
        };

        try {
            // Test PluginManager
            const pmStats = pluginManager.getStats?.();
            validationResults.pluginManager = pmStats && pmStats.totalPlugins > 0;
            
            // Test LegacyBridge
            const bridgeTest = await legacyBridge.testCompatibility();
            validationResults.legacyBridge = bridgeTest.overall === 'pass';
            
            // Test TemplateValidator
            const validatorTest = templateValidator.isSafe('<div>Test {{ user.name }}</div>');
            validationResults.templateValidator = validatorTest === true;
            
            // 🎯 TEST ESPECÍFICO DEL PLUGIN DE VARIABLES
            validationResults.variablesPlugin = await this._validateVariablesPlugin();
            
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
                console.log('✅ System validation passed (Phase 2)');
            } else {
                console.warn('⚠️ System validation has issues:', validationResults);
            }
            
            return validationResults;
            
        } catch (error) {
            console.error('❌ System validation failed:', error);
            throw error;
        }
    }

    /**
     * Validar plugin de variables específicamente
     * @private
     */
    async _validateVariablesPlugin() {
        try {
            const variablesPlugin = pluginManager.get('variables');
            if (!variablesPlugin) return false;

            // Test 1: Obtener variables
            const vars = variablesPlugin.getAvailableVariables();
            if (!vars || Object.keys(vars).length === 0) return false;

            // Test 2: Procesar código
            const testCode = 'Hello {{ user.name }}, today is {{ current.date }}';
            const processed = variablesPlugin.processVariables(testCode);
            if (processed === testCode) return false; // Debería haber cambiado

            // Test 3: Validación
            const isValid = variablesPlugin.validateVariable('user.name');
            if (!isValid) return false;

            // Test 4: Providers
            const providers = variablesPlugin.listProviders();
            if (!providers || providers.length === 0) return false;

            // Test 5: Stats
            const stats = variablesPlugin.getStats();
            if (!stats || typeof stats.providerCount !== 'number') return false;

            console.log('✅ Variables plugin validation passed');
            return true;

        } catch (error) {
            console.error('❌ Variables plugin validation failed:', error);
            return false;
        }
    }

    // ===================================================================
    // API PÚBLICA ACTUALIZADA PARA FASE 2
    // ===================================================================

    /**
     * Obtener estado completo del sistema
     */
    getSystemState() {
        const baseState = {
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
            },
            phase: 2,
            features: ['Variables Plugin', 'Alpine Plugin', 'Legacy Bridge']
        };

        // 🎯 AÑADIR INFORMACIÓN ESPECÍFICA DEL PLUGIN DE VARIABLES
        const variablesPlugin = pluginManager.get('variables');
        if (variablesPlugin) {
            baseState.variablesPlugin = {
                stats: variablesPlugin.getStats?.(),
                providers: variablesPlugin.listProviders?.(),
                state: variablesPlugin.getState?.()
            };
        }

        return baseState;
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
            
            // 🎯 RECONFIGURACIÓN ESPECÍFICA PARA VARIABLES
            if (name === 'variables') {
                await this._verifyVariablesPlugin();
                this._setupVariablesIntegrations();
            }
            
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
        console.log('🔄 Reinitializing plugin system (Phase 2)...');
        
        // Limpiar estado actual
        await pluginManager.clear();
        this.plugins.clear();
        this.initialized = false;
        
        // Reinicializar con nueva configuración
        return await this.initialize(newConfig);
    }

    // ===================================================================
    // NUEVAS FUNCIONES ESPECÍFICAS PARA FASE 2
    // ===================================================================

    /**
     * Obtener información detallada del plugin de variables
     */
    getVariablesPluginInfo() {
        const variablesPlugin = pluginManager.get('variables');
        if (!variablesPlugin) {
            return { available: false, reason: 'Plugin not registered' };
        }

        return {
            available: true,
            stats: variablesPlugin.getStats?.(),
            providers: variablesPlugin.listProviders?.(),
            variables: variablesPlugin.getAvailableVariables?.(),
            config: variablesPlugin.getState?.()?.config
        };
    }

    /**
     * Actualizar variables en runtime
     */
    async updateVariables(providerName, newVariables) {
        try {
            const variablesPlugin = pluginManager.get('variables');
            if (!variablesPlugin) {
                throw new Error('Variables plugin not available');
            }

            const provider = variablesPlugin.getProvider(providerName);
            if (!provider) {
                throw new Error(`Provider ${providerName} not found`);
            }

            if (typeof provider.updateVariables === 'function') {
                provider.updateVariables(newVariables);
                await variablesPlugin.refreshProvider(providerName);
                
                console.log(`✅ Variables updated for provider: ${providerName}`);
                return true;
            } else {
                throw new Error(`Provider ${providerName} does not support updates`);
            }

        } catch (error) {
            console.error('❌ Error updating variables:', error);
            throw error;
        }
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
                detail: { 
                    eventType, 
                    data, 
                    timestamp: new Date().toISOString(),
                    phase: 2
                }
            });
            window.dispatchEvent(event);
        }
    }

    /**
     * Obtener información de debugging específica para Fase 2
     */
    getDebugInfo() {
        const baseDebug = {
            system: this.getSystemState(),
            performance: {
                memory: JSON.stringify(this).length,
                pluginCount: this.plugins.size,
                uptime: this.initialized ? Date.now() - new Date(this.initTime).getTime() : 0
            },
            phase: 2
        };

        // 🎯 AÑADIR DEBUG ESPECÍFICO DE VARIABLES
        const variablesInfo = this.getVariablesPluginInfo();
        if (variablesInfo.available) {
            baseDebug.variables = variablesInfo;
        }

        return baseDebug;
    }
}

// ===================================================================
// INSTANCIA SINGLETON
// ===================================================================

const pluginSystemInit = new PluginSystemInit();

// ===================================================================
// FUNCIONES DE CONVENIENCIA ACTUALIZADAS
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
        init: pluginSystemInit,
        // 🎯 NUEVAS FUNCIONES PARA VARIABLES
        variables: pluginManager.get('variables'),
        getVariables: () => pluginManager.get('variables')?.getAvailableVariables(),
        processVariables: (code) => pluginManager.get('variables')?.processVariables(code)
    };
};

// ===================================================================
// NUEVAS FUNCIONES DE CONVENIENCIA PARA VARIABLES
// ===================================================================

/**
 * Acceso rápido al plugin de variables
 */
export const getVariablesPlugin = () => {
    return pluginManager.get('variables');
};

/**
 * Procesar variables rápidamente
 */
export const processVariables = (code) => {
    const variablesPlugin = getVariablesPlugin();
    return variablesPlugin ? variablesPlugin.processVariables(code) : code;
};

/**
 * Obtener todas las variables disponibles
 */
export const getAvailableVariables = () => {
    const variablesPlugin = getVariablesPlugin();
    return variablesPlugin ? variablesPlugin.getAvailableVariables() : {};
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
// AUTO-INICIALIZACIÓN EN DESARROLLO - FASE 2
// ===================================================================

if (process.env.NODE_ENV === 'development') {
    // Exponer para debugging
    window.pluginSystemInit = pluginSystemInit;
    window.initializePluginSystem = initializePluginSystem;
    
    // 🎯 NUEVAS FUNCIONES DE DEBUG PARA VARIABLES
    window.getVariablesPlugin = getVariablesPlugin;
    window.processVariables = processVariables;
    window.getAvailableVariables = getAvailableVariables;
    
    // Auto-inicializar con configuración de desarrollo
    console.log('🔧 Plugin System ready for Phase 2 initialization');
    console.log('💡 Run: await window.initializePluginSystem() to start');
    
    // Opcional: Auto-inicializar para desarrollo
    // setTimeout(() => {
    //     initializePluginSystem({
    //         securityLevel: 'medium',
    //         enableHotReload: true,
    //         autoRegister: true
    //     });
    // }, 1000);
}
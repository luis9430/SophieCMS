// ===================================================================
// core/PluginManager.js
// Responsabilidad: Registry y gestión central de plugins
// ===================================================================

/**
 * Gestor central de plugins del Page Builder
 * Maneja registro, carga, hot-reloading y comunicación entre plugins
 */
class PluginManager {
    constructor() {
        // Registry de plugins activos
        this.plugins = new Map();
        
        // Sistema de hooks para comunicación entre plugins
        this.hooks = new Map();
        
        // Estado del manager
        this.initialized = false;
        this.loading = new Set(); // Plugins en proceso de carga
        
        // Configuración
        this.config = {
            hotReload: true,
            validatePlugins: true,
            maxLoadTime: 5000, // 5 segundos máximo por plugin
            allowDependencies: true
        };
        
        // Event listeners para debugging
        this.listeners = new Map();
        
        console.log('🔌 PluginManager initialized');
    }

    // ===================================================================
    // REGISTRO Y CARGA DE PLUGINS
    // ===================================================================

    /**
     * Registrar un plugin en el sistema
     * @param {string} name - Nombre único del plugin
     * @param {Object} plugin - Objeto plugin con estructura definida
     * @param {Object} options - Opciones de registro
     */
    async register(name, plugin, options = {}) {
        try {
            console.log(`🔌 Registering plugin: ${name}`);
            
            // Validar nombre único
            if (this.plugins.has(name)) {
                if (!options.replace) {
                    throw new Error(`Plugin "${name}" already exists. Use replace: true to override.`);
                }
                console.warn(`⚠️ Replacing existing plugin: ${name}`);
            }

            // Validar estructura del plugin
            if (this.config.validatePlugins) {
                this._validatePluginStructure(name, plugin);
            }

            // Marcar como loading
            this.loading.add(name);

            // Ejecutar setup del plugin con timeout
            const setupPromise = this._setupPlugin(name, plugin, options);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error(`Plugin ${name} setup timeout`)), this.config.maxLoadTime)
            );

            const setupResult = await Promise.race([setupPromise, timeoutPromise]);

            // Crear wrapper del plugin
            const pluginWrapper = {
                name,
                plugin: setupResult,
                version: plugin.version || '1.0.0',
                dependencies: plugin.dependencies || [],
                metadata: plugin.metadata || {},
                loadedAt: new Date().toISOString(),
                active: true,
                options
            };

            // Registrar en el system
            this.plugins.set(name, pluginWrapper);
            this.loading.delete(name);

            // Registrar hooks del plugin
            if (plugin.hooks) {
                this._registerPluginHooks(name, plugin.hooks);
            }

            // Emitir evento de registro
            this._emit('pluginRegistered', { name, plugin: pluginWrapper });

            console.log(`✅ Plugin registered successfully: ${name}`);
            return pluginWrapper;

        } catch (error) {
            this.loading.delete(name);
            console.error(`❌ Failed to register plugin ${name}:`, error);
            this._emit('pluginError', { name, error, phase: 'registration' });
            throw error;
        }
    }

    /**
     * Desregistrar un plugin
     */
    async unregister(name) {
        try {
            console.log(`🔌 Unregistering plugin: ${name}`);

            const pluginWrapper = this.plugins.get(name);
            if (!pluginWrapper) {
                throw new Error(`Plugin "${name}" not found`);
            }

            // Ejecutar cleanup del plugin
            if (pluginWrapper.plugin.cleanup) {
                await pluginWrapper.plugin.cleanup();
            }

            // Remover hooks
            this._unregisterPluginHooks(name);

            // Remover del registry
            this.plugins.delete(name);

            // Emitir evento
            this._emit('pluginUnregistered', { name });

            console.log(`✅ Plugin unregistered: ${name}`);

        } catch (error) {
            console.error(`❌ Failed to unregister plugin ${name}:`, error);
            throw error;
        }
    }

    // ===================================================================
    // ACCESO A PLUGINS
    // ===================================================================

    /**
     * Obtener un plugin por nombre
     */
    get(name) {
        const wrapper = this.plugins.get(name);
        return wrapper?.active ? wrapper.plugin : null;
    }

    /**
     * Verificar si un plugin existe y está activo
     */
    has(name) {
        const wrapper = this.plugins.get(name);
        return wrapper?.active || false;
    }

    /**
     * Listar todos los plugins activos
     */
    list() {
        return Array.from(this.plugins.entries())
            .filter(([, wrapper]) => wrapper.active)
            .map(([name, wrapper]) => ({
                name,
                version: wrapper.version,
                loadedAt: wrapper.loadedAt,
                dependencies: wrapper.dependencies,
                metadata: wrapper.metadata
            }));
    }

    /**
     * Obtener plugin con metadata completa
     */
    getWithMetadata(name) {
        return this.plugins.get(name) || null;
    }

    // ===================================================================
    // SISTEMA DE HOOKS
    // ===================================================================

    /**
     * Ejecutar un hook específico
     */
    async executeHook(hookName, context = {}, ...args) {
        const hookPlugins = this.hooks.get(hookName) || [];
        const results = [];

        console.log(`🪝 Executing hook: ${hookName} (${hookPlugins.length} listeners)`);

        for (const { pluginName, handler } of hookPlugins) {
            try {
                const result = await handler.call(this, context, ...args);
                results.push({ pluginName, result });
            } catch (error) {
                console.error(`❌ Hook error in plugin ${pluginName} for hook ${hookName}:`, error);
                results.push({ pluginName, error });
            }
        }

        return results;
    }

    /**
     * Registrar listener para un hook
     */
    addHook(hookName, pluginName, handler) {
        if (!this.hooks.has(hookName)) {
            this.hooks.set(hookName, []);
        }
        
        this.hooks.get(hookName).push({ pluginName, handler });
        console.log(`🪝 Hook registered: ${hookName} by ${pluginName}`);
    }

    // ===================================================================
    // HOT RELOADING
    // ===================================================================

    /**
     * Recargar un plugin (hot-reload)
     */
    async reload(name, newPlugin, options = {}) {
        try {
            console.log(`🔄 Hot-reloading plugin: ${name}`);

            // Desregistrar versión actual
            if (this.has(name)) {
                await this.unregister(name);
            }

            // Registrar nueva versión
            await this.register(name, newPlugin, { ...options, replace: true });

            this._emit('pluginReloaded', { name });
            console.log(`✅ Plugin hot-reloaded: ${name}`);

        } catch (error) {
            console.error(`❌ Failed to hot-reload plugin ${name}:`, error);
            this._emit('pluginError', { name, error, phase: 'hot-reload' });
            throw error;
        }
    }

    /**
     * Activar/Desactivar plugin sin desregistrar
     */
    toggle(name, active = null) {
        const wrapper = this.plugins.get(name);
        if (!wrapper) {
            throw new Error(`Plugin "${name}" not found`);
        }

        wrapper.active = active !== null ? active : !wrapper.active;
        
        this._emit('pluginToggled', { name, active: wrapper.active });
        console.log(`🔄 Plugin ${name} ${wrapper.active ? 'activated' : 'deactivated'}`);
        
        return wrapper.active;
    }

    // ===================================================================
    // VALIDACIÓN Y SETUP
    // ===================================================================

    /**
     * Validar estructura mínima del plugin
     * @private
     */
    _validatePluginStructure(name, plugin) {
        const required = ['name', 'init'];
        const optional = ['cleanup', 'hooks', 'metadata', 'dependencies', 'version'];

        // Verificar campos requeridos
        for (const field of required) {
            if (!(field in plugin)) {
                throw new Error(`Plugin "${name}" missing required field: ${field}`);
            }
        }

        // Verificar tipos
        if (typeof plugin.init !== 'function') {
            throw new Error(`Plugin "${name}": init must be a function`);
        }

        if (plugin.cleanup && typeof plugin.cleanup !== 'function') {
            throw new Error(`Plugin "${name}": cleanup must be a function`);
        }

        if (plugin.hooks && typeof plugin.hooks !== 'object') {
            throw new Error(`Plugin "${name}": hooks must be an object`);
        }

        console.log(`✅ Plugin structure validation passed: ${name}`);
    }

    /**
     * Setup inicial del plugin
     * @private
     */
    async _setupPlugin(name, plugin, options) {
        try {
            // Verificar dependencias
            if (this.config.allowDependencies && plugin.dependencies) {
                this._checkDependencies(name, plugin.dependencies);
            }

            // Ejecutar init del plugin
            const context = {
                pluginManager: this,
                name,
                options,
                emit: (event, data) => this._emit(`plugin:${name}:${event}`, data)
            };

            const result = await plugin.init(context);
            
            console.log(`✅ Plugin setup completed: ${name}`);
            return result || plugin;

        } catch (error) {
            console.error(`❌ Plugin setup failed: ${name}`, error);
            throw error;
        }
    }

    /**
     * Verificar dependencias del plugin
     * @private
     */
    _checkDependencies(name, dependencies) {
        const missing = dependencies.filter(dep => !this.has(dep));
        
        if (missing.length > 0) {
            throw new Error(`Plugin "${name}" missing dependencies: ${missing.join(', ')}`);
        }
        
        console.log(`✅ Dependencies satisfied for plugin: ${name}`);
    }

    /**
     * Registrar hooks de un plugin
     * @private
     */
    _registerPluginHooks(pluginName, hooks) {
        Object.entries(hooks).forEach(([hookName, handler]) => {
            this.addHook(hookName, pluginName, handler);
        });
    }

    /**
     * Desregistrar hooks de un plugin
     * @private
     */
    _unregisterPluginHooks(pluginName) {
        for (const [hookName, handlers] of this.hooks.entries()) {
            const filtered = handlers.filter(h => h.pluginName !== pluginName);
            this.hooks.set(hookName, filtered);
        }
    }

    // ===================================================================
    // EVENTOS Y DEBUGGING
    // ===================================================================

    /**
     * Emitir evento interno
     * @private
     */
    _emit(eventName, data) {
        const listeners = this.listeners.get(eventName) || [];
        listeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`❌ Event listener error for ${eventName}:`, error);
            }
        });
    }

    /**
     * Escuchar eventos del plugin manager
     */
    on(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        this.listeners.get(eventName).push(callback);
    }

    /**
     * Quitar listener de evento
     */
    off(eventName, callback) {
        const listeners = this.listeners.get(eventName) || [];
        const filtered = listeners.filter(cb => cb !== callback);
        this.listeners.set(eventName, filtered);
    }

    // ===================================================================
    // DEBUGGING Y ESTADÍSTICAS
    // ===================================================================

    /**
     * Obtener información de debugging
     */
    getDebugInfo() {
        return {
            pluginCount: this.plugins.size,
            activePlugins: Array.from(this.plugins.values()).filter(p => p.active).length,
            hookCount: Array.from(this.hooks.values()).reduce((sum, handlers) => sum + handlers.length, 0),
            loading: Array.from(this.loading),
            config: this.config,
            events: Array.from(this.listeners.keys())
        };
    }

    /**
     * Obtener estadísticas de rendimiento
     */
    getStats() {
        const plugins = Array.from(this.plugins.values());
        
        return {
            totalPlugins: plugins.length,
            activePlugins: plugins.filter(p => p.active).length,
            loadTimes: plugins.map(p => ({
                name: p.name,
                loadedAt: p.loadedAt,
                version: p.version
            })),
            memoryUsage: plugins.reduce((sum, p) => {
                // Estimación básica de memoria
                return sum + JSON.stringify(p).length;
            }, 0),
            hookStats: Array.from(this.hooks.entries()).map(([name, handlers]) => ({
                hookName: name,
                listenerCount: handlers.length,
                plugins: handlers.map(h => h.pluginName)
            }))
        };
    }

    /**
     * Limpiar todos los plugins (para testing/reset)
     */
    async clear() {
        console.log('🧹 Clearing all plugins...');
        
        const pluginNames = Array.from(this.plugins.keys());
        
        for (const name of pluginNames) {
            await this.unregister(name);
        }
        
        this.hooks.clear();
        this.listeners.clear();
        this.loading.clear();
        
        console.log('✅ All plugins cleared');
    }
}

// ===================================================================
// INSTANCIA SINGLETON
// ===================================================================

// Crear instancia global única
const pluginManager = new PluginManager();

// Exportar instancia y clase
export default pluginManager;
export { PluginManager };

// ===================================================================
// UTILS PARA DESARROLLO DE PLUGINS
// ===================================================================

/**
 * Helper para crear plugins con estructura estándar
 */
export const createPlugin = (config) => {
    const {
        name,
        version = '1.0.0',
        dependencies = [],
        metadata = {},
        init,
        cleanup,
        hooks = {}
    } = config;

    // Validación básica
    if (!name || !init) {
        throw new Error('Plugin must have name and init function');
    }

    return {
        name,
        version,
        dependencies,
        metadata,
        init,
        cleanup,
        hooks
    };
};

/**
 * Decorator para métodos de plugins con manejo de errores
 */
export const withErrorHandling = (method, pluginName) => {
    return async (...args) => {
        try {
            return await method(...args);
        } catch (error) {
            console.error(`❌ Error in plugin ${pluginName}:`, error);
            pluginManager._emit('pluginError', { 
                name: pluginName, 
                error, 
                phase: 'method-execution' 
            });
            throw error;
        }
    };
};

// ===================================================================
// DEBUGGING EN DESARROLLO
// ===================================================================

if (process.env.NODE_ENV === 'development') {
    // Exponer para debugging en consola
    window.pluginManager = pluginManager;
    
    // Logging automático de eventos
    pluginManager.on('pluginRegistered', (data) => {
        console.log('🔌 Plugin registered:', data.name);
    });
    
    pluginManager.on('pluginError', (data) => {
        console.error('❌ Plugin error:', data);
    });
    
    console.log('🔧 PluginManager exposed to window for debugging');
}
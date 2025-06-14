// ===================================================================
// resources/js/block-builder/plugins/variables/index.js
// ACTUALIZADO - Con integración mejorada para preview
// ===================================================================

import { 
    SystemProvider, 
    UserProvider, 
    SiteProvider, 
    TemplatesProvider,
    createCustomProvider 
} from './providers.js';

import DatabaseProvider from './database/DatabaseProvider.js';
import variableAPI from './api/VariableAPI.js';

import { VariableProcessor, VariableAnalyzer } from './processor.js';
import { 
    getVariableCompletions,
    getVariableContentCompletions,
    validateVariablesInCode,
    analyzeVariableUsage,
    recordRecentVariable 
} from './editor.js';

const variablesPlugin = {
    name: 'variables',
    version: '2.2.0', // Updated version
    dependencies: [],
    previewPriority: 95,
    
    // ===================================================================
    // INICIALIZACIÓN MEJORADA
    // ===================================================================
    
    async init(context) {
        console.log('🎯 Initializing Variables Plugin v2.2.0...');
        
        try {
            // Inicializar el procesador con providers
            this.processor = new VariableProcessor();
            this.analyzer = new VariableAnalyzer(this.processor);
            
            // Registrar DatabaseProvider primero (mayor prioridad)
            this.processor.addProvider('database', DatabaseProvider);
            
            // Registrar providers existentes
            this.processor.addProvider('system', SystemProvider);
            this.processor.addProvider('user', UserProvider);
            this.processor.addProvider('site', SiteProvider);
            this.processor.addProvider('templates', TemplatesProvider);
            
            // Inicializar API wrapper
            this.api = variableAPI;
            
            // Iniciar auto-refresh donde sea necesario
            SystemProvider.startAutoRefresh();
            DatabaseProvider.startAutoRefresh();
            
            // Configurar el procesador global
            window.processVariables = (content) => this.processVariables(content);
            
            // Configurar funciones de CodeMirror
            this._setupEditorIntegration();
            
            // NUEVO: Configurar invalidación de cache para preview
            this._setupPreviewIntegration();
            
            // Exponer API para interfaces de administración
            this._setupAdminAPI();
            
            console.log('✅ Variables Plugin initialized successfully');
            return this;
            
        } catch (error) {
            console.error('❌ Error initializing Variables Plugin:', error);
            throw error;
        }
    },

    // ===================================================================
    // NUEVA: INTEGRACIÓN CON PREVIEW
    // ===================================================================
    
    _setupPreviewIntegration() {
        // Lista de listeners para cambios en variables
        this._previewListeners = [];
        
        // Configurar listeners para invalidar cache del preview
        this._addVariableChangeListener((event, data) => {
            console.log(`📡 Variable event for preview: ${event}`, data);
            
            // Notificar al preview que las variables han cambiado
            this._notifyPreviewListeners(event, data);
            
            // Emitir evento global para que el preview se actualice
            window.dispatchEvent(new CustomEvent('variableChanged', {
                detail: { event, data, timestamp: Date.now() }
            }));
        });
        
        // Listener específico para refresh de DatabaseProvider
        DatabaseProvider.onRefresh = () => {
            console.log('💾 Database variables refreshed, notifying preview...');
            this._notifyPreviewListeners('databaseRefreshed', {
                provider: 'database',
                timestamp: Date.now()
            });
        };
        
        console.log('🔗 Preview integration configured');
    },

    /**
     * Agregar listener para cambios que afecten al preview
     */
    addPreviewListener(callback) {
        if (typeof callback === 'function') {
            this._previewListeners.push(callback);
        }
    },

    /**
     * Notificar a listeners del preview sobre cambios
     */
    _notifyPreviewListeners(event, data) {
        if (this._previewListeners) {
            this._previewListeners.forEach(callback => {
                try {
                    callback(event, data);
                } catch (error) {
                    console.error('Error in preview listener:', error);
                }
            });
        }
    },

    // ===================================================================
    // CONFIGURACIÓN DE API PARA ADMIN (ACTUALIZADA)
    // ===================================================================
    
    _setupAdminAPI() {
        // Exponer API para interfaces de administración
        window.variablesAdmin = {
            // CRUD operations
            create: async (data) => {
                const result = await this.api.create(data);
                await this._refreshProvider('database');
                this._emit('variableCreated', result);
                return result;
            },
            
            update: async (id, data) => {
                const result = await this.api.update(id, data);
                await this._refreshProvider('database');
                this._emit('variableUpdated', result);
                return result;
            },
            
            delete: async (id) => {
                const result = await this.api.delete(id);
                await this._refreshProvider('database');
                this._emit('variableDeleted', { id, result });
                return result;
            },
            
            getAll: (filters) => this.api.getAll(filters),
            getById: (id) => this.api.getById(id),
            
            // Special operations
            test: (data) => this.api.test(data),
            
            refresh: async (id) => {
                const result = await this.api.refresh(id);
                await this._refreshProvider('database');
                this._emit('variableRefreshed', { id, result });
                return result;
            },
            
            refreshAll: async () => {
                await this._refreshProvider('database');
                this._emit('allVariablesRefreshed', { timestamp: Date.now() });
                console.log('🔄 All variables refreshed');
            },
            
            getCategories: () => this.api.getCategories(),
            
            // Bulk operations
            createMultiple: async (variables) => {
                const result = await this.api.createMultiple(variables);
                await this._refreshProvider('database');
                this._emit('variablesCreatedBulk', result);
                return result;
            },
            
            updateMultiple: async (updates) => {
                const result = await this.api.updateMultiple(updates);
                await this._refreshProvider('database');
                this._emit('variablesUpdatedBulk', result);
                return result;
            },
            
            deleteMultiple: async (ids) => {
                const result = await this.api.deleteMultiple(ids);
                await this._refreshProvider('database');
                this._emit('variablesDeletedBulk', { ids, result });
                return result;
            },
            
            refreshMultiple: async (ids) => {
                const result = await this.api.refreshMultiple(ids);
                await this._refreshProvider('database');
                this._emit('variablesRefreshedBulk', { ids, result });
                return result;
            },
            
            // Utilities
            validateKey: (key) => this.api.validateKey(key),
            validateConfig: (type, config) => this.api.validateConfig(type, config),
            formatVariable: (variable) => this.api.formatVariable(variable),
            
            // Events and preview integration
            onVariableChange: (callback) => this._addVariableChangeListener(callback),
            addPreviewListener: (callback) => this.addPreviewListener(callback),
            refreshProvider: (providerName) => this._refreshProvider(providerName),
            
            // NUEVAS: Funciones para invalidar cache del preview
            invalidatePreviewCache: () => {
                window.dispatchEvent(new CustomEvent('variablesForceRefresh'));
                console.log('🗑️ Preview cache invalidated');
            },
            
            forcePreviewRefresh: async () => {
                await this._refreshProvider('database');
                window.dispatchEvent(new CustomEvent('variablesForceRefresh'));
                console.log('🔄 Preview force refreshed');
            }
        };
        
        console.log('🔧 Variables Admin API exposed to window.variablesAdmin');
    },

    // ===================================================================
    // MÉTODOS DE GESTIÓN AVANZADA (ACTUALIZADOS)
    // ===================================================================
    
    /**
     * Refrescar un provider específico
     */
    async _refreshProvider(providerName) {
        const provider = this.processor.getProvider(providerName);
        if (provider && provider.refresh) {
            await provider.refresh();
            this._emit('providerRefreshed', { provider: providerName });
            
            // Notificar específicamente al preview
            this._notifyPreviewListeners('providerRefreshed', { 
                provider: providerName,
                timestamp: Date.now()
            });
        }
    },

    /**
     * Agregar listener para cambios en variables
     */
    _addVariableChangeListener(callback) {
        if (!this._changeListeners) {
            this._changeListeners = [];
        }
        this._changeListeners.push(callback);
    },

    /**
     * Emitir evento de cambio en variables
     */
    _emit(event, data) {
        if (this._changeListeners) {
            this._changeListeners.forEach(callback => {
                try {
                    callback(event, data);
                } catch (error) {
                    console.error('Error in variable change listener:', error);
                }
            });
        }
    },

    // ===================================================================
    // OPERACIONES CRUD MEJORADAS
    // ===================================================================
    
    /**
     * Crear variable desde interfaz
     */
    async createVariable(data) {
        try {
            const result = await this.api.create(data);
            
            // Refrescar DatabaseProvider para obtener la nueva variable
            await this._refreshProvider('database');
            
            this._emit('variableCreated', result);
            return result;
            
        } catch (error) {
            console.error('❌ Error creating variable:', error);
            throw error;
        }
    },

    /**
     * Actualizar variable desde interfaz
     */
    async updateVariable(id, data) {
        try {
            const result = await this.api.update(id, data);
            
            // Refrescar DatabaseProvider para obtener cambios
            await this._refreshProvider('database');
            
            this._emit('variableUpdated', result);
            return result;
            
        } catch (error) {
            console.error('❌ Error updating variable:', error);
            throw error;
        }
    },

    /**
     * Eliminar variable desde interfaz
     */
    async deleteVariable(id) {
        try {
            const result = await this.api.delete(id);
            
            // Refrescar DatabaseProvider para remover la variable
            await this._refreshProvider('database');
            
            this._emit('variableDeleted', { id, result });
            return result;
            
        } catch (error) {
            console.error('❌ Error deleting variable:', error);
            throw error;
        }
    },

    /**
     * Refrescar variable específica
     */
    async refreshVariable(id) {
        try {
            const result = await this.api.refresh(id);
            
            // Refrescar DatabaseProvider para obtener el nuevo valor
            await this._refreshProvider('database');
            
            this._emit('variableRefreshed', { id, result });
            return result;
            
        } catch (error) {
            console.error('❌ Error refreshing variable:', error);
            throw error;
        }
    },

    // ===================================================================
    // CONFIGURACIÓN EDITOR (MANTENIDA)
    // ===================================================================
    
    _setupEditorIntegration() {
        // Configurar autocompletado de CodeMirror
        if (window.getVariableCompletions) {
            console.log('⚠️ Overriding existing getVariableCompletions');
        }
        
        window.getVariableCompletions = (context) => {
            return getVariableCompletions(context, this);
        };
        
        window.getVariableContentCompletions = (context) => {
            return getVariableContentCompletions(context, this);
        };
        
        // Funciones de análisis
        window.validateVariablesInCode = (code) => {
            return validateVariablesInCode(code, this);
        };
        
        window.analyzeVariableUsage = (code) => {
            return analyzeVariableUsage(code, this);
        };
        
        // Función para registrar uso reciente
        window.recordRecentVariable = (variable) => {
            recordRecentVariable(variable);
        };
        
        console.log('🔧 Editor integration configured');
    },

    // ===================================================================
    // FUNCIONES PRINCIPALES (MANTENIDAS)
    // ===================================================================
    
    /**
     * Procesar contenido reemplazando variables
     */
    processContent(content) {
        if (!content || typeof content !== 'string') {
            return content;
        }
        
        try {
            return this.processor.processContent(content);
        } catch (error) {
            console.error('Error processing variables:', error);
            return content;
        }
    },

    /**
     * Alias para compatibilidad
     */
    processVariables(content) {
        return this.processContent(content);
    },

    /**
     * Obtener todas las variables disponibles
     */
 // Reemplazar el método getAllVariables() con la versión corregida del fix
    getAllVariables() {
        const allVariables = {};
        
        for (const [name, provider] of this.processor.providers.entries()) {
            try {
                let variables = provider.getVariables();
                
                // CORRECCIÓN: Si es una Promise, usar el cache directo
                if (variables && typeof variables.then === 'function') {
                    if (name === 'database' && provider._variables) {
                        variables = provider._variables;
                    } else {
                        variables = {};
                    }
                }
                
                allVariables[name] = {
                    title: provider.title || name,
                    priority: provider.priority || 50,
                    variables: variables || {},
                    metadata: {
                        title: provider.title || name,
                        priority: provider.priority || 50,
                        category: provider.category || 'general'
                    }
                };
                
            } catch (error) {
                console.error(`Error getting variables from ${name}:`, error);
                allVariables[name] = {
                    title: provider.title || name,
                    priority: provider.priority || 50,
                    variables: {},
                    error: error.message
                };
            }
        }
        
        return allVariables;
    },


    /**
     * Obtener provider específico
     */
    getProvider(name) {
        return this.processor?.getProvider(name);
    },


     getVariable(variableKey) {
        try {
            if (!this.processor) return undefined;
            
            // Buscar en todos los providers
            for (const [providerName, provider] of this.processor.providers.entries()) {
                try {
                    const variables = provider.getVariables();
                    if (variables && variables.hasOwnProperty(variableKey)) {
                        return variables[variableKey];
                    }
                } catch (error) {
                    console.error(`Error getting variable from ${providerName}:`, error);
                }
            }
            
            return undefined;
            
        } catch (error) {
            console.error('Error in getVariable:', error);
            return undefined;
        }
    },

      getVariableInfo(variableKey) {
        try {
            if (!this.processor) return null;
            
            for (const [providerName, provider] of this.processor.providers.entries()) {
                try {
                    const variables = provider.getVariables();
                    if (variables && variables.hasOwnProperty(variableKey)) {
                        return {
                            key: variableKey,
                            value: variables[variableKey],
                            provider: providerName,
                            providerTitle: provider.title || providerName,
                            category: provider.category || 'unknown',
                            priority: provider.priority || 50,
                            type: typeof variables[variableKey],
                            lastUpdated: provider.lastUpdated
                        };
                    }
                } catch (error) {
                    console.error(`Error getting variable info from ${providerName}:`, error);
                }
            }
            
            return null;
            
        } catch (error) {
            console.error('Error in getVariableInfo:', error);
            return null;
        }
    },

      hasVariable(variableKey) {
        return this.getVariable(variableKey) !== undefined;
    },

     getVariableKeys() {
        try {
            const keys = new Set();
            
            if (!this.processor) return [];
            
            for (const [providerName, provider] of this.processor.providers.entries()) {
                try {
                    const variables = provider.getVariables();
                    if (variables) {
                        Object.keys(variables).forEach(key => keys.add(key));
                    }
                } catch (error) {
                    console.error(`Error getting keys from ${providerName}:`, error);
                }
            }
            
            return Array.from(keys).sort();
            
        } catch (error) {
            console.error('Error getting variable keys:', error);
            return [];
        }
    },

    /**
     * Agregar provider personalizado
     */
    addProvider(name, provider) {
        if (this.processor) {
            this.processor.addProvider(name, provider);
        }
    },

    // ===================================================================
    // DEBUG Y DESARROLLO (ACTUALIZADO)
    // ===================================================================
    
        getDebugInfo() {
                if (process.env.NODE_ENV === 'development') {
                    return {
                        version: this.version,
                        processors: this.processor ? this.processor.providers.size : 0,
                        
                        // Debug de providers
                        testProviders() {
                            const allVars = variablesPlugin.getAllVariables();
                            console.log('🔍 Testing all providers:');
                            Object.entries(allVars).forEach(([name, provider]) => {
                                console.log(`📦 ${name}:`, provider);
                            });
                        },
                        
                        // NUEVO: Test del método getVariable
                        testGetVariable(key = 'site.company_name') {
                            console.log(`🎯 Testing getVariable('${key}'):`);
                            const value = variablesPlugin.getVariable(key);
                            const info = variablesPlugin.getVariableInfo(key);
                            console.log('Value:', value);
                            console.log('Info:', info);
                            return { value, info };
                        },
                        
                        // NUEVO: Listar todas las claves
                        showAllKeys() {
                            const keys = variablesPlugin.getVariableKeys();
                            console.log('🔑 All variable keys:', keys);
                            return keys;
                        },
                        
                        // Test específico de database
                        async testDatabase() {
                            const dbProvider = variablesPlugin.getProvider('database');
                            if (dbProvider) {
                                console.log('💾 Testing database provider...');
                                await dbProvider.refresh();
                                const vars = dbProvider.getVariables();
                                console.log('Variables from DB:', vars);
                            } else {
                                console.log('❌ Database provider not found');
                            }
                        },
                        
                        // Debug de cache
                        showCache() {
                            const dbProvider = variablesPlugin.getProvider('database');
                            console.log('💾 Database Provider State:');
                            console.log('Cache:', dbProvider?.cache);
                            console.log('Last fetch:', dbProvider?.lastFetch);
                            console.log('Loading:', dbProvider?.loading);
                        },
                        
                        // Test API connection
                        testAPI: async () => {
                            try {
                                const categories = await variablesPlugin.api.getCategories();
                                console.log('✅ API Connection OK');
                                console.log('Categories:', categories);
                            } catch (error) {
                                console.error('❌ API Connection Failed:', error);
                            }
                        },
                        
                        // Test preview integration
                        testPreviewIntegration() {
                            console.log('🔍 Testing preview integration...');
                            variablesPlugin._emit('testEvent', { test: true });
                            console.log('Preview listeners:', variablesPlugin._previewListeners?.length || 0);
                            console.log('Change listeners:', variablesPlugin._changeListeners?.length || 0);
                        },
                        
                        // Force refresh para debug
                        async forceRefreshAll() {
                            console.log('🔄 Force refreshing all providers...');
                            await variablesPlugin._refreshProvider('database');
                            await variablesPlugin._refreshProvider('system');
                            window.dispatchEvent(new CustomEvent('variablesForceRefresh'));
                            console.log('✅ Force refresh completed');
                        }
                    };
                }
            },

    // ===================================================================
    // CLEANUP (ACTUALIZADO)
    // ===================================================================
    
    async cleanup() {
        try {
            // Detener auto-refresh de providers
            SystemProvider.stopAutoRefresh();
            DatabaseProvider.stopAutoRefresh();
            
            // Limpiar providers
            for (const [name, provider] of this.processor.providers.entries()) {
                if (provider.cleanup) {
                    await provider.cleanup();
                }
            }
            
            // Limpiar procesador
            this.processor.clearCache();
            
            // Limpiar funciones globales
            delete window.processVariables;
            delete window.debugVariables;
            delete window.variablesAdmin;
            
            // Limpiar listeners
            this._changeListeners = [];
            this._previewListeners = [];
            
            console.log('🧹 Variables plugin cleaned up');
        } catch (error) {
            console.error('Error cleaning up variables plugin:', error);
        }
    }
};



// ===================================================================
// DEBUGGING Y DESARROLLO (ACTUALIZADO)
// ===================================================================

if (process.env.NODE_ENV === 'development') {
    // Exponer plugin para debugging
    window.variablesPlugin = variablesPlugin;
    window.DatabaseProvider = DatabaseProvider;
    window.variableAPI = variableAPI;
    
    console.log('🔧 Variables plugin (v2.2.0) exposed to window for debugging');
}

export default variablesPlugin;
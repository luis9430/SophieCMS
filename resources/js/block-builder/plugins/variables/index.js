// resources/js/block-builder/plugins/variables/index.js - UPDATED

import { 
    SystemProvider, 
    UserProvider, 
    SiteProvider, 
    TemplatesProvider,
    createCustomProvider 
} from './providers.js';

// NUEVO: Import DatabaseProvider
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
    version: '2.1.0', // Updated version
    dependencies: [],
    previewPriority: 95,
    
    // ===================================================================
    // INICIALIZACIÓN
    // ===================================================================
    
    async init(context) {
        console.log('🎯 Initializing Variables Plugin v2.1.0...');
        
        try {
            // Inicializar el procesador con providers
            this.processor = new VariableProcessor();
            this.analyzer = new VariableAnalyzer(this.processor);
            
            // NUEVO: Registrar DatabaseProvider primero (mayor prioridad)
            this.processor.addProvider('database', DatabaseProvider);
            
            // Registrar providers existentes
            this.processor.addProvider('system', SystemProvider);
            this.processor.addProvider('user', UserProvider);
            this.processor.addProvider('site', SiteProvider);
            this.processor.addProvider('templates', TemplatesProvider);
            
            // NUEVO: Inicializar API wrapper
            this.api = variableAPI;
            
            // Iniciar auto-refresh donde sea necesario
            SystemProvider.startAutoRefresh();
            DatabaseProvider.startAutoRefresh(); // NUEVO
            
            // Configurar el procesador global
            window.processVariables = (content) => this.processVariables(content);
            
            // Configurar funciones de CodeMirror
            this._setupEditorIntegration();
            
            // NUEVO: Exponer API para interfaces de administración
            this._setupAdminAPI();
            
            console.log('✅ Variables Plugin initialized successfully');
            return this;
            
        } catch (error) {
            console.error('❌ Error initializing Variables Plugin:', error);
            throw error;
        }
    },

    // ===================================================================
    // NUEVA: CONFIGURACIÓN DE API PARA ADMIN
    // ===================================================================
    
    _setupAdminAPI() {
        // Exponer API para interfaces de administración
        window.variablesAdmin = {
            // CRUD operations
            create: (data) => this.api.create(data),
            update: (id, data) => this.api.update(id, data),
            delete: (id) => this.api.delete(id),
            getAll: (filters) => this.api.getAll(filters),
            getById: (id) => this.api.getById(id),
            
            // Special operations
            test: (data) => this.api.test(data),
            refresh: (id) => this.api.refresh(id),
            getCategories: () => this.api.getCategories(),
            
            // Bulk operations
            createMultiple: (variables) => this.api.createMultiple(variables),
            updateMultiple: (updates) => this.api.updateMultiple(updates),
            deleteMultiple: (ids) => this.api.deleteMultiple(ids),
            refreshMultiple: (ids) => this.api.refreshMultiple(ids),
            
            // Utilities
            validateKey: (key) => this.api.validateKey(key),
            validateConfig: (type, config) => this.api.validateConfig(type, config),
            formatVariable: (variable) => this.api.formatVariable(variable),
            
            // Events
            onVariableChange: (callback) => this._addVariableChangeListener(callback),
            refreshProvider: (providerName) => this._refreshProvider(providerName)
        };
        
        console.log('🔧 Variables Admin API exposed to window.variablesAdmin');
    },

    // ===================================================================
    // NUEVOS: MÉTODOS DE GESTIÓN AVANZADA
    // ===================================================================
    
    /**
     * Refrescar un provider específico
     */
    async _refreshProvider(providerName) {
        const provider = this.processor.getProvider(providerName);
        if (provider && provider.refresh) {
            await provider.refresh();
            this._emit('providerRefreshed', { provider: providerName });
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

    /**
     * NUEVO: Crear variable desde interfaz
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
     * NUEVO: Actualizar variable desde interfaz
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
     * NUEVO: Eliminar variable desde interfaz
     */
    async deleteVariable(id) {
        try {
            const result = await this.api.delete(id);
            
            // Refrescar DatabaseProvider para remover la variable
            await this._refreshProvider('database');
            
            this._emit('variableDeleted', { id });
            return result;
            
        } catch (error) {
            console.error('❌ Error deleting variable:', error);
            throw error;
        }
    },

    /**
     * NUEVO: Probar configuración de variable
     */
    async testVariable(data) {
        try {
            return await this.api.test(data);
        } catch (error) {
            console.error('❌ Error testing variable:', error);
            throw error;
        }
    },

    // ===================================================================
    // MÉTODOS EXISTENTES (sin cambios)
    // ===================================================================
    
    _setupEditorIntegration() {
        if (window.editorBridge) {
            window.editorBridge.onVariableRequest = (context) => {
                return getVariableCompletions(context, this);
            };
            
            window.editorBridge.onVariableValidation = (content) => {
                return validateVariablesInCode(content, this);
            };
            
            console.log('🔧 Variables editor integration configured');
        }
    },

    processVariables(content) {
        if (!content || typeof content !== 'string') {
            return content;
        }

        try {
            return this.processor.process(content);
        } catch (error) {
            console.error('❌ Error processing variables:', error);
            return content;
        }
    },

    getVariable(path) {
        return this.processor.getVariable(path);
    },

    getAllVariables() {
        return this.processor.getAllVariables();
    },

    getProviderVariables(providerName) {
        return this.processor.getProviderVariables(providerName);
    },

    getVariablesByCategory(category) {
        const allVars = this.getAllVariables();
        const filtered = {};
        
        Object.entries(allVars).forEach(([providerKey, providerData]) => {
            if (providerData.metadata?.category === category) {
                Object.assign(filtered, providerData.variables);
            }
        });
        
        return filtered;
    },

    analyzeContent(content) {
        return this.analyzer.analyze(content);
    },

    validateVariable(path) {
        return this.processor.hasVariable(path);
    },

    formatVariableForInsertion(path) {
        return `{{${path}}}`;
    },

    addProvider(name, provider) {
        this.processor.addProvider(name, provider);
        console.log(`➕ Variable provider added: ${name}`);
    },

    removeProvider(name) {
        this.processor.removeProvider(name);
        console.log(`➖ Variable provider removed: ${name}`);
    },

    // ===================================================================
    // DEBUG HELPERS (UPDATED)
    // ===================================================================
    
    _setupDebugHelpers() {
        if (process.env.NODE_ENV === 'development') {
            window.debugVariables = {
                // Existing methods...
                listProviders: () => {
                    console.table(Array.from(this.processor.providers.entries()).map(([name, provider]) => ({
                        name,
                        title: provider.title,
                        category: provider.category,
                        priority: provider.priority,
                        variables: Object.keys(provider.getVariables()).length,
                        lastUpdated: provider.lastUpdated
                    })));
                },
                
                // NUEVO: Debug para DatabaseProvider
                debugDatabase: async () => {
                    console.log('💾 Database Provider Status:');
                    console.log('Loading:', DatabaseProvider.loading);
                    console.log('Last Fetch:', new Date(DatabaseProvider.lastFetch));
                    console.log('Variables Count:', Object.keys(await DatabaseProvider.getVariables()).length);
                    console.log('Cache:', DatabaseProvider.cache);
                },
                
                // NUEVO: Test API connection
                testAPI: async () => {
                    try {
                        const categories = await this.api.getCategories();
                        console.log('✅ API Connection OK');
                        console.log('Categories:', categories);
                    } catch (error) {
                        console.error('❌ API Connection Failed:', error);
                    }
                }
            };
        }
    },

    // ===================================================================
    // CLEANUP (UPDATED)
    // ===================================================================
    
    async cleanup() {
        try {
            // Detener auto-refresh de providers
            SystemProvider.stopAutoRefresh();
            DatabaseProvider.stopAutoRefresh(); // NUEVO
            
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
            delete window.variablesAdmin; // NUEVO
            
            // Limpiar listeners
            this._changeListeners = [];
            
            console.log('🧹 Variables plugin cleaned up');
        } catch (error) {
            console.error('Error cleaning up variables plugin:', error);
        }
    }
};

// ===================================================================
// DEBUGGING Y DESARROLLO (UPDATED)
// ===================================================================

if (process.env.NODE_ENV === 'development') {
    // Exponer plugin para debugging
    window.variablesPlugin = variablesPlugin;
    window.DatabaseProvider = DatabaseProvider;
    window.variableAPI = variableAPI;
    
    console.log('🔧 Variables plugin (v2.1.0) exposed to window for debugging');
}

export default variablesPlugin;
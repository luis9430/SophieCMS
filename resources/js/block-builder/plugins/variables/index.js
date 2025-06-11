// ===================================================================
// plugins/variables/index.js - FIXED VERSION
// Responsabilidad: Plugin Variables para el Page Builder (Con manejo de re-registro)
// ===================================================================

import { createPlugin } from '../../core/PluginManager.js';
import { VariableProvider, SystemProvider, UserProvider, SiteProvider, TemplatesProvider } from './providers.js';
import { VariableProcessor } from './processor.js';
import { getVariableCompletions, getVariableContentCompletions } from './editor.js';

/**
 * Plugin Variables para el Page Builder
 * Reemplaza el sistema legacy de variables con un sistema modular y extensible
 * 🔧 FIXED: Maneja correctamente el re-registro y múltiples inicializaciones
 */
const VariablesPlugin = createPlugin({
    name: 'variables',
    version: '1.0.1', // 🔧 Incrementada por el fix
    dependencies: [], // Variables es un plugin base, no depende de otros
    metadata: {
        title: 'Variables System',
        description: 'Sistema modular de variables dinámicas para templates',
        category: 'core',
        author: 'Page Builder Team',
        capabilities: [
            'variable-processing',
            'dynamic-providers',
            'autocompletion',
            'validation',
            'real-time-updates'
        ]
    },

    // ===================================================================
    // INICIALIZACIÓN DEL PLUGIN
    // ===================================================================

    async init(context) {
        const { pluginManager, name, emit } = context;
        
        console.log(`🎯 Initializing Variables Plugin v${this.version}`);

        // 🔧 VERIFICAR SI YA EXISTE UNA INSTANCIA
        const existingPlugin = pluginManager.get(name);
        if (existingPlugin && existingPlugin.state?.initialized) {
            console.log('⚠️ Variables plugin already initialized, cleaning up...');
            try {
                await existingPlugin.cleanup?.();
            } catch (error) {
                console.warn('Warning during cleanup of existing plugin:', error);
            }
        }

        // Estado interno del plugin
        const state = {
            providers: new Map(),
            processor: null,
            cache: new Map(),
            initialized: false,
            initTime: new Date().toISOString(),
            config: {
                cacheEnabled: true,
                autoRefresh: true,
                refreshInterval: 30000, // 30 segundos
                maxCacheSize: 1000
            }
        };

        // ===================================================================
        // INICIALIZAR COMPONENTES CORE
        // ===================================================================

        try {
            // 1. Crear procesador de variables
            state.processor = new VariableProcessor({
                providers: state.providers,
                cache: state.cache,
                config: state.config
            });

            // 2. Registrar providers por defecto
            await registerDefaultProviders(state, emit);

            // 3. Configurar auto-refresh si está habilitado
            if (state.config.autoRefresh) {
                setupAutoRefresh(state, emit);
            }

            console.log('✅ Variables plugin core components initialized');

        } catch (error) {
            console.error('❌ Error initializing Variables plugin core:', error);
            emit('error', { method: 'init', error });
            throw error;
        }

        // ===================================================================
        // API PÚBLICA DEL PLUGIN
        // ===================================================================

        const plugin = {
            name,
            state,
            version: this.version,

            // ===================================================================
            // GESTIÓN DE PROVIDERS
            // ===================================================================

            /**
             * Registrar nuevo provider de variables
             */
            registerProvider: (providerName, provider) => {
                try {
                    if (!(provider instanceof VariableProvider)) {
                        throw new Error('Provider must be instance of VariableProvider');
                    }

                    // 🔧 VERIFICAR SI YA EXISTE Y LIMPIAR SI ES NECESARIO
                    if (state.providers.has(providerName)) {
                        console.log(`🔄 Replacing existing provider: ${providerName}`);
                        const existingProvider = state.providers.get(providerName);
                        if (typeof existingProvider.cleanup === 'function') {
                            existingProvider.cleanup();
                        }
                    }

                    state.providers.set(providerName, provider);
                    
                    // Limpiar cache cuando se añade provider
                    if (state.config.cacheEnabled) {
                        state.cache.clear();
                    }

                    emit('providerRegistered', { name: providerName, provider });
                    console.log(`📦 Variable provider registered: ${providerName}`);
                    
                    return true;
                } catch (error) {
                    emit('error', { method: 'registerProvider', error });
                    throw error;
                }
            },

            /**
             * Obtener provider por nombre
             */
            getProvider: (providerName) => {
                return state.providers.get(providerName) || null;
            },

            /**
             * Listar todos los providers
             */
            listProviders: () => {
                return Array.from(state.providers.entries()).map(([name, provider]) => ({
                    name,
                    title: provider.title,
                    description: provider.description,
                    variableCount: Object.keys(provider.getVariables()).length,
                    lastUpdated: provider.lastUpdated
                }));
            },

            /**
             * Remover provider
             */
            removeProvider: (providerName) => {
                const provider = state.providers.get(providerName);
                if (provider && typeof provider.cleanup === 'function') {
                    provider.cleanup();
                }
                
                const removed = state.providers.delete(providerName);
                if (removed && state.config.cacheEnabled) {
                    state.cache.clear();
                }
                return removed;
            },

            // ===================================================================
            // PROCESAMIENTO DE VARIABLES
            // ===================================================================

            /**
             * Obtener todas las variables disponibles (Compatible con legacy)
             */
            getAvailableVariables: () => {
                try {
                    return state.processor.getAllVariables();
                } catch (error) {
                    emit('error', { method: 'getAvailableVariables', error });
                    console.error('Error getting available variables:', error);
                    return {};
                }
            },

            /**
             * Procesar variables en código HTML (Compatible con legacy)
             */
            processVariables: (htmlCode) => {
                try {
                    return state.processor.processCode(htmlCode);
                } catch (error) {
                    emit('error', { method: 'processVariables', error });
                    console.error('Error processing variables:', error);
                    return htmlCode; // Fallback a código original
                }
            },

            /**
             * Validar variable específica (Compatible con legacy)
             */
            validateVariable: (variablePath) => {
                try {
                    return state.processor.validateVariable(variablePath);
                } catch (error) {
                    emit('error', { method: 'validateVariable', error });
                    console.error('Error validating variable:', error);
                    return false;
                }
            },

            /**
             * Extraer variables de código (Compatible con legacy)
             */
            extractVariables: (htmlCode) => {
                try {
                    return state.processor.extractVariables(htmlCode);
                } catch (error) {
                    emit('error', { method: 'extractVariables', error });
                    console.error('Error extracting variables:', error);
                    return [];
                }
            },

            /**
             * Encontrar variables inválidas (Compatible con legacy)
             */
            findInvalidVariables: (htmlCode) => {
                try {
                    return state.processor.findInvalidVariables(htmlCode);
                } catch (error) {
                    emit('error', { method: 'findInvalidVariables', error });
                    console.error('Error finding invalid variables:', error);
                    return [];
                }
            },

            /**
             * Formatear variable para inserción (Compatible con legacy)
             */
            formatVariableForInsertion: (variablePath) => {
                return `{{ ${variablePath} }}`;
            },

            // ===================================================================
            // NUEVAS FUNCIONALIDADES (No en legacy)
            // ===================================================================

            /**
             * Obtener valor de variable específica
             */
            getVariableValue: (variablePath) => {
                try {
                    return state.processor.getVariableValue(variablePath);
                } catch (error) {
                    emit('error', { method: 'getVariableValue', error });
                    return null;
                }
            },

            /**
             * Actualizar variables de un provider específico
             */
            refreshProvider: async (providerName) => {
                try {
                    const provider = state.providers.get(providerName);
                    if (!provider) {
                        throw new Error(`Provider ${providerName} not found`);
                    }

                    if (typeof provider.refresh === 'function') {
                        await provider.refresh();
                        
                        // Limpiar cache
                        if (state.config.cacheEnabled) {
                            state.cache.clear();
                        }

                        emit('providerRefreshed', { providerName });
                        console.log(`🔄 Provider refreshed: ${providerName}`);
                    }
                } catch (error) {
                    emit('error', { method: 'refreshProvider', providerName, error });
                    throw error;
                }
            },

            /**
             * Actualizar todas las variables
             */
            refreshAllProviders: async () => {
                const results = [];
                
                for (const [name, provider] of state.providers.entries()) {
                    try {
                        if (typeof provider.refresh === 'function') {
                            await provider.refresh();
                            results.push({ name, success: true });
                        }
                    } catch (error) {
                        results.push({ name, success: false, error: error.message });
                        emit('error', { method: 'refreshAllProviders', providerName: name, error });
                    }
                }

                // Limpiar cache después de actualizar todo
                if (state.config.cacheEnabled) {
                    state.cache.clear();
                }

                emit('allProvidersRefreshed', { results });
                return results;
            },

            // ===================================================================
            // FUNCIONES PARA CODEMIRROR (Editor)
            // ===================================================================

            /**
             * Obtener sugerencias de autocompletado para CodeMirror
             */
            getCompletions: (context) => {
                try {
                    return getVariableCompletions(context, plugin);
                } catch (error) {
                    emit('error', { method: 'getCompletions', error });
                    return [];
                }
            },

            /**
             * Obtener sugerencias para contenido de variables
             */
            getContentCompletions: (context) => {
                try {
                    return getVariableContentCompletions(context, plugin);
                } catch (error) {
                    emit('error', { method: 'getContentCompletions', error });
                    return [];
                }
            },

            // ===================================================================
            // HOOK INTERFACE PARA USEVARIABLES
            // ===================================================================

            /**
             * Hook compatible con useVariables (para LegacyBridge)
             */
            useVariables: () => {
                // Importar hook legacy pero usar nuestros datos
                return {
                    // Estado UI (delegado al hook legacy por ahora)
                    showVariablesPanel: false,
                    expandedSections: { user: true, system: false, templates: false, site: false },
                    searchTerm: '',

                    // Datos desde nuestro plugin
                    availableVariables: plugin.getAvailableVariables(),
                    
                    // Funciones desde nuestro plugin
                    processCode: plugin.processVariables,
                    getUsedVariables: plugin.extractVariables,
                    isValidVariable: plugin.validateVariable,
                    getInvalidVariables: plugin.findInvalidVariables,
                    formatVariable: plugin.formatVariableForInsertion,

                    // Funciones UI (placeholder - implementar en futuro)
                    toggleVariablesPanel: () => console.log('toggleVariablesPanel'),
                    showPanel: () => console.log('showPanel'),
                    hidePanel: () => console.log('hidePanel'),
                    toggleSection: () => console.log('toggleSection'),
                    updateSearchTerm: () => console.log('updateSearchTerm'),
                    clearSearch: () => console.log('clearSearch'),

                    // Análisis mejorado
                    analyzeCode: (code) => {
                        const usedVars = plugin.extractVariables(code);
                        const invalidVars = plugin.findInvalidVariables(code);
                        
                        return {
                            totalVariables: usedVars.length,
                            validVariables: usedVars.filter(v => !invalidVars.includes(v)),
                            invalidVariables: invalidVars,
                            hasVariables: usedVars.length > 0,
                            hasInvalidVariables: invalidVars.length > 0,
                            processingReady: invalidVars.length === 0,
                            suggestions: invalidVars.map(invalid => ({
                                invalid,
                                suggestions: state.processor.getSimilarVariables(invalid)
                            }))
                        };
                    }
                };
            },

            // ===================================================================
            // CONFIGURACIÓN Y ESTADO
            // ===================================================================

            /**
             * Configurar plugin
             */
            configure: (options) => {
                const oldConfig = { ...state.config };
                state.config = { ...state.config, ...options };
                
                // Reconfigurar auto-refresh si cambió
                if (oldConfig.autoRefresh !== state.config.autoRefresh) {
                    if (state.config.autoRefresh) {
                        setupAutoRefresh(state, emit);
                    } else {
                        clearAutoRefresh(state);
                    }
                }

                // Reconfigurar procesador
                state.processor.updateConfig(state.config);

                emit('configured', { config: state.config });
                console.log('⚙️ Variables plugin configured:', state.config);
                return state.config;
            },

            /**
             * Obtener estado del plugin
             */
            getState: () => ({ 
                ...state, 
                processor: null, // No serializar processor
                version: this.version,
                initTime: state.initTime
            }),

            /**
             * Obtener estadísticas del plugin
             */
            getStats: () => ({
                providerCount: state.providers.size,
                totalVariables: Object.keys(plugin.getAvailableVariables()).length,
                cacheSize: state.cache.size,
                cacheHits: state.processor?.stats?.cacheHits || 0,
                cacheMisses: state.processor?.stats?.cacheMisses || 0,
                cacheHitRatio: state.processor?.stats ? 
                    (state.processor.stats.cacheHits / (state.processor.stats.cacheHits + state.processor.stats.cacheMisses)) || 0 : 0,
                memoryUsage: JSON.stringify(Array.from(state.providers.entries())).length,
                version: this.version,
                uptime: Date.now() - new Date(state.initTime).getTime()
            }),

            /**
             * Verificar si el plugin está saludable
             */
            isHealthy: () => {
                return state.initialized && 
                       state.providers.size > 0 && 
                       state.processor !== null;
            },

            /**
             * Limpiar estado del plugin
             */
            cleanup: async () => {
                console.log('🧹 Cleaning up Variables plugin...');
                
                try {
                    // Limpiar auto-refresh
                    clearAutoRefresh(state);
                    
                    // Cleanup providers
                    for (const [name, provider] of state.providers.entries()) {
                        if (typeof provider.cleanup === 'function') {
                            await provider.cleanup();
                        }
                    }
                    
                    state.providers.clear();
                    state.cache.clear();
                    state.initialized = false;
                    
                    emit('cleanup');
                    console.log('✅ Variables plugin cleaned up successfully');
                } catch (error) {
                    console.error('❌ Error during Variables plugin cleanup:', error);
                    emit('error', { method: 'cleanup', error });
                }
            }
        };

        // ===================================================================
        // REGISTRAR HOOKS DEL PLUGIN
        // ===================================================================

        plugin.hooks = {
            // Hook de procesamiento de código
            processCode: async (context) => {
                const { code } = context;
                
                // Si el código contiene variables, procesarlo
                if (code.includes('{{')) {
                    return plugin.processVariables(code);
                }
                
                return code;
            },

            // Hook de autocompletado
            getCompletions: async (context) => {
                return plugin.getCompletions(context.context);
            },

            // Hook de validación
            validateCode: async (context) => {
                const { code } = context;
                const invalidVars = plugin.findInvalidVariables(code);
                
                return invalidVars.map(variable => ({
                    type: 'invalid-variable',
                    message: `Variable desconocida: "{{ ${variable} }}"`,
                    severity: 'warning',
                    source: 'variables-plugin'
                }));
            }
        };

        // Marcar como inicializado
        state.initialized = true;
        emit('initialized');
        
        console.log('✅ Variables Plugin initialized successfully');
        return plugin;
    },

    // ===================================================================
    // CLEANUP DEL PLUGIN
    // ===================================================================

    async cleanup() {
        console.log('🧹 Variables Plugin cleanup');
        // El cleanup específico se maneja en la instancia del plugin
    },

    // ===================================================================
    // HOOKS GLOBALES DEL PLUGIN
    // ===================================================================

    hooks: {
        onRegister: (context) => {
            console.log('📌 Variables Plugin registered globally');
        },

        onUnregister: (context) => {
            console.log('📌 Variables Plugin unregistered globally');
        }
    }
});

// ===================================================================
// FUNCIONES AUXILIARES INTERNAS (Sin cambios significativos)
// ===================================================================

/**
 * Registrar providers por defecto
 * @private
 */
async function registerDefaultProviders(state, emit) {
    try {
        // Registrar providers core
        state.providers.set('system', SystemProvider);
        state.providers.set('user', UserProvider);
        state.providers.set('site', SiteProvider);
        state.providers.set('templates', TemplatesProvider);

        emit('defaultProvidersRegistered', { 
            providers: Array.from(state.providers.keys()) 
        });
        
        console.log('📦 Default variable providers registered');
    } catch (error) {
        emit('error', { method: 'registerDefaultProviders', error });
        throw error;
    }
}

/**
 * Configurar auto-refresh de providers
 * @private
 */
function setupAutoRefresh(state, emit) {
    if (state.refreshInterval) {
        clearInterval(state.refreshInterval);
    }

    state.refreshInterval = setInterval(async () => {
        try {
            console.log('🔄 Auto-refreshing variable providers...');
            
            for (const [name, provider] of state.providers.entries()) {
                if (typeof provider.refresh === 'function') {
                    await provider.refresh();
                }
            }
            
            // Limpiar cache
            if (state.config.cacheEnabled) {
                state.cache.clear();
            }

            emit('autoRefreshCompleted');
        } catch (error) {
            emit('error', { method: 'autoRefresh', error });
        }
    }, state.config.refreshInterval);

    console.log(`⏰ Auto-refresh configured: ${state.config.refreshInterval}ms`);
}

/**
 * Limpiar auto-refresh
 * @private
 */
function clearAutoRefresh(state) {
    if (state.refreshInterval) {
        clearInterval(state.refreshInterval);
        state.refreshInterval = null;
        console.log('⏰ Auto-refresh cleared');
    }
}

// ===================================================================
// EXPORTAR PLUGIN
// ===================================================================

export default VariablesPlugin;

// ===================================================================
// FUNCIÓN DE REGISTRO AUTOMÁTICO - 🔧 FIXED
// ===================================================================

/**
 * Registrar plugin Variables automáticamente
 * 🔧 FIXED: Maneja correctamente el re-registro
 */
export const registerVariablesPlugin = async (pluginManager) => {
    try {
        // 🔧 VERIFICAR SI YA EXISTE Y USAR REPLACE SI ES NECESARIO
        const existingPlugin = pluginManager.get('variables');
        const options = existingPlugin ? { replace: true } : {};
        
        if (existingPlugin) {
            console.log('🔄 Variables plugin already exists, replacing...');
        }

        await pluginManager.register('variables', VariablesPlugin, options);
        console.log('✅ Variables Plugin auto-registered successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to auto-register Variables Plugin:', error);
        
        // 🔧 FALLBACK: INTENTAR LIMPIAR Y RE-REGISTRAR
        if (error.message.includes('already exists')) {
            try {
                console.log('🔄 Attempting cleanup and re-registration...');
                
                // Intentar limpiar el plugin existente
                const existingPlugin = pluginManager.get('variables');
                if (existingPlugin && typeof existingPlugin.cleanup === 'function') {
                    await existingPlugin.cleanup();
                }
                
                // Remover del manager
                pluginManager.removePlugin?.('variables');
                
                // Re-intentar registro
                await pluginManager.register('variables', VariablesPlugin);
                console.log('✅ Variables Plugin registered after cleanup');
                return true;
                
            } catch (fallbackError) {
                console.error('❌ Fallback registration also failed:', fallbackError);
                return false;
            }
        }
        
        return false;
    }
};

// ===================================================================
// DEBUGGING EN DESARROLLO - 🔧 MEJORADO
// ===================================================================

if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Variables Plugin ready for registration (Fixed version)');
    
    // 🔧 FUNCIÓN DE CLEANUP MANUAL PARA DESARROLLO
    window.cleanupVariablesPlugin = async () => {
        try {
            const plugin = window.pluginManager?.get('variables');
            if (plugin && typeof plugin.cleanup === 'function') {
                await plugin.cleanup();
                console.log('✅ Variables plugin cleaned up manually');
            }
            
            window.pluginManager?.removePlugin?.('variables');
            console.log('✅ Variables plugin removed from manager');
            
        } catch (error) {
            console.error('❌ Manual cleanup failed:', error);
        }
    };
    
    // 🔧 FUNCIÓN DE RE-REGISTRO MANUAL
    window.reregisterVariablesPlugin = async () => {
        try {
            await window.cleanupVariablesPlugin();
            await registerVariablesPlugin(window.pluginManager);
            console.log('✅ Variables plugin re-registered successfully');
        } catch (error) {
            console.error('❌ Manual re-registration failed:', error);
        }
    };
    
    // Auto-registrar si pluginManager está disponible
    if (window.pluginManager && !window.pluginManager.get('variables')) {
        registerVariablesPlugin(window.pluginManager);
    }
}
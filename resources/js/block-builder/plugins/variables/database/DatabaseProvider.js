// ===================================================================
// resources/js/block-builder/plugins/variables/database/DatabaseProvider.js
// ACTUALIZADO - Con invalidación inteligente de cache
// ===================================================================

import { VariableProvider } from '../providers.js';

/**
 * Provider que se conecta a la API de Laravel para variables dinámicas
 * con sistema de cache inteligente y auto-invalidación
 */
export class DatabaseProvider extends VariableProvider {
    constructor() {
        super('database', {
            title: '💾 Base de Datos',
            description: 'Variables almacenadas en base de datos',
            category: 'core',
            priority: 90,
            refreshable: true,
            autoRefresh: true,
            refreshInterval: 30000 // 30 segundos (reducido para mayor responsividad)
        });
        
        this.apiUrl = '/api/variables';
        this.cache = new Map();
        this.lastFetch = null;
        this.loading = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        // Callbacks para notificar cambios
        this.onRefresh = null;
        this.changeListeners = [];
        
        // Setup de invalidación automática
        this.setupCacheInvalidation();
        
        console.log('💾 DatabaseProvider initialized with enhanced caching');
    }

    /**
     * Configurar sistema de invalidación automática de cache
     */
    setupCacheInvalidation() {
        // Escuchar eventos de cambios en variables
        window.addEventListener('variableChanged', (event) => {
            const { event: changeType, data } = event.detail;
            console.log(`📡 Database variable changed: ${changeType}`, data);
            this.invalidateCache();
        });
        
        // Escuchar cambios específicos que requieren refresh inmediato
        const immediateRefreshEvents = [
            'variableCreated',
            'variableUpdated', 
            'variableDeleted',
            'variableRefreshed'
        ];
        
        immediateRefreshEvents.forEach(eventType => {
            window.addEventListener(eventType, () => {
                console.log(`🔄 Immediate refresh triggered by ${eventType}`);
                this.invalidateCache();
                this.refresh(); // Refresh inmediato
            });
        });
    }

    /**
     * Cargar variables desde la API con retry automático
     */
    async getVariables() {
        try {
            // Usar cache si es reciente (menos de 30 segundos)
            if (this.lastFetch && Date.now() - this.lastFetch < 30000 && Object.keys(this._variables).length > 0) {
                console.log('💾 Using cached database variables');
                return this._variables;
            }

            if (this.loading) {
                // Si ya está cargando, esperar
                await this.waitForLoading();
                return this._variables;
            }

            return await this.fetchFromAPI();

        } catch (error) {
            console.error('❌ Error loading variables from database:', error);
            
            // En caso de error, intentar retry si es posible
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`🔄 Retrying database fetch (${this.retryCount}/${this.maxRetries})...`);
                
                // Esperar un poco antes del retry
                await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
                return this.getVariables();
            }
            
            // Si falló el retry, mantener variables en cache
            console.warn('⚠️ Using cached variables due to API failure');
            return this._variables;
        }
    }

    /**
     * Realizar la petición a la API
     */
    async fetchFromAPI() {
        this.loading = true;
        console.log('💾 Fetching fresh variables from database...');

        try {
            const response = await fetch(`${this.apiUrl}/resolved/all`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    ...this.getAuthHeaders()
                }
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // Procesar variables
            const newVariables = data.variables || {};
            
            // Verificar si hubo cambios
            const hasChanges = this.detectChanges(newVariables);
            
            // Actualizar variables
            this._variables = newVariables;
            this.lastFetch = Date.now();
            this.retryCount = 0; // Reset retry count en éxito
            
            console.log(`✅ Loaded ${Object.keys(this._variables).length} variables from database`, {
                hasChanges,
                timestamp: new Date().toLocaleTimeString()
            });
            
            // Notificar cambios si los hubo
            if (hasChanges) {
                this.notifyChanges();
            }
            
            return this._variables;

        } finally {
            this.loading = false;
        }
    }

    /**
     * Detectar si hubo cambios en las variables
     */
    detectChanges(newVariables) {
        const oldKeys = Object.keys(this._variables);
        const newKeys = Object.keys(newVariables);
        
        // Verificar si cambió el número de variables
        if (oldKeys.length !== newKeys.length) {
            return true;
        }
        
        // Verificar si cambiaron las claves
        if (!oldKeys.every(key => newKeys.includes(key))) {
            return true;
        }
        
        // Verificar si cambiaron los valores
        for (const key of newKeys) {
            if (this._variables[key] !== newVariables[key]) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Notificar sobre cambios en variables
     */
    notifyChanges() {
        // Callback específico
        if (typeof this.onRefresh === 'function') {
            try {
                this.onRefresh();
            } catch (error) {
                console.error('Error in onRefresh callback:', error);
            }
        }
        
        // Notificar a listeners
        this.changeListeners.forEach(listener => {
            try {
                listener({
                    type: 'databaseRefreshed',
                    variables: this._variables,
                    timestamp: Date.now()
                });
            } catch (error) {
                console.error('Error in change listener:', error);
            }
        });
        
        // Emitir evento global
        window.dispatchEvent(new CustomEvent('databaseVariablesRefreshed', {
            detail: {
                variables: this._variables,
                count: Object.keys(this._variables).length,
                timestamp: Date.now()
            }
        }));
    }

    /**
     * Agregar listener para cambios
     */
    addChangeListener(callback) {
        if (typeof callback === 'function') {
            this.changeListeners.push(callback);
        }
    }

    /**
     * Remover listener
     */
    removeChangeListener(callback) {
        const index = this.changeListeners.indexOf(callback);
        if (index > -1) {
            this.changeListeners.splice(index, 1);
        }
    }

    /**
     * Refresh específico para base de datos
     */
    async refresh() {
        console.log('🔄 Force refreshing database variables...');
        this.invalidateCache();
        await this.getVariables();
        await super.refresh();
    }

    /**
     * Invalidar cache forzadamente
     */
    invalidateCache() {
        console.log('🗑️ Invalidating database cache');
        this.lastFetch = null;
        this.cache.clear();
        
        // Emitir evento de invalidación
        window.dispatchEvent(new CustomEvent('databaseCacheInvalidated', {
            detail: { timestamp: Date.now() }
        }));
    }

    /**
     * Esperar a que termine la carga actual
     */
    async waitForLoading(maxWait = 5000) {
        const startTime = Date.now();
        
        while (this.loading && (Date.now() - startTime) < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (this.loading) {
            console.warn('⚠️ Timeout waiting for database loading');
        }
    }

    /**
     * Obtener headers de autenticación
     */
    getAuthHeaders() {
        const headers = {};
        
        // CSRF Token
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (token) {
            headers['X-CSRF-TOKEN'] = token;
        }
        
        // Authorization header si existe
        const authToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        return headers;
    }

    /**
     * Refrescar variable específica
     */
    async refreshVariable(id) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}/refresh`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    ...this.getAuthHeaders()
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to refresh variable');
            }

            const result = await response.json();
            
            // Actualizar cache local después del refresh
            this.invalidateCache();
            await this.refresh();

            return result;

        } catch (error) {
            console.error('❌ Error refreshing variable:', error);
            throw error;
        }
    }

    /**
     * Verificar estado del provider
     */
    getStatus() {
        return {
            loading: this.loading,
            lastFetch: this.lastFetch,
            cacheAge: this.lastFetch ? Date.now() - this.lastFetch : null,
            variableCount: Object.keys(this._variables).length,
            retryCount: this.retryCount,
            hasCache: this.lastFetch !== null
        };
    }

    /**
     * Cleanup del provider
     */
    async cleanup() {
        console.log('🧹 Cleaning up DatabaseProvider...');
        
        // Limpiar timers
        this.stopAutoRefresh();
        
        // Limpiar listeners
        this.changeListeners = [];
        this.onRefresh = null;
        
        // Limpiar cache
        this.cache.clear();
        this._variables = {};
        this.lastFetch = null;
        
        await super.cleanup();
    }
}

// Instancia singleton del provider
export const DatabaseProviderInstance = new DatabaseProvider();

// Export para usar en el plugin
export default DatabaseProviderInstance;

// ===================================================================
// FUNCIONES DE UTILIDAD PARA DEBUG
// ===================================================================

if (process.env.NODE_ENV === 'development') {
    // Exponer provider para debugging
    window.debugDatabaseProvider = {
        getStatus: () => DatabaseProviderInstance.getStatus(),
        
        async forceRefresh() {
            await DatabaseProviderInstance.refresh();
            console.log('✅ Database provider force refreshed');
        },
        
        invalidateCache() {
            DatabaseProviderInstance.invalidateCache();
            console.log('🗑️ Database cache invalidated');
        },
        
        showVariables() {
            console.table(DatabaseProviderInstance._variables);
        },
        
        async testConnection() {
            try {
                await DatabaseProviderInstance.fetchFromAPI();
                console.log('✅ Database connection test successful');
            } catch (error) {
                console.error('❌ Database connection test failed:', error);
            }
        },
        
        addTestListener() {
            DatabaseProviderInstance.addChangeListener((event) => {
                console.log('🔔 Database change detected:', event);
            });
            console.log('👂 Test listener added');
        }
    };
    
    console.log('🔧 Database provider debug tools available at window.debugDatabaseProvider');
}
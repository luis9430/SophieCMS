// resources/js/block-builder/plugins/variables/database/DatabaseProvider.js

import { VariableProvider } from '../providers.js';

/**
 * Provider que se conecta a la API de Laravel para variables dinámicas
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
            refreshInterval: 60000 // 1 minuto
        });
        
        this.apiUrl = '/api/variables';
        this.cache = new Map();
        this.lastFetch = null;
        this.loading = false;
    }

    /**
     * Cargar variables desde la API
     */
    async getVariables() {
        try {
            // Usar cache si es reciente (menos de 1 minuto)
            if (this.lastFetch && Date.now() - this.lastFetch < 60000) {
                return this._variables;
            }

            if (this.loading) {
                // Si ya está cargando, esperar
                await this.waitForLoading();
                return this._variables;
            }

            this.loading = true;
            console.log('💾 Fetching variables from database...');

            const response = await fetch(`${this.apiUrl}/resolved/all`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    // Agregar auth header si es necesario
                    ...(this.getAuthHeaders())
                }
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            this._variables = data.variables || {};
            this.lastFetch = Date.now();

            console.log(`✅ Loaded ${Object.keys(this._variables).length} variables from database`);
            
            return this._variables;

        } catch (error) {
            console.error('❌ Error loading variables from database:', error);
            // Mantener variables en cache en caso de error
            return this._variables;
        } finally {
            this.loading = false;
        }
    }

    /**
     * Refresh específico para base de datos
     */
    async refresh() {
        this.lastFetch = null; // Forzar nueva carga
        await this.getVariables();
        await super.refresh();
    }

    /**
     * Obtener headers de autenticación
     */
    getAuthHeaders() {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        return token ? { 'X-CSRF-TOKEN': token } : {};
    }

    /**
     * Esperar a que termine la carga actual
     */
    async waitForLoading() {
        while (this.loading) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    /**
     * Crear nueva variable en la base de datos
     */
    async createVariable(data) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create variable');
            }

            const result = await response.json();
            
            // Actualizar cache local
            this.lastFetch = null; // Forzar refresh
            await this.refresh();

            return result;

        } catch (error) {
            console.error('❌ Error creating variable:', error);
            throw error;
        }
    }

    hasVariable(key) {
    return this._variables && this._variables.hasOwnProperty(key);
        }

        /**
         * Obtener valor de una variable específica
         */
        getVariable(key) {
            return this._variables ? this._variables[key] : null;
        }

    /**
     * Actualizar variable existente
     */
    async updateVariable(id, data) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update variable');
            }

            const result = await response.json();
            
            // Actualizar cache local
            this.lastFetch = null; // Forzar refresh
            await this.refresh();

            return result;

        } catch (error) {
            console.error('❌ Error updating variable:', error);
            throw error;
        }
    }

    /**
     * Eliminar variable
     */
    async deleteVariable(id) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    ...this.getAuthHeaders()
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete variable');
            }

            // Actualizar cache local
            this.lastFetch = null; // Forzar refresh
            await this.refresh();

            return true;

        } catch (error) {
            console.error('❌ Error deleting variable:', error);
            throw error;
        }
    }

    /**
     * Obtener información detallada de una variable
     */
    async getVariableDetails(id) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                headers: {
                    'Accept': 'application/json',
                    ...this.getAuthHeaders()
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get variable details: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error('❌ Error getting variable details:', error);
            throw error;
        }
    }

    /**
     * Obtener todas las variables con metadata (para interfaz admin)
     */
    async getAllVariables(options = {}) {
        try {
            const params = new URLSearchParams();
            
            if (options.category) params.append('category', options.category);
            if (options.type) params.append('type', options.type);
            if (options.search) params.append('search', options.search);
            if (options.sort_by) params.append('sort_by', options.sort_by);
            if (options.sort_direction) params.append('sort_direction', options.sort_direction);

            const url = params.toString() ? `${this.apiUrl}?${params}` : this.apiUrl;

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    ...this.getAuthHeaders()
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get variables: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error('❌ Error getting all variables:', error);
            throw error;
        }
    }

    /**
     * Obtener categorías disponibles
     */
    async getCategories() {
        try {
            const response = await fetch(`${this.apiUrl}/categories/list`, {
                headers: {
                    'Accept': 'application/json',
                    ...this.getAuthHeaders()
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get categories: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error('❌ Error getting categories:', error);
            throw error;
        }
    }

    /**
     * Probar configuración de variable
     */
    async testVariable(data) {
        try {
            const response = await fetch(`${this.apiUrl}/test`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Test failed');
            }

            return result;

        } catch (error) {
            console.error('❌ Error testing variable:', error);
            throw error;
        }
    }

    /**
     * Refresh manual de una variable específica
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
            this.lastFetch = null;
            await this.refresh();

            return result;

        } catch (error) {
            console.error('❌ Error refreshing variable:', error);
            throw error;
        }
    }
}

// Instancia singleton del provider
export const DatabaseProviderInstance = new DatabaseProvider();

// Export para usar en el plugin
export default DatabaseProviderInstance;
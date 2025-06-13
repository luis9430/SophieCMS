// resources/js/block-builder/plugins/variables/api/VariableAPI.js

/**
 * API wrapper para manejar todas las operaciones con variables
 */
export class VariableAPI {
    constructor(baseUrl = '/api/variables') {
        this.baseUrl = baseUrl;
        this.defaultHeaders = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
    }

    /**
     * Obtener headers con autenticación
     */
    getHeaders(additionalHeaders = {}) {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        const authToken = localStorage.getItem('auth_token');
        
        return {
            ...this.defaultHeaders,
            ...(token && { 'X-CSRF-TOKEN': token }),
            ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
            ...additionalHeaders
        };
    }

    /**
     * Realizar petición HTTP
     */
    async request(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: this.getHeaders(options.headers)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            return data;

        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // ===================================================================
    // CRUD OPERATIONS
    // ===================================================================

    /**
     * Obtener todas las variables
     */
    async getAll(filters = {}) {
        const params = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                params.append(key, value);
            }
        });

        const url = params.toString() 
            ? `${this.baseUrl}?${params}` 
            : this.baseUrl;

        return this.request(url);
    }

    /**
     * Obtener variable por ID
     */
    async getById(id) {
        return this.request(`${this.baseUrl}/${id}`);
    }

    /**
     * Crear nueva variable
     */
    async create(data) {
        return this.request(this.baseUrl, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Actualizar variable existente
     */
    async update(id, data) {
        return this.request(`${this.baseUrl}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Eliminar variable
     */
    async delete(id) {
        return this.request(`${this.baseUrl}/${id}`, {
            method: 'DELETE'
        });
    }

    // ===================================================================
    // SPECIAL OPERATIONS
    // ===================================================================

    /**
     * Obtener todas las variables resueltas
     */
    async getResolved() {
        return this.request(`${this.baseUrl}/resolved/all`);
    }

    /**
     * Resolver variable específica por key
     */
    async resolve(key) {
        return this.request(`${this.baseUrl}/resolve/${encodeURIComponent(key)}`);
    }

    /**
     * Obtener categorías disponibles
     */
    async getCategories() {
        return this.request(`${this.baseUrl}/categories/list`);
    }

    /**
     * Probar configuración de variable
     */
    async test(data) {
        return this.request(`${this.baseUrl}/test`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Refresh manual de variable
     */
    async refresh(id) {
        return this.request(`${this.baseUrl}/${id}/refresh`, {
            method: 'POST'
        });
    }

    // ===================================================================
    // BULK OPERATIONS
    // ===================================================================

    /**
     * Crear múltiples variables
     */
    async createMultiple(variables) {
        const promises = variables.map(variable => this.create(variable));
        return Promise.allSettled(promises);
    }

    /**
     * Actualizar múltiples variables
     */
    async updateMultiple(updates) {
        const promises = updates.map(({ id, data }) => this.update(id, data));
        return Promise.allSettled(promises);
    }

    /**
     * Eliminar múltiples variables
     */
    async deleteMultiple(ids) {
        const promises = ids.map(id => this.delete(id));
        return Promise.allSettled(promises);
    }

    /**
     * Refresh múltiples variables
     */
    async refreshMultiple(ids) {
        const promises = ids.map(id => this.refresh(id));
        return Promise.allSettled(promises);
    }

    // ===================================================================
    // UTILITY METHODS
    // ===================================================================

    /**
     * Validar key de variable
     */
    validateKey(key) {
        const keyRegex = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)*$/;
        return keyRegex.test(key);
    }

    /**
     * Validar configuración según tipo
     */
    validateConfig(type, config) {
        switch (type) {
            case 'static':
                return true; // Static no necesita config especial

            case 'dynamic':
                return config.query || (config.model && config.method);

            case 'external':
                return config.url && config.method;

            case 'computed':
                return config.class && config.method;

            default:
                return false;
        }
    }

    /**
     * Formatear variable para display
     */
    formatVariable(variable) {
        return {
            ...variable,
            formatted_value: this.formatValue(variable.value),
            status: this.getVariableStatus(variable),
            category_info: this.getCategoryInfo(variable.category)
        };
    }

    /**
     * Formatear valor para mostrar
     */
    formatValue(value) {
        if (value === null || value === undefined) {
            return 'null';
        }

        if (typeof value === 'object') {
            return JSON.stringify(value, null, 2);
        }

        if (typeof value === 'string' && value.length > 100) {
            return value.substring(0, 97) + '...';
        }

        return String(value);
    }

    /**
     * Obtener status de variable
     */
    getVariableStatus(variable) {
        if (!variable.is_active) {
            return { status: 'inactive', color: 'gray', label: 'Inactiva' };
        }

        if (variable.last_error) {
            return { status: 'error', color: 'red', label: 'Error' };
        }

        if (variable.is_expired) {
            return { status: 'expired', color: 'yellow', label: 'Expirada' };
        }

        return { status: 'active', color: 'green', label: 'Activa' };
    }

    /**
     * Obtener información de categoría
     */
    getCategoryInfo(category) {
        const categories = {
            'site': { name: 'Sitio Web', color: '#3B82F6', icon: '🌐' },
            'contact': { name: 'Contacto', color: '#10B981', icon: '📧' },
            'social': { name: 'Redes Sociales', color: '#8B5CF6', icon: '📱' },
            'stats': { name: 'Estadísticas', color: '#F59E0B', icon: '📊' },
            'content': { name: 'Contenido', color: '#EF4444', icon: '📝' },
            'external': { name: 'APIs Externas', color: '#6B7280', icon: '🌍' },
            'system': { name: 'Sistema', color: '#374151', icon: '⚙️' },
            'custom': { name: 'Personalizado', color: '#EC4899', icon: '🎨' }
        };

        return categories[category] || categories.custom;
    }

    // ===================================================================
    // SEARCH AND FILTER
    // ===================================================================

    /**
     * Buscar variables
     */
    async search(query, filters = {}) {
        return this.getAll({
            search: query,
            ...filters
        });
    }

    /**
     * Filtrar por categoría
     */
    async getByCategory(category) {
        return this.getAll({ category });
    }

    /**
     * Filtrar por tipo
     */
    async getByType(type) {
        return this.getAll({ type });
    }

    /**
     * Obtener variables que necesitan refresh
     */
    async getExpired() {
        // Esto requeriría un endpoint específico en el backend
        const variables = await this.getAll();
        return variables.filter(v => v.is_expired);
    }
}

// Instancia singleton
export const variableAPI = new VariableAPI();

// Export default
export default variableAPI;
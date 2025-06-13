// ===================================================================
// resources/js/block-builder/services/templatesApi.js
// Servicio para conectar frontend con backend Laravel
// ===================================================================

class TemplatesApiService {
    constructor() {
        this.baseUrl = '/api';
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };
        
        // Cache simple para templates (opcional)
        this._cache = new Map();
        this._cacheTimeout = 5 * 60 * 1000; // 5 minutos
    }

    // ===================================================================
    // MÉTODOS PRIVADOS - UTILIDADES
    // ===================================================================

    async _makeRequest(endpoint, options = {}) {
        const defaultOptions = {
            headers: this.headers,
            credentials: 'same-origin',
        };

        // Agregar CSRF token si está disponible
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
            defaultOptions.headers['X-CSRF-TOKEN'] = csrfToken;
        }

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...defaultOptions,
                ...options,
                headers: { ...defaultOptions.headers, ...(options.headers || {}) }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('❌ API Request failed:', error);
            throw error;
        }
    }

    // ===================================================================
    // API TEMPLATES - CRUD OPERATIONS
    // ===================================================================

    /**
     * Obtener todas las plantillas del usuario
     */
    async getTemplates(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/templates${queryString ? '?' + queryString : ''}`;
        
        return await this._makeRequest(endpoint, {
            method: 'GET'
        });
    }

    /**
     * Obtener un template específico por ID (con contenido completo)
     */
    async getTemplate(templateId) {
        return await this._makeRequest(`/templates/${templateId}`, {
            method: 'GET'
        });
    }

    /**
     * Crear nueva plantilla
     */
    async createTemplate(templateData) {
        return await this._makeRequest('/templates', {
            method: 'POST',
            body: JSON.stringify(templateData)
        });
    }

    /**
     * Eliminar plantilla
     */
    async deleteTemplate(templateId) {
        return await this._makeRequest(`/templates/${templateId}`, {
            method: 'DELETE'
        });
    }

    // ===================================================================
    // PAGE BUILDER API - BLOCK TEMPLATES
    // ===================================================================

    /**
     * Obtener plantilla de bloque específico
     */
    async getBlockTemplate(type, config = {}, styles = {}) {
        return await this._makeRequest('/admin/page-builder/block-template', {
            method: 'GET',
            body: JSON.stringify({ type, config, styles })
        });
    }

    /**
     * Previsualizar plantilla de bloque
     */
    async previewBlockTemplate(template, config = {}, styles = {}) {
        return await this._makeRequest('/admin/page-builder/preview-template', {
            method: 'POST',
            body: JSON.stringify({ template, config, styles })
        });
    }

    /**
     * Actualizar configuración de bloque desde plantilla
     */
    async updateBlockTemplate(id, type, template) {
        return await this._makeRequest('/admin/page-builder/update-template', {
            method: 'POST',
            body: JSON.stringify({ id, type, template })
        });
    }

    /**
     * Guardar página completa
     */
    async savePage(blocks, pageId = null) {
        return await this._makeRequest('/admin/page-builder/save', {
            method: 'POST',
            body: JSON.stringify({ blocks, page_id: pageId })
        });
    }

    /**
     * Preview de página/bloque
     */
    async previewPage(blocks) {
        return await this._makeRequest('/admin/page-builder/preview', {
            method: 'POST',
            body: JSON.stringify({ blocks })
        });
    }

    // ===================================================================
    // UTILIDADES DE ALTO NIVEL
    // ===================================================================

    /**
     * Buscar plantillas por nombre
     */
    async searchTemplates(query, type = null) {
        const params = { search: query };
        if (type) params.type = type;
        
        return await this.getTemplates(params);
    }

    /**
     * Obtener estadísticas de plantillas
     */
    async getStats() {
        try {
            // Usar endpoint específico si existe, o calcular desde templates
            return await this._makeRequest('/stats', { method: 'GET' });
        } catch (error) {
            // Fallback: calcular stats desde templates
            const templates = await this.getTemplates();
            return {
                total_templates: templates.data?.length || 0,
                user_templates: templates.data?.length || 0,
            };
        }
    }

    // ===================================================================
    // MANEJO DE ERRORES Y VALIDACIÓN
    // ===================================================================

    /**
     * Validar datos de plantilla antes de enviar
     */
    validateTemplateData(data) {
        const errors = [];

        if (!data.name || data.name.trim().length === 0) {
            errors.push('El nombre de la plantilla es requerido');
        }

        if (!data.code || data.code.trim().length === 0) {
            errors.push('El código de la plantilla es requerido');
        }

        if (!data.type || !['html', 'css', 'js'].includes(data.type)) {
            errors.push('El tipo de plantilla debe ser: html, css o js');
        }

        if (data.name && data.name.length > 255) {
            errors.push('El nombre no puede exceder 255 caracteres');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // ===================================================================
    // CACHE SIMPLE (OPCIONAL)
    // ===================================================================

    /**
     * Limpiar cache de templates
     */
    clearCache() {
        this._cache.clear();
    }

    /**
     * Obtener templates con cache
     */
    async getTemplatesCached(params = {}) {
        const cacheKey = JSON.stringify(params);
        const cached = this._cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp < this._cacheTimeout)) {
            return cached.data;
        }

        const data = await this.getTemplates(params);
        this._cache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });

        return data;
    }
}

// ===================================================================
// INSTANCIA SINGLETON
// ===================================================================

let templatesApi = new TemplatesApiService();

// ===================================================================
// INTEGRACIÓN CON SISTEMA DE PLUGINS
// ===================================================================

// Hacer disponible globalmente para plugins
if (typeof(window) !== 'undefined') {
    window.templatesApi = templatesApi;
    
    // Evento para notificar que la API está lista
    window.dispatchEvent(new CustomEvent('templatesApiReady', {
        detail: { api: templatesApi }
    }));
}

export default templatesApi;
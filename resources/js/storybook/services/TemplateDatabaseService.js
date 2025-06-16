// resources/js/storybook/services/TemplateDatabaseService.js
// 🗄️ Servicio para manejar templates con tu base de datos Laravel

class TemplateDatabaseService {
  constructor() {
    // ✅ URL BASE CORRECTA PARA LARAVEL
    this.baseUrl = 'http://127.0.0.1:8000';
    this.apiPrefix = '/api/templates';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // ===================================================================
  // MÉTODOS PARA CARGAR TEMPLATES
  // ===================================================================

  /**
   * Obtener template por ID
   */
  async getTemplate(templateId) {
    const cacheKey = `template_${templateId}`;
    
    // Verificar cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const response = await this._makeRequest(`${this.apiPrefix}/${templateId}`);
      const template = response.data;
      
      // Guardar en cache
      this.cache.set(cacheKey, {
        data: template,
        timestamp: Date.now()
      });
      
      return template;
    } catch (error) {
      console.error(`Error loading template ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Obtener templates por tipo
   */
  async getTemplatesByType(type, options = {}) {
    const { category = null, limit = null } = options;
    let url = `${this.apiPrefix}/type/${type}`;
    
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (limit) params.append('limit', limit);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    try {
      const response = await this._makeRequest(url);
      return response.data;
    } catch (error) {
      console.error(`Error loading templates by type ${type}:`, error);
      throw error;
    }
  }

  /**
   * Obtener templates por categoría
   */
  async getTemplatesByCategory(category) {
    try {
      const response = await this._makeRequest(`${this.apiPrefix}?category=${category}`);
      return response.data;
    } catch (error) {
      console.error(`Error loading templates by category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Buscar templates
   */
  async searchTemplates(query, filters = {}) {
    const params = new URLSearchParams({ search: query });
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    try {
      const response = await this._makeRequest(`${this.apiPrefix}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error(`Error searching templates:`, error);
      throw error;
    }
  }

  // ===================================================================
  // MÉTODOS PARA GUARDAR TEMPLATES
  // ===================================================================

  /**
   * Crear nuevo template desde Storybook
   */
  async createTemplate(templateData) {
    const payload = {
      name: templateData.name,
      type: templateData.type || 'component',
      category: templateData.category || 'storybook',
      content: templateData.content,
      description: templateData.description || '',
      variables: templateData.variables || {},
      
      // Metadata específica para componentes de Storybook
      method_config: {
        storybook: true,
        story_name: templateData.storyName,
        story_args: templateData.storyArgs,
        created_from_storybook: true,
        storybook_version: '9.0.10'
      }
    };

    try {
      const response = await this._makeRequest(this.apiPrefix, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      // Limpiar cache
      this._clearCache();
      
      return response.data;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  /**
   * Actualizar template existente
   */
  async updateTemplate(templateId, templateData) {
    try {
      const response = await this._makeRequest(`${this.apiPrefix}/${templateId}`, {
        method: 'PUT',
        body: JSON.stringify(templateData)
      });
      
      // Limpiar cache
      this._clearCache();
      
      return response.data;
    } catch (error) {
      console.error(`Error updating template ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Eliminar template
   */
  async deleteTemplate(templateId) {
    try {
      const response = await this._makeRequest(`${this.apiPrefix}/${templateId}`, {
        method: 'DELETE'
      });
      
      // Limpiar cache
      this._clearCache();
      
      return response.success;
    } catch (error) {
      console.error(`Error deleting template ${templateId}:`, error);
      throw error;
    }
  }

  // ===================================================================
  // MÉTODOS PARA RENDERIZAR
  // ===================================================================

  /**
   * Renderizar template usando tu PageBuilderController
   */
  async renderTemplate(template, context = {}) {
    // En modo Storybook, usar renderizado simplificado
    if (process.env.STORYBOOK_MODE === 'true') {
      return this._mockRender(template, context);
    }

    try {
      const response = await this._makeRequest('/admin/page-builder/preview', {
        method: 'POST',
        body: JSON.stringify({
          template: template.content,
          variables: context.variables || {},
          config: context.config || {},
          type: template.type,
          method_config: template.method_config
        })
      });
      
      return response.html;
    } catch (error) {
      console.error('Error rendering template:', error);
      // Fallback a renderizado mock
      return this._mockRender(template, context);
    }
  }

  /**
   * Previsualizar template antes de guardar
   */
  async previewTemplate(templateContent, context = {}) {
    try {
      const response = await this._makeRequest('/admin/page-builder/preview-template', {
        method: 'POST',
        body: JSON.stringify({
          template: templateContent,
          config: context.config || {},
          styles: context.styles || {},
          variables: context.variables || {}
        })
      });
      
      return response.html;
    } catch (error) {
      console.error('Error previewing template:', error);
      throw error;
    }
  }

  // ===================================================================
  // MÉTODOS PARA METADATOS
  // ===================================================================

  /**
   * Obtener tipos disponibles
   */
  async getAvailableTypes() {
    try {
      const response = await this._makeRequest(`${this.apiPrefix}/metadata`);
      return response.types || {};
    } catch (error) {
      console.error('Error loading types:', error);
      return {};
    }
  }

  /**
   * Obtener categorías disponibles
   */
  async getAvailableCategories() {
    try {
      const response = await this._makeRequest(`${this.apiPrefix}/metadata`);
      return response.categories || {};
    } catch (error) {
      console.error('Error loading categories:', error);
      return {};
    }
  }

  // ===================================================================
  // MÉTODOS PRIVADOS
  // ===================================================================

  async _makeRequest(url, options = {}) {
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': this._getCSRFToken()
      }
    };

    const finalOptions = { ...defaultOptions, ...options };
    
    // ✅ Si la URL ya incluye baseUrl, no la agregues
    const finalUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    
    const response = await fetch(finalUrl, finalOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  _getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  }

  _mockRender(template, context) {
    let content = template.content || '';
    
    // Procesar variables {{ variable }}
    Object.entries(context.variables || {}).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      content = content.replace(regex, value);
    });

    // Procesar configuración {{ config.property }}
    Object.entries(context.config || {}).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*config\\.${key}\\s*}}`, 'g');
      content = content.replace(regex, value);
    });

    // Procesar variables anidadas {{ object.property }}
    const flattenObject = (obj, prefix = '') => {
      const flattened = {};
      Object.entries(obj).forEach(([key, value]) => {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          Object.assign(flattened, flattenObject(value, newKey));
        } else {
          flattened[newKey] = value;
        }
      });
      return flattened;
    };

    const allVariables = {
      ...flattenObject(context.variables || {}),
      ...flattenObject(context.config || {}, 'config')
    };

    Object.entries(allVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      content = content.replace(regex, value);
    });

    return content;
  }

  _clearCache() {
    this.cache.clear();
  }
}

// Crear instancia singleton
export default new TemplateDatabaseService();
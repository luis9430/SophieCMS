// ===================================================================
// resources/js/block-builder/plugins/templates/index.js
// ACTUALIZADO - Plugin de Templates con Integración Backend
// ===================================================================

import templatesApi from '../../services/templatesApi.js';

const templatesPlugin = {
    name: 'templates',
    version: '2.0.0',
    dependencies: [], 
    previewPriority: 85,
    
    // ===================================================================
    // INICIALIZACIÓN
    // ===================================================================
    
    async init(context) {
        console.log('📄 Initializing Integrated Templates Plugin v2.0.0...');
        
        try {
            // 1. Inicializar Liquid.js para templates frontend
            await this._initLiquidEngine();
            
            // 2. Configurar integración con backend
            await this._initBackendIntegration();
            
            // 3. Registrar filtros y funciones personalizadas
            this._registerCustomFilters();
            this._registerCustomTags();
            
            // 4. Cargar templates desde backend
            await this._loadBackendTemplates();
            
            // 5. Configurar cache y optimizaciones
            this._setupCaching();
            
            console.log('✅ Integrated Templates Plugin initialized successfully');
            return this;
            
        } catch (error) {
            console.error('❌ Error initializing Templates Plugin:', error);
            throw error;
        }
    },

    // ===================================================================
    // INICIALIZACIÓN INTERNA
    // ===================================================================

    async _initLiquidEngine() {
        // Cargar Liquid.js dinámicamente
        if (!window.Liquid) {
            try {
                // Si no está disponible globalmente, usar import dinámico
                const { Liquid } = await import('liquidjs');
                window.Liquid = Liquid;
            } catch (error) {
                console.warn('⚠️ Liquid.js not available, using fallback template engine');
            }
        }

        if (window.Liquid) {
            this.liquid = new window.Liquid({
                cache: true,
                root: '/',
                extname: '.liquid',
                strictFilters: false,
                strictVariables: false,
                trimTagLeft: false,
                trimTagRight: false,
                trimOutputLeft: false,
                trimOutputRight: false
            });
        }
    },

    async _initBackendIntegration() {
        // Esperar a que la API esté disponible
        if (!window.templatesApi) {
            await new Promise((resolve) => {
                window.addEventListener('templatesApiReady', resolve, { once: true });
                // Timeout fallback
                setTimeout(resolve, 2000);
            });
        }

        this.api = window.templatesApi || templatesApi;
        this.backendAvailable = !!this.api;
        
        console.log(this.backendAvailable ? '✅ Backend integration ready' : '⚠️ Backend not available, using frontend-only mode');
    },

    async _loadBackendTemplates() {
        if (!this.backendAvailable) return;

        try {
            const response = await this.api.getTemplates({ per_page: 100 });
            const templates = response.data || response.templates || [];
            
            this.backendTemplates = new Map();
            templates.forEach(template => {
                this.backendTemplates.set(template.name || template.id, template);
            });
            
            console.log(`📄 Loaded ${this.backendTemplates.size} templates from backend`);
            
        } catch (error) {
            console.error('❌ Failed to load backend templates:', error);
            this.backendTemplates = new Map();
        }
    },

    _setupCaching() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
        
        // Limpiar cache periódicamente
        setInterval(() => {
            const now = Date.now();
            for (const [key, entry] of this.cache.entries()) {
                if (now - entry.timestamp > this.cacheTimeout) {
                    this.cache.delete(key);
                }
            }
        }, 60000); // Cada minuto
    },

    // ===================================================================
    // API PÚBLICA - RENDERIZADO HÍBRIDO
    // ===================================================================
    
    /**
     * Renderizar template con detección automática de engine
     */
    async renderTemplate(templateContent, data = {}) {
        try {
            // Detectar tipo de template
            const templateType = this._detectTemplateType(templateContent);
            
            switch (templateType) {
                case 'blade':
                    return await this._renderBladeTemplate(templateContent, data);
                case 'liquid':
                    return await this._renderLiquidTemplate(templateContent, data);
                case 'mixed':
                    return await this._renderMixedTemplate(templateContent, data);
                default:
                    return await this._renderPlainTemplate(templateContent, data);
            }
            
        } catch (error) {
            console.error('❌ Template rendering failed:', error);
            return this._renderErrorTemplate(error, templateContent);
        }
    },

    /**
     * Renderizar template por nombre (backend o cache local)
     */
    async renderByName(templateName, data = {}) {
        // 1. Buscar en backend primero
        if (this.backendAvailable && this.backendTemplates.has(templateName)) {
            const template = this.backendTemplates.get(templateName);
            return await this.renderTemplate(template.code || template.content, data);
        }
        
        // 2. Buscar en cache local
        if (this.localTemplates && this.localTemplates.has(templateName)) {
            const template = this.localTemplates.get(templateName);
            return await this.renderTemplate(template.content, data);
        }
        
        throw new Error(`Template "${templateName}" not found`);
    },

    // ===================================================================
    // RENDERIZADO POR TIPO DE TEMPLATE
    // ===================================================================

    async _renderBladeTemplate(templateContent, data) {
        if (!this.backendAvailable) {
            console.warn('⚠️ Blade template detected but backend not available');
            return this._renderBladeClientSide(templateContent, data);
        }

        // Cache key
        const cacheKey = `blade_${btoa(templateContent).substring(0, 32)}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
            return cached.result;
        }

        try {
            const response = await this.api.previewBlockTemplate(templateContent, data, {});
            const result = response.html || response.rendered || templateContent;
            
            // Guardar en cache
            this.cache.set(cacheKey, {
                result,
                timestamp: Date.now()
            });
            
            return result;
            
        } catch (error) {
            console.error('❌ Backend Blade rendering failed:', error);
            return this._renderBladeClientSide(templateContent, data);
        }
    },

    async _renderLiquidTemplate(templateContent, data) {
        if (!this.liquid) {
            console.warn('⚠️ Liquid.js not available, using basic variable replacement');
            return this._renderBasicVariables(templateContent, data);
        }

        try {
            const template = this.liquid.parse(templateContent);
            return await this.liquid.render(template, data);
            
        } catch (error) {
            console.error('❌ Liquid rendering failed:', error);
            return this._renderBasicVariables(templateContent, data);
        }
    },

    async _renderMixedTemplate(templateContent, data) {
        // 1. Primero procesar Blade (backend)
        let processed = await this._renderBladeTemplate(templateContent, data);
        
        // 2. Luego procesar Liquid en el resultado
        processed = await this._renderLiquidTemplate(processed, data);
        
        return processed;
    },

    async _renderPlainTemplate(templateContent, data) {
        // Solo reemplazar variables básicas
        return this._renderBasicVariables(templateContent, data);
    },

    // ===================================================================
    // DETECCIÓN DE TIPO DE TEMPLATE
    // ===================================================================

    _detectTemplateType(content) {
        const hasBladeVariables = /\{\{\s*\$\w+.*?\}\}/g.test(content);
        const hasBladeDirectives = /@\w+/g.test(content);
        const hasLiquidTags = /\{\%.*?\%\}/g.test(content);
        const hasLiquidVariables = /\{\{\s*\w+[\.\w]*\s*\}\}/g.test(content) && !hasBladeVariables;
        
        if ((hasBladeVariables || hasBladeDirectives) && (hasLiquidTags || hasLiquidVariables)) {
            return 'mixed';
        } else if (hasBladeVariables || hasBladeDirectives) {
            return 'blade';
        } else if (hasLiquidTags || hasLiquidVariables) {
            return 'liquid';
        } else {
            return 'plain';
        }
    },

    // ===================================================================
    // RENDERIZADO FALLBACK
    // ===================================================================

    _renderBladeClientSide(templateContent, data) {
        // Simulación básica de Blade en el cliente
        let processed = templateContent;
        
        // Procesar {{ $config['key'] ?? 'default' }}
        processed = processed.replace(/\{\{\s*\$config\[['"](\w+)['"]\]\s*\?\?\s*['"]([^'"]*)['"]\s*\}\}/g, 
            (match, key, defaultValue) => {
                return data[key] !== undefined ? data[key] : defaultValue;
            }
        );
        
        // Procesar {{ $config['key'] }}
        processed = processed.replace(/\{\{\s*\$config\[['"](\w+)['"]\]\s*\}\}/g, 
            (match, key) => {
                return data[key] !== undefined ? data[key] : '';
            }
        );
        
        return processed;
    },

    _renderBasicVariables(templateContent, data) {
        let processed = templateContent;
        
        // Procesar variables simples {{ variable }}
        Object.entries(data).forEach(([key, value]) => {
            const regex = new RegExp(`\\{\\{\\s*${key.replace('.', '\\.')}\\s*\\}\\}`, 'g');
            processed = processed.replace(regex, String(value || ''));
        });
        
        // Procesar variables anidadas {{ object.property }}
        const flattenData = this._flattenObject(data);
        Object.entries(flattenData).forEach(([key, value]) => {
            const regex = new RegExp(`\\{\\{\\s*${key.replace(/\./g, '\\.')}\\s*\\}\\}`, 'g');
            processed = processed.replace(regex, String(value || ''));
        });
        
        return processed;
    },

    _renderErrorTemplate(error, originalContent) {
        return `
            <div class="template-error" style="
                background: #fef2f2;
                border: 1px solid #fecaca;
                color: #dc2626;
                padding: 1rem;
                border-radius: 0.5rem;
                margin: 1rem 0;
                font-family: monospace;
            ">
                <strong>Template Error:</strong> ${error.message}
                <details style="margin-top: 0.5rem;">
                    <summary>Original Template</summary>
                    <pre style="background: #f3f4f6; padding: 0.5rem; margin-top: 0.5rem; border-radius: 0.25rem; overflow-x: auto;">${originalContent}</pre>
                </details>
            </div>
        `;
    },

    // ===================================================================
    // GESTIÓN DE TEMPLATES
    // ===================================================================

    async saveTemplate(name, content, metadata = {}) {
        if (!this.backendAvailable) {
            // Guardar solo localmente
            if (!this.localTemplates) {
                this.localTemplates = new Map();
            }
            
            this.localTemplates.set(name, {
                name,
                content,
                metadata: {
                    ...metadata,
                    createdAt: new Date().toISOString(),
                    type: this._detectTemplateType(content)
                }
            });
            
            return { success: true, local: true };
        }

        try {
            // Detectar tipo automáticamente
            const templateType = this._detectTemplateType(content);
            
            const response = await this.api.createTemplate({
                name,
                code: content,
                type: templateType === 'blade' ? 'html' : templateType,
                ...metadata
            });

            // Actualizar cache local
            await this._loadBackendTemplates();
            
            return response;
            
        } catch (error) {
            console.error('❌ Failed to save template:', error);
            throw error;
        }
    },

    async listTemplates() {
        const templates = [];
        
        // Templates del backend
        if (this.backendAvailable && this.backendTemplates) {
            this.backendTemplates.forEach(template => {
                templates.push({
                    ...template,
                    source: 'backend'
                });
            });
        }
        
        // Templates locales
        if (this.localTemplates) {
            this.localTemplates.forEach(template => {
                templates.push({
                    ...template,
                    source: 'local'
                });
            });
        }
        
        return templates;
    },

    // ===================================================================
    // FILTROS Y TAGS PERSONALIZADOS
    // ===================================================================

    _registerCustomFilters() {
        if (!this.liquid) return;

        // Filtro para formatear fechas
        this.liquid.registerFilter('date_format', (date, format = 'dd/mm/yyyy') => {
            const d = new Date(date);
            if (isNaN(d.getTime())) return date;
            
            return d.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        });

        // Filtro para truncar texto
        this.liquid.registerFilter('truncate', (text, length = 100) => {
            if (!text || text.length <= length) return text;
            return text.substring(0, length) + '...';
        });

        // Filtro para capitalizar
        this.liquid.registerFilter('capitalize', (text) => {
            if (!text) return text;
            return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
        });
    },

    _registerCustomTags() {
        if (!this.liquid) return;

        // Tag personalizado para incluir templates
        this.liquid.registerTag('include_template', {
            parse: function(tagToken) {
                this.templateName = tagToken.args;
            },
            render: async function(context) {
                const templateName = await this.liquid.evalValue(this.templateName, context);
                try {
                    return await templatesPlugin.renderByName(templateName, context.getAll());
                } catch (error) {
                    return `<!-- Template "${templateName}" not found -->`;
                }
            }
        });
    },

    // ===================================================================
    // UTILIDADES
    // ===================================================================

    _flattenObject(obj, prefix = '') {
        const flattened = {};
        
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                const newKey = prefix ? `${prefix}.${key}` : key;
                
                if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                    Object.assign(flattened, this._flattenObject(value, newKey));
                } else {
                    flattened[newKey] = value;
                }
            }
        }
        
        return flattened;
    },

    // ===================================================================
    // PREVIEW TEMPLATE (PARA SISTEMA DE PLUGINS)
    // ===================================================================

    getPreviewTemplate() {
        return `
            <!-- LIQUID.JS CDN -->
            <script src="https://cdnjs.cloudflare.com/ajax/libs/liquidjs/10.7.0/liquid.browser.min.js"></script>
            
            <script>
                // Inicializar Liquid.js en el preview
                if (typeof Liquid !== 'undefined') {
                    window.liquid = new Liquid({
                        cache: false,
                        strictFilters: false,
                        strictVariables: false
                    });
                    
                    console.log('💧 Liquid.js loaded in preview');
                }
            </script>
        `;
    },

    // ===================================================================
    // DEBUG Y DESARROLLO
    // ===================================================================

    getDebugInfo() {
        return {
            version: this.version,
            liquidAvailable: !!this.liquid,
            backendAvailable: this.backendAvailable,
            backendTemplatesCount: this.backendTemplates?.size || 0,
            localTemplatesCount: this.localTemplates?.size || 0,
            cacheSize: this.cache?.size || 0
        };
    }
};

// ===================================================================
// DEBUG HELPERS (DEVELOPMENT)
// ===================================================================

if (process.env.NODE_ENV === 'development') {
    window.debugTemplatesPlugin = {
        async testRender(content = '{{ title }} - {% if user.name %}Hello {{ user.name }}!{% endif %}') {
            const data = {
                title: 'Test Template',
                user: { name: 'Test User' }
            };
            
            const result = await templatesPlugin.renderTemplate(content, data);
            console.log('🎨 Template result:', result);
            return result;
        },
        
        detectType(content) {
            const type = templatesPlugin._detectTemplateType(content);
            console.log('🔍 Template type:', type);
            return type;
        },
        
        showDebugInfo() {
            console.table(templatesPlugin.getDebugInfo());
        },
        
        listTemplates() {
            return templatesPlugin.listTemplates();
        }
    };
}

export default templatesPlugin;
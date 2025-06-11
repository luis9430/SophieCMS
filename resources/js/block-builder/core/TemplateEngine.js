// ===================================================================
// core/TemplateEngine.js - FASE 3: TEMPLATES EDITABLES
// Responsabilidad: Motor para templates editables y seguros
// ===================================================================

import templateValidator from '../security/TemplateValidator.js';

/**
 * Motor de templates que permite cargar, guardar y procesar templates
 * de forma segura con validación automática
 */
export class TemplateEngine {
    constructor() {
        // Storage para templates (en una implementación real sería IndexedDB/localStorage)
        this.templates = new Map();
        
        // Cache de templates compilados
        this.compiledCache = new Map();
        
        // Configuración
        this.config = {
            validateOnLoad: true,
            validateOnSave: true,
            enableCache: true,
            maxCacheSize: 100,
            placeholderPattern: /\{\{([A-Z_]+)\}\}/g,
            allowedPlaceholders: new Set([
                'TITLE', 'STYLES', 'CONTENT', 'SCRIPTS', 'HEAD_EXTRA',
                'BODY_CLASS', 'META_TAGS', 'ANALYTICS', 'CUSTOM_CSS'
            ])
        };
        
        // Registrar templates por defecto
        this._registerDefaultTemplates();
        
        console.log('🏗️ TemplateEngine initialized');
    }

    // ===================================================================
    // CARGA Y GESTIÓN DE TEMPLATES
    // ===================================================================

    /**
     * Cargar template desde storage
     * @param {string} pluginName - Nombre del plugin
     * @param {string} templateName - Nombre del template
     * @returns {Promise<string>} Contenido del template
     */
    async loadTemplate(pluginName, templateName) {
        const templateKey = `${pluginName}/${templateName}`;
        
        try {
            // Verificar cache primero
            if (this.config.enableCache && this.compiledCache.has(templateKey)) {
                const cached = this.compiledCache.get(templateKey);
                if (this._isCacheValid(cached)) {
                    console.log(`📋 Template loaded from cache: ${templateKey}`);
                    return cached.content;
                }
                this.compiledCache.delete(templateKey);
            }

            // Cargar desde storage
            let template = this.templates.get(templateKey);
            
            if (!template) {
                throw new Error(`Template ${templateKey} not found`);
            }

            // Validar si está habilitado
            if (this.config.validateOnLoad) {
                const validation = templateValidator.validate(template.content);
                if (!validation.isValid) {
                    const criticalErrors = validation.errors.filter(e => e.severity === 'critical');
                    if (criticalErrors.length > 0) {
                        throw new Error(`Template validation failed: ${criticalErrors[0].message}`);
                    }
                    console.warn(`⚠️ Template ${templateKey} has warnings:`, validation.warnings);
                }
                
                // Usar versión sanitizada si existe
                template.content = validation.sanitized || template.content;
            }

            // Guardar en cache
            if (this.config.enableCache) {
                this._saveToCache(templateKey, template.content);
            }

            console.log(`📋 Template loaded: ${templateKey}`);
            return template.content;

        } catch (error) {
            console.error(`❌ Error loading template ${templateKey}:`, error);
            throw error;
        }
    }

    /**
     * Guardar template en storage
     * @param {string} pluginName - Nombre del plugin
     * @param {string} templateName - Nombre del template
     * @param {string} content - Contenido del template
     * @param {Object} metadata - Metadata opcional
     * @returns {Promise<boolean>} Éxito de la operación
     */
    async saveTemplate(pluginName, templateName, content, metadata = {}) {
        const templateKey = `${pluginName}/${templateName}`;
        
        try {
            // Validar contenido si está habilitado
            if (this.config.validateOnSave) {
                const validation = templateValidator.validate(content);
                if (!validation.isValid) {
                    const criticalErrors = validation.errors.filter(e => e.severity === 'critical');
                    if (criticalErrors.length > 0) {
                        throw new Error(`Cannot save template: ${criticalErrors[0].message}`);
                    }
                }
                
                // Usar versión sanitizada para guardar
                content = validation.sanitized || content;
            }

            // Validar placeholders
            this._validatePlaceholders(content);

            // Crear template object
            const template = {
                content,
                pluginName,
                templateName,
                metadata: {
                    ...metadata,
                    savedAt: new Date().toISOString(),
                    version: metadata.version || '1.0.0'
                },
                custom: metadata.custom || false
            };

            // Guardar en storage
            this.templates.set(templateKey, template);
            
            // Invalidar cache
            this.compiledCache.delete(templateKey);

            console.log(`💾 Template saved: ${templateKey}`);
            return true;

        } catch (error) {
            console.error(`❌ Error saving template ${templateKey}:`, error);
            throw error;
        }
    }

    /**
     * Listar templates disponibles
     * @param {string} pluginName - Filtrar por plugin (opcional)
     * @returns {Array} Lista de templates
     */
    listTemplates(pluginName = null) {
        const templates = [];
        
        for (const [key, template] of this.templates.entries()) {
            if (pluginName && !key.startsWith(`${pluginName}/`)) {
                continue;
            }
            
            templates.push({
                key,
                pluginName: template.pluginName,
                templateName: template.templateName,
                custom: template.custom,
                version: template.metadata.version,
                savedAt: template.metadata.savedAt,
                size: template.content.length
            });
        }
        
        return templates.sort((a, b) => a.key.localeCompare(b.key));
    }

    /**
     * Eliminar template
     * @param {string} pluginName - Nombre del plugin
     * @param {string} templateName - Nombre del template
     * @returns {boolean} Éxito de la operación
     */
    deleteTemplate(pluginName, templateName) {
        const templateKey = `${pluginName}/${templateName}`;
        
        const deleted = this.templates.delete(templateKey);
        if (deleted) {
            this.compiledCache.delete(templateKey);
            console.log(`🗑️ Template deleted: ${templateKey}`);
        }
        
        return deleted;
    }

    // ===================================================================
    // PROCESAMIENTO DE TEMPLATES
    // ===================================================================

    /**
     * Procesar template reemplazando placeholders
     * @param {string} template - Template con placeholders
     * @param {Object} variables - Variables para reemplazar
     * @returns {string} Template procesado
     */
    processTemplate(template, variables = {}) {
        if (!template || typeof template !== 'string') {
            return template || '';
        }

        try {
            let processed = template;
            
            // Procesar placeholders definidos
            processed = processed.replace(this.config.placeholderPattern, (match, placeholder) => {
                if (variables.hasOwnProperty(placeholder)) {
                    return String(variables[placeholder]);
                }
                
                // Placeholder no encontrado - mantener o usar valor por defecto
                const defaultValues = this._getDefaultPlaceholderValues();
                if (defaultValues.hasOwnProperty(placeholder)) {
                    return defaultValues[placeholder];
                }
                
                console.warn(`⚠️ Placeholder not found: ${placeholder}`);
                return match; // Mantener placeholder original
            });

            // Procesar placeholders de variables {{ variable }}
            if (window.processVariables && typeof window.processVariables === 'function') {
                processed = window.processVariables(processed);
            }

            return processed;

        } catch (error) {
            console.error('❌ Error processing template:', error);
            return template; // Fallback al template original
        }
    }

    /**
     * Renderizar template completo
     * @param {string} pluginName - Nombre del plugin
     * @param {string} templateName - Nombre del template
     * @param {Object} variables - Variables para el template
     * @returns {Promise<string>} HTML renderizado
     */
    async renderTemplate(pluginName, templateName, variables = {}) {
        try {
            const template = await this.loadTemplate(pluginName, templateName);
            return this.processTemplate(template, variables);
        } catch (error) {
            console.error(`❌ Error rendering template ${pluginName}/${templateName}:`, error);
            throw error;
        }
    }

    // ===================================================================
    // GESTIÓN DE CACHE
    // ===================================================================

    /**
     * Limpiar cache de templates
     * @param {string} pluginName - Limpiar solo templates de un plugin (opcional)
     */
    clearCache(pluginName = null) {
        if (pluginName) {
            // Limpiar cache de un plugin específico
            for (const [key] of this.compiledCache.entries()) {
                if (key.startsWith(`${pluginName}/`)) {
                    this.compiledCache.delete(key);
                }
            }
            console.log(`🧹 Cache cleared for plugin: ${pluginName}`);
        } else {
            // Limpiar todo el cache
            this.compiledCache.clear();
            console.log('🧹 Template cache cleared');
        }
    }

    /**
     * Guardar en cache
     * @private
     */
    _saveToCache(key, content) {
        // Verificar límite de cache
        if (this.compiledCache.size >= this.config.maxCacheSize) {
            // Remover entrada más antigua (LRU simple)
            const oldestKey = this.compiledCache.keys().next().value;
            this.compiledCache.delete(oldestKey);
        }
        
        this.compiledCache.set(key, {
            content,
            timestamp: Date.now()
        });
    }

    /**
     * Verificar si cache es válido
     * @private
     */
    _isCacheValid(cached) {
        // Cache válido por 5 minutos
        const maxAge = 5 * 60 * 1000;
        return (Date.now() - cached.timestamp) < maxAge;
    }

    // ===================================================================
    // VALIDACIÓN Y CONFIGURACIÓN
    // ===================================================================

    /**
     * Validar placeholders en template
     * @private
     */
    _validatePlaceholders(content) {
        const placeholders = [...content.matchAll(this.config.placeholderPattern)];
        
        for (const [match, placeholder] of placeholders) {
            if (!this.config.allowedPlaceholders.has(placeholder)) {
                console.warn(`⚠️ Unknown placeholder: ${placeholder}`);
            }
        }
    }

    /**
     * Obtener valores por defecto para placeholders
     * @private
     */
    _getDefaultPlaceholderValues() {
        return {
            'TITLE': 'Page Builder - Alpine.js + Tailwind CSS',
            'STYLES': '<!-- No additional styles -->',
            'CONTENT': '<div>No content provided</div>',
            'SCRIPTS': '<!-- No additional scripts -->',
            'HEAD_EXTRA': '',
            'BODY_CLASS': '',
            'META_TAGS': '<meta name="generator" content="Page Builder">',
            'ANALYTICS': '<!-- Analytics code -->',
            'CUSTOM_CSS': '/* Custom CSS */'
        };
    }

    /**
     * Registrar templates por defecto
     * @private
     */
    _registerDefaultTemplates() {
        // Template base para Alpine.js
        const alpineBaseTemplate = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    
    {{META_TAGS}}
    
    <!-- 🎨 TAILWIND CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- ⚡ ALPINE.JS -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    
    <!-- 🎬 GSAP CORE + SCROLLTRIGGER -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
    
    {{STYLES}}
    {{HEAD_EXTRA}}
</head>

<body class="{{BODY_CLASS}}">
    <!-- 🚀 CONTENIDO PRINCIPAL DEL PREVIEW -->
    <div id="preview-content">
        {{CONTENT}}
    </div>
    
    {{SCRIPTS}}
    {{ANALYTICS}}
</body>
</html>`;

        // Template mínimo
        const minimalTemplate = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>{{TITLE}}</title>
    {{STYLES}}
</head>
<body>
    {{CONTENT}}
    {{SCRIPTS}}
</body>
</html>`;

        // Template con debug
        const debugTemplate = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}} - Debug Mode</title>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    
    {{STYLES}}
    
    <style>
        .debug-panel {
            position: fixed;
            top: 10px;
            right: 10px;
            background: #1f2937;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 9999;
            max-width: 300px;
        }
    </style>
</head>

<body>
    <!-- Panel de Debug -->
    <div class="debug-panel" x-data="{ timestamp: Date.now() }">
        <h4>🔧 Debug Panel</h4>
        <p><strong>Template:</strong> Debug Mode</p>
        <p><strong>Rendered:</strong> <span x-text="new Date(timestamp).toLocaleTimeString()"></span></p>
        <p><strong>Alpine:</strong> <span x-text="typeof Alpine !== 'undefined' ? '✅' : '❌'"></span></p>
        <p><strong>Tailwind:</strong> ✅</p>
    </div>
    
    <!-- Contenido principal -->
    <div id="preview-content">
        {{CONTENT}}
    </div>
    
    {{SCRIPTS}}
</body>
</html>`;

        // Registrar templates
        const defaultTemplates = [
            {
                plugin: 'alpine',
                name: 'base',
                content: alpineBaseTemplate,
                metadata: { description: 'Template base con Alpine.js, Tailwind y GSAP' }
            },
            {
                plugin: 'alpine',
                name: 'minimal',
                content: minimalTemplate,
                metadata: { description: 'Template mínimo sin librerías externas' }
            },
            {
                plugin: 'alpine',
                name: 'debug',
                content: debugTemplate,
                metadata: { description: 'Template con panel de debug integrado' }
            }
        ];

        defaultTemplates.forEach(({ plugin, name, content, metadata }) => {
            this.templates.set(`${plugin}/${name}`, {
                content,
                pluginName: plugin,
                templateName: name,
                metadata: {
                    ...metadata,
                    savedAt: new Date().toISOString(),
                    version: '1.0.0'
                },
                custom: false
            });
        });

        console.log(`📋 Registered ${defaultTemplates.length} default templates`);
    }

    // ===================================================================
    // API PÚBLICA - CONFIGURACIÓN
    // ===================================================================

    /**
     * Actualizar configuración
     * @param {Object} newConfig - Nueva configuración
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        if (!newConfig.enableCache) {
            this.clearCache();
        }
        
        console.log('⚙️ TemplateEngine config updated');
    }

    /**
     * Obtener configuración actual
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Obtener estadísticas
     */
    getStats() {
        return {
            templatesCount: this.templates.size,
            cacheSize: this.compiledCache.size,
            customTemplates: Array.from(this.templates.values()).filter(t => t.custom).length,
            defaultTemplates: Array.from(this.templates.values()).filter(t => !t.custom).length
        };
    }

    /**
     * Hot reload de template específico
     * @param {string} pluginName - Nombre del plugin
     * @param {string} templateName - Nombre del template
     * @param {string} newContent - Nuevo contenido
     */
    async hotReload(pluginName, templateName, newContent) {
        try {
            await this.saveTemplate(pluginName, templateName, newContent, { custom: true });
            console.log(`🔥 Template hot-reloaded: ${pluginName}/${templateName}`);
            return true;
        } catch (error) {
            console.error(`❌ Hot reload failed:`, error);
            throw error;
        }
    }
}

// ===================================================================
// INSTANCIA SINGLETON
// ===================================================================

const templateEngine = new TemplateEngine();

export default templateEngine;

// ===================================================================
// FUNCIONES DE CONVENIENCIA
// ===================================================================

/**
 * Función rápida para renderizar template
 */
export const renderTemplate = async (pluginName, templateName, variables = {}) => {
    return await templateEngine.renderTemplate(pluginName, templateName, variables);
};

/**
 * Función rápida para procesar template
 */
export const processTemplate = (template, variables = {}) => {
    return templateEngine.processTemplate(template, variables);
};

// ===================================================================
// DEBUGGING EN DESARROLLO
// ===================================================================

if (process.env.NODE_ENV === 'development') {
    window.templateEngine = templateEngine;
    
    // Test básico
    console.log('🧪 TemplateEngine test - Default templates:');
    console.table(templateEngine.listTemplates());
    
    console.log('🔧 TemplateEngine exposed to window for debugging');
}
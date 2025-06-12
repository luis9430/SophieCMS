// ===================================================================
// plugins/templates/renderer.js
// Motor de renderizado para templates Liquid
// ===================================================================

export class TemplateRenderer {
    constructor(liquidEngine, validator = null) {
        this.liquid = liquidEngine;
        this.validator = validator;
        
        this.config = {
            enableCache: true,
            cacheTimeout: 300000, // 5 minutos
            maxCacheSize: 100,
            strictMode: false,
            enableProfiling: false,
            defaultVariables: {},
            allowPartials: true,
            allowIncludes: true,
            renderTimeout: 10000, // 10 segundos
            maxRecursionDepth: 10
        };
        
        // Cache de templates compilados
        this.compiledCache = new Map();
        this.renderCache = new Map();
        
        // Estadísticas de rendimiento
        this.stats = {
            rendersPerformed: 0,
            cacheHits: 0,
            cacheMisses: 0,
            totalRenderTime: 0,
            averageRenderTime: 0,
            lastRender: null,
            errorCount: 0
        };
        
        // Variables globales disponibles para todos los templates
        this.globalVariables = new Map();
        
        // Helpers y funciones personalizadas
        this.helpers = new Map();
        
        console.log('🎨 TemplateRenderer initialized');
    }

    // ===================================================================
    // RENDERIZADO PRINCIPAL
    // ===================================================================

    /**
     * Renderizar template con datos
     */
    async render(templateContent, data = {}, options = {}) {
        const startTime = Date.now();
        const renderOptions = { ...this.config, ...options };
        
        try {
            this.stats.rendersPerformed++;
            
            // Validar template si hay validador disponible
            if (this.validator && renderOptions.validate !== false) {
                const validation = await this.validator.validateQuick(templateContent);
                if (!validation.isValid) {
                    throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
                }
            }
            
            // Preparar datos completos
            const fullData = this._prepareRenderData(data, renderOptions);
            
            // Verificar cache de renderizado
            const cacheKey = this._getRenderCacheKey(templateContent, fullData);
            if (renderOptions.enableCache && this.renderCache.has(cacheKey)) {
                const cached = this.renderCache.get(cacheKey);
                if (this._isCacheValid(cached)) {
                    this.stats.cacheHits++;
                    return cached.result;
                }
                this.renderCache.delete(cacheKey);
            }
            
            this.stats.cacheMisses++;
            
            // Obtener template compilado
            const compiled = await this._getCompiledTemplate(templateContent, renderOptions);
            
            // Renderizar con timeout
            const result = await this._renderWithTimeout(compiled, fullData, renderOptions);
            
            // Guardar en cache si está habilitado
            if (renderOptions.enableCache) {
                this._saveToRenderCache(cacheKey, result);
            }
            
            // Actualizar estadísticas
            const renderTime = Date.now() - startTime;
            this._updateStats(renderTime);
            
            return result;
            
        } catch (error) {
            this.stats.errorCount++;
            console.error('❌ Template render error:', error);
            
            if (renderOptions.strictMode) {
                throw error;
            } else {
                // En modo no estricto, devolver mensaje de error amigable
                return this._createErrorOutput(error, templateContent, data);
            }
        }
    }

    /**
     * Renderizar múltiples templates
     */
    async renderMultiple(templates, data = {}, options = {}) {
        const results = [];
        const errors = [];
        
        for (const template of templates) {
            try {
                const result = await this.render(template.content, {
                    ...data,
                    ...template.data
                }, options);
                
                results.push({
                    name: template.name,
                    result,
                    success: true
                });
            } catch (error) {
                errors.push({
                    name: template.name,
                    error: error.message,
                    success: false
                });
                
                results.push({
                    name: template.name,
                    result: null,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return {
            results,
            errors,
            successCount: results.filter(r => r.success).length,
            errorCount: errors.length
        };
    }

    /**
     * Renderizar con contexto específico
     */
    async renderWithContext(templateContent, context, options = {}) {
        const contextData = {
            ...this._getGlobalVariables(),
            ...context.variables,
            _context: {
                name: context.name || 'default',
                timestamp: new Date().toISOString(),
                user: context.user || {},
                environment: context.environment || 'production'
            }
        };
        
        return await this.render(templateContent, contextData, {
            ...options,
            contextName: context.name
        });
    }

    // ===================================================================
    // COMPILACIÓN Y CACHE
    // ===================================================================

    /**
     * Obtener template compilado (con cache)
     * @private
     */
    async _getCompiledTemplate(templateContent, options) {
        const cacheKey = this._getCompileCacheKey(templateContent);
        
        // Verificar cache de compilación
        if (options.enableCache && this.compiledCache.has(cacheKey)) {
            const cached = this.compiledCache.get(cacheKey);
            if (this._isCacheValid(cached)) {
                return cached.compiled;
            }
            this.compiledCache.delete(cacheKey);
        }
        
        // Compilar template
        const compiled = await this.liquid.parse(templateContent);
        
        // Guardar en cache
        if (options.enableCache) {
            this._saveToCompileCache(cacheKey, compiled);
        }
        
        return compiled;
    }

    /**
     * Preparar datos para renderizado
     * @private
     */
    _prepareRenderData(data, options) {
        const fullData = {
            // Variables globales
            ...this._getGlobalVariables(),
            
            // Variables por defecto
            ...this.config.defaultVariables,
            
            // Datos específicos del renderizado
            ...data,
            
            // Variables del sistema
            _system: {
                timestamp: new Date().toISOString(),
                renderCount: this.stats.rendersPerformed,
                version: '1.0.0'
            },
            
            // Helpers disponibles
            _helpers: this._getHelperFunctions()
        };
        
        // Integrar con plugin de variables si está disponible
        if (window.pluginManager?.get('variables')) {
            const variablesPlugin = window.pluginManager.get('variables');
            const availableVars = variablesPlugin.getAvailableVariables();
            
            // Añadir variables dinámicas
            Object.entries(availableVars).forEach(([categoryKey, category]) => {
                Object.entries(category.variables).forEach(([path, value]) => {
                    this._setNestedValue(fullData, path, value);
                });
            });
        }
        
        return fullData;
    }

    /**
     * Renderizar con timeout
     * @private
     */
    async _renderWithTimeout(compiled, data, options) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Template render timeout after ${options.renderTimeout}ms`));
            }, options.renderTimeout);
            
            this.liquid.render(compiled, data)
                .then(result => {
                    clearTimeout(timeout);
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timeout);
                    reject(error);
                });
        });
    }

    // ===================================================================
    // GESTIÓN DE VARIABLES GLOBALES
    // ===================================================================

    /**
     * Establecer variable global
     */
    setGlobalVariable(key, value) {
        this.globalVariables.set(key, value);
        this._clearRenderCache(); // Limpiar cache porque las variables globales cambiaron
        console.log(`🌐 Global variable set: ${key}`);
    }

    /**
     * Obtener variable global
     */
    getGlobalVariable(key) {
        return this.globalVariables.get(key);
    }

    /**
     * Establecer múltiples variables globales
     */
    setGlobalVariables(variables) {
        Object.entries(variables).forEach(([key, value]) => {
            this.globalVariables.set(key, value);
        });
        this._clearRenderCache();
        console.log(`🌐 ${Object.keys(variables).length} global variables set`);
    }

    /**
     * Obtener todas las variables globales
     */
    _getGlobalVariables() {
        const globals = {};
        this.globalVariables.forEach((value, key) => {
            this._setNestedValue(globals, key, value);
        });
        return globals;
    }

    /**
     * Eliminar variable global
     */
    removeGlobalVariable(key) {
        const removed = this.globalVariables.delete(key);
        if (removed) {
            this._clearRenderCache();
            console.log(`🌐 Global variable removed: ${key}`);
        }
        return removed;
    }

    /**
     * Limpiar todas las variables globales
     */
    clearGlobalVariables() {
        this.globalVariables.clear();
        this._clearRenderCache();
        console.log('🌐 All global variables cleared');
    }

    // ===================================================================
    // GESTIÓN DE HELPERS
    // ===================================================================

    /**
     * Registrar helper personalizado
     */
    registerHelper(name, fn) {
        if (typeof fn !== 'function') {
            throw new Error('Helper must be a function');
        }
        
        this.helpers.set(name, fn);
        console.log(`🔧 Helper registered: ${name}`);
    }

    /**
     * Obtener helper
     */
    getHelper(name) {
        return this.helpers.get(name);
    }

    /**
     * Obtener todas las funciones helper
     */
    _getHelperFunctions() {
        const helperFunctions = {};
        this.helpers.forEach((fn, name) => {
            helperFunctions[name] = fn;
        });
        return helperFunctions;
    }

    /**
     * Registrar helpers por defecto
     */
    _registerDefaultHelpers() {
        // Helper para formatear fechas
        this.registerHelper('formatDate', (date, format = 'short') => {
            const d = new Date(date);
            const options = {
                'short': { year: 'numeric', month: 'short', day: 'numeric' },
                'long': { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
                'time': { hour: '2-digit', minute: '2-digit' },
                'datetime': { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
            };
            return d.toLocaleDateString('es-ES', options[format] || options.short);
        });

        // Helper para pluralización
        this.registerHelper('pluralize', (count, singular, plural) => {
            return count === 1 ? singular : (plural || singular + 's');
        });

        // Helper para truncar texto
        this.registerHelper('truncate', (text, length = 100, suffix = '...') => {
            const str = String(text);
            return str.length > length ? str.substring(0, length) + suffix : str;
        });

        // Helper para condicionales complejas
        this.registerHelper('when', (condition, trueValue, falseValue = '') => {
            return condition ? trueValue : falseValue;
        });

        // Helper para debugging
        this.registerHelper('debug', (value) => {
            console.log('🔍 Template debug:', value);
            return JSON.stringify(value, null, 2);
        });

        console.log('✅ Default helpers registered');
    }

    // ===================================================================
    // RENDERIZADO ESPECIALIZADO
    // ===================================================================

    /**
     * Renderizar template para email
     */
    async renderEmail(templateContent, emailData, options = {}) {
        const emailOptions = {
            ...options,
            strictMode: true, // Emails requieren modo estricto
            validate: true,
            contextName: 'email'
        };

        const emailContext = {
            ...emailData,
            _email: {
                type: 'email',
                timestamp: new Date().toISOString(),
                preheader: emailData.preheader || '',
                tracking: emailData.tracking || {}
            }
        };

        return await this.render(templateContent, emailContext, emailOptions);
    }

    /**
     * Renderizar template para página web
     */
    async renderPage(templateContent, pageData, options = {}) {
        const pageOptions = {
            ...options,
            contextName: 'page',
            allowPartials: true
        };

        const pageContext = {
            ...pageData,
            _page: {
                type: 'page',
                url: pageData.url || window.location.href,
                title: pageData.title || '',
                meta: pageData.meta || {},
                timestamp: new Date().toISOString()
            }
        };

        return await this.render(templateContent, pageContext, pageOptions);
    }

    /**
     * Renderizar componente
     */
    async renderComponent(templateContent, componentData, options = {}) {
        const componentOptions = {
            ...options,
            contextName: 'component',
            enableCache: true // Los componentes se benefician del cache
        };

        const componentContext = {
            ...componentData,
            _component: {
                type: 'component',
                id: componentData.id || this._generateId(),
                props: componentData.props || {},
                timestamp: new Date().toISOString()
            }
        };

        return await this.render(templateContent, componentContext, componentOptions);
    }

    // ===================================================================
    // RENDERIZADO CON STREAMING
    // ===================================================================

    /**
     * Renderizar template en chunks (para templates grandes)
     */
    async renderStream(templateContent, data = {}, options = {}) {
        const chunks = this._splitTemplateIntoChunks(templateContent);
        const results = [];
        
        for (const chunk of chunks) {
            try {
                const result = await this.render(chunk, data, {
                    ...options,
                    enableCache: false // No cachear chunks individuales
                });
                results.push(result);
            } catch (error) {
                if (options.strictMode) {
                    throw error;
                } else {
                    results.push(`<!-- Error in chunk: ${error.message} -->`);
                }
            }
        }
        
        return results.join('');
    }

    /**
     * Dividir template en chunks
     * @private
     */
    _splitTemplateIntoChunks(templateContent, chunkSize = 10000) {
        const chunks = [];
        const lines = templateContent.split('\n');
        let currentChunk = '';
        
        for (const line of lines) {
            if (currentChunk.length + line.length > chunkSize && currentChunk.length > 0) {
                chunks.push(currentChunk);
                currentChunk = line + '\n';
            } else {
                currentChunk += line + '\n';
            }
        }
        
        if (currentChunk.trim()) {
            chunks.push(currentChunk);
        }
        
        return chunks;
    }

    // ===================================================================
    // CACHE Y OPTIMIZACIÓN
    // ===================================================================

    /**
     * Generar clave de cache para renderizado
     * @private
     */
    _getRenderCacheKey(templateContent, data) {
        const contentHash = this._simpleHash(templateContent);
        const dataHash = this._simpleHash(JSON.stringify(data));
        return `render_${contentHash}_${dataHash}`;
    }

    /**
     * Generar clave de cache para compilación
     * @private
     */
    _getCompileCacheKey(templateContent) {
        return `compile_${this._simpleHash(templateContent)}`;
    }

    /**
     * Hash simple para cache
     * @private
     */
    _simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Verificar si cache es válido
     * @private
     */
    _isCacheValid(cached) {
        const now = Date.now();
        return (now - cached.timestamp) < this.config.cacheTimeout;
    }

    /**
     * Guardar en cache de renderizado
     * @private
     */
    _saveToRenderCache(key, result) {
        if (this.renderCache.size >= this.config.maxCacheSize) {
            // Eliminar la entrada más antigua
            const oldestKey = this.renderCache.keys().next().value;
            this.renderCache.delete(oldestKey);
        }
        
        this.renderCache.set(key, {
            result,
            timestamp: Date.now()
        });
    }

    /**
     * Guardar en cache de compilación
     * @private
     */
    _saveToCompileCache(key, compiled) {
        if (this.compiledCache.size >= this.config.maxCacheSize) {
            const oldestKey = this.compiledCache.keys().next().value;
            this.compiledCache.delete(oldestKey);
        }
        
        this.compiledCache.set(key, {
            compiled,
            timestamp: Date.now()
        });
    }

    /**
     * Limpiar cache de renderizado
     * @private
     */
    _clearRenderCache() {
        this.renderCache.clear();
    }

    /**
     * Limpiar todo el cache
     */
    clearCache() {
        this.renderCache.clear();
        this.compiledCache.clear();
        console.log('🧹 Template renderer cache cleared');
    }

    /**
     * Optimizar cache (eliminar entradas expiradas)
     */
    optimizeCache() {
        const now = Date.now();
        
        // Limpiar cache de renderizado
        for (const [key, cached] of this.renderCache.entries()) {
            if ((now - cached.timestamp) > this.config.cacheTimeout) {
                this.renderCache.delete(key);
            }
        }
        
        // Limpiar cache de compilación
        for (const [key, cached] of this.compiledCache.entries()) {
            if ((now - cached.timestamp) > this.config.cacheTimeout) {
                this.compiledCache.delete(key);
            }
        }
        
        console.log('🔧 Template renderer cache optimized');
    }

    // ===================================================================
    // UTILIDADES
    // ===================================================================

    /**
     * Establecer valor anidado en objeto
     * @private
     */
    _setNestedValue(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
    }

    /**
     * Generar ID único
     * @private
     */
    _generateId() {
        return 'tpl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Crear salida de error amigable
     * @private
     */
    _createErrorOutput(error, templateContent, data) {
        if (process.env.NODE_ENV === 'development') {
            return `
                <div style="border: 2px solid #ef4444; padding: 1rem; margin: 1rem 0; background: #fef2f2; color: #dc2626; border-radius: 8px;">
                    <h3 style="margin: 0 0 0.5rem 0; color: #dc2626;">🚨 Template Render Error</h3>
                    <p style="margin: 0 0 1rem 0;"><strong>Message:</strong> ${error.message}</p>
                    <details style="margin-top: 1rem;">
                        <summary style="cursor: pointer; font-weight: bold;">Debug Information</summary>
                        <pre style="background: #fff; padding: 1rem; margin-top: 0.5rem; border-radius: 4px; overflow: auto; font-size: 12px;">${JSON.stringify({ 
                            error: error.message, 
                            templatePreview: templateContent.substring(0, 200) + '...', 
                            dataKeys: Object.keys(data) 
                        }, null, 2)}</pre>
                    </details>
                </div>
            `;
        } else {
            return `<!-- Template render error: ${error.message} -->`;
        }
    }

    /**
     * Actualizar estadísticas
     * @private
     */
    _updateStats(renderTime) {
        this.stats.totalRenderTime += renderTime;
        this.stats.averageRenderTime = this.stats.totalRenderTime / this.stats.rendersPerformed;
        this.stats.lastRender = new Date().toISOString();
    }

    // ===================================================================
    // CONFIGURACIÓN Y ESTADÍSTICAS
    // ===================================================================

    /**
     * Actualizar configuración
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Si se cambió el cache, limpiarlo
        if ('enableCache' in newConfig && !newConfig.enableCache) {
            this.clearCache();
        }
        
        console.log('⚙️ TemplateRenderer config updated');
    }

    /**
     * Obtener configuración actual
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Obtener estadísticas de rendimiento
     */
    getStats() {
        return {
            ...this.stats,
            cacheStats: {
                renderCacheSize: this.renderCache.size,
                compileCacheSize: this.compiledCache.size,
                hitRatio: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) || 0
            },
            globalVariablesCount: this.globalVariables.size,
            helpersCount: this.helpers.size
        };
    }

    /**
     * Obtener información detallada del renderer
     */
    getInfo() {
        return {
            config: this.getConfig(),
            stats: this.getStats(),
            globalVariables: Array.from(this.globalVariables.keys()),
            helpers: Array.from(this.helpers.keys()),
            memoryUsage: {
                renderCache: this.renderCache.size,
                compiledCache: this.compiledCache.size,
                globalVariables: this.globalVariables.size
            }
        };
    }

    /**
     * Reiniciar estadísticas
     */
    resetStats() {
        this.stats = {
            rendersPerformed: 0,
            cacheHits: 0,
            cacheMisses: 0,
            totalRenderTime: 0,
            averageRenderTime: 0,
            lastRender: null,
            errorCount: 0
        };
        console.log('📊 TemplateRenderer stats reset');
    }

    // ===================================================================
    // PROFILING Y DEBUGGING
    // ===================================================================

    /**
     * Renderizar con profiling detallado
     */
    async renderWithProfiling(templateContent, data = {}, options = {}) {
        const profile = {
            startTime: Date.now(),
            stages: {}
        };

        try {
            // Preparación de datos
            const dataStart = Date.now();
            const fullData = this._prepareRenderData(data, options);
            profile.stages.dataPreparation = Date.now() - dataStart;

            // Compilación
            const compileStart = Date.now();
            const compiled = await this._getCompiledTemplate(templateContent, options);
            profile.stages.compilation = Date.now() - compileStart;

            // Renderizado
            const renderStart = Date.now();
            const result = await this._renderWithTimeout(compiled, fullData, options);
            profile.stages.rendering = Date.now() - renderStart;

            profile.totalTime = Date.now() - profile.startTime;
            profile.success = true;

            console.log('📊 Render profile:', profile);

            return {
                result,
                profile
            };

        } catch (error) {
            profile.totalTime = Date.now() - profile.startTime;
            profile.success = false;
            profile.error = error.message;

            console.error('📊 Render profile (failed):', profile);
            throw error;
        }
    }

    /**
     * Analizar template (sin renderizar)
     */
    async analyzeTemplate(templateContent) {
        try {
            const analysis = {
                size: templateContent.length,
                lines: templateContent.split('\n').length,
                variables: [],
                tags: [],
                filters: [],
                complexity: 0,
                estimatedRenderTime: 0
            };

            // Compilar para analizar estructura
            const compiled = await this.liquid.parse(templateContent);
            
            // Extraer información del AST
            this._analyzeAST(compiled, analysis);
            
            // Calcular complejidad estimada
            analysis.complexity = this._calculateComplexity(analysis);
            
            // Estimar tiempo de renderizado
            analysis.estimatedRenderTime = this._estimateRenderTime(analysis);

            return analysis;

        } catch (error) {
            return {
                error: error.message,
                valid: false
            };
        }
    }

    /**
     * Analizar AST del template
     * @private
     */
    _analyzeAST(ast, analysis) {
        const traverse = (node) => {
            if (node.type === 'output') {
                // Variable encontrada
                if (node.variable) {
                    analysis.variables.push(node.variable.name);
                }
                
                // Filtros encontrados
                if (node.filters) {
                    node.filters.forEach(filter => {
                        if (!analysis.filters.includes(filter.name)) {
                            analysis.filters.push(filter.name);
                        }
                    });
                }
            } else if (node.type === 'tag') {
                // Tag encontrado
                if (!analysis.tags.includes(node.name)) {
                    analysis.tags.push(node.name);
                }
            }
            
            if (node.children) {
                node.children.forEach(traverse);
            }
        };

        if (Array.isArray(ast)) {
            ast.forEach(traverse);
        } else {
            traverse(ast);
        }
    }

    /**
     * Calcular complejidad del template
     * @private
     */
    _calculateComplexity(analysis) {
        let complexity = 0;
        
        complexity += analysis.variables.length * 1;
        complexity += analysis.tags.length * 2;
        complexity += analysis.filters.length * 1.5;
        complexity += analysis.lines * 0.1;
        
        // Penalización por tags complejos
        const complexTags = ['for', 'if', 'case', 'tablerow'];
        const complexTagCount = analysis.tags.filter(tag => complexTags.includes(tag)).length;
        complexity += complexTagCount * 5;
        
        return Math.round(complexity);
    }

    /**
     * Estimar tiempo de renderizado
     * @private
     */
    _estimateRenderTime(analysis) {
        // Estimación muy básica basada en complejidad
        const baseTime = 10; // ms base
        const complexityMultiplier = 0.5;
        
        return Math.round(baseTime + (analysis.complexity * complexityMultiplier));
    }

    // ===================================================================
    // CLEANUP
    // ===================================================================

    /**
     * Limpiar recursos del renderer
     */
    async cleanup() {
        try {
            // Limpiar caches
            this.clearCache();
            
            // Limpiar variables globales
            this.globalVariables.clear();
            
            // Limpiar helpers
            this.helpers.clear();
            
            // Reset estadísticas
            this.resetStats();
            
            // Limpiar referencias
            this.liquid = null;
            this.validator = null;
            
            console.log('🧹 TemplateRenderer cleaned up');
            
        } catch (error) {
            console.error('Error during renderer cleanup:', error);
        }
    }
}

// ===================================================================
// UTILIDADES EXPORTABLES
// ===================================================================

/**
 * Crear instancia de renderer con configuración
 */
export const createTemplateRenderer = (liquidEngine, validator, options = {}) => {
    const renderer = new TemplateRenderer(liquidEngine, validator);
    renderer.updateConfig(options);
    renderer._registerDefaultHelpers();
    return renderer;
};

/**
 * Renderizar template simple (sin instancia)
 */
export const renderTemplate = async (liquidEngine, templateContent, data = {}) => {
    const renderer = new TemplateRenderer(liquidEngine);
    return await renderer.render(templateContent, data);
};

/**
 * Validar y renderizar template
 */
export const validateAndRender = async (liquidEngine, validator, templateContent, data = {}) => {
    const renderer = new TemplateRenderer(liquidEngine, validator);
    return await renderer.render(templateContent, data, { validate: true });
};

// ===================================================================
// DEBUGGING EN DESARROLLO
// ===================================================================

if (process.env.NODE_ENV === 'development') {
    window.TemplateRenderer = TemplateRenderer;
    window.templateRendererUtils = {
        createTemplateRenderer,
        renderTemplate,
        validateAndRender
    };
    
    console.log('🔧 TemplateRenderer exposed to window for debugging');
}
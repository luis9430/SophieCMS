// ===================================================================
// plugins/alpine-methods/providers.js
// Responsabilidad: Proveedor de métodos Alpine desde BD
// ===================================================================

/**
 * Proveedor de métodos Alpine
 * Maneja la obtención y cache de métodos desde la base de datos
 */
export class MethodProvider {
    constructor(config = {}) {
        this.config = {
            apiUrl: '/api/templates/alpine-methods',
            cacheTimeout: 5 * 60 * 1000, // 5 minutos
            retryAttempts: 3,
            retryDelay: 1000,
            ...config
        };

        this.cache = new Map();
        this.lastUpdate = null;
        this.isLoading = false;
    }

    // ===================================================================
    // CARGA DE MÉTODOS
    // ===================================================================

    /**
     * Obtener todos los métodos disponibles
     */
    async getMethods(forceRefresh = false) {
        if (!forceRefresh && this.isCacheValid()) {
            return Array.from(this.cache.values());
        }

        if (this.isLoading) {
            // Si ya está cargando, esperar a que termine
            return this.waitForLoad();
        }

        return this.loadMethods();
    }

    /**
     * Cargar métodos desde la API
     */
    async loadMethods() {
        this.isLoading = true;
        let attempts = 0;

        while (attempts < this.config.retryAttempts) {
            try {
                console.log(`📥 Loading Alpine methods (attempt ${attempts + 1})`);

                const response = await this.fetchWithTimeout(
                    this.config.apiUrl,
                    { timeout: 10000 }
                );

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                const methods = this.processMethods(data.data || []);

                this.updateCache(methods);
                this.lastUpdate = Date.now();
                this.isLoading = false;

                console.log(`✅ Loaded ${methods.length} Alpine methods`);
                return methods;

            } catch (error) {
                attempts++;
                console.warn(`⚠️ Attempt ${attempts} failed:`, error.message);

                if (attempts >= this.config.retryAttempts) {
                    this.isLoading = false;
                    console.error('❌ Failed to load Alpine methods after all attempts');
                    
                    // Devolver cache si existe, aunque esté expirado
                    if (this.cache.size > 0) {
                        console.log('📦 Using cached methods as fallback');
                        return Array.from(this.cache.values());
                    }
                    
                    throw error;
                }

                // Esperar antes del siguiente intento
                await this.delay(this.config.retryDelay * attempts);
            }
        }
    }

    /**
     * Procesar métodos raw de la API
     */
    processMethods(rawMethods) {
        return rawMethods
            .filter(method => method.is_active && method.trigger_syntax)
            .map(method => this.processMethod(method));
    }

    /**
     * Procesar un método individual
     */
    processMethod(rawMethod) {
        return {
            id: rawMethod.id,
            name: rawMethod.name,
            trigger: rawMethod.trigger_syntax,
            description: rawMethod.description || '',
            category: rawMethod.category || 'general',
            
            // Template y configuración
            template: rawMethod.method_template || '',
            parameters: this.processParameters(rawMethod.method_parameters),
            config: rawMethod.method_config || {},
            
            // Metadatos
            usageCount: rawMethod.usage_count || 0,
            lastUsed: rawMethod.last_used_at,
            isGlobal: rawMethod.is_global || false,
            
            // Para preview
            content: rawMethod.content || '',
            
            // Timestamps
            createdAt: rawMethod.created_at,
            updatedAt: rawMethod.updated_at
        };
    }

    /**
     * Procesar parámetros del método
     */
    processParameters(rawParameters) {
        if (!rawParameters || typeof rawParameters !== 'object') {
            return {};
        }

        const processed = {};
        
        Object.entries(rawParameters).forEach(([key, param]) => {
            processed[key] = {
                type: param.type || 'string',
                default: param.default,
                description: param.description || '',
                required: param.required || false,
                validation: param.validation || {},
                ...param
            };
        });

        return processed;
    }

    // ===================================================================
    // GESTIÓN DE CACHE
    // ===================================================================

    /**
     * Actualizar cache con nuevos métodos
     */
    updateCache(methods) {
        this.cache.clear();
        
        methods.forEach(method => {
            this.cache.set(method.trigger, method);
        });
    }

    /**
     * Verificar si el cache es válido
     */
    isCacheValid() {
        if (!this.lastUpdate || this.cache.size === 0) {
            return false;
        }

        const age = Date.now() - this.lastUpdate;
        return age < this.config.cacheTimeout;
    }

    /**
     * Invalidar cache
     */
    invalidateCache() {
        this.lastUpdate = null;
        console.log('♻️ Alpine methods cache invalidated');
    }

    // ===================================================================
    // BÚSQUEDA Y FILTRADO
    // ===================================================================

    /**
     * Obtener método por trigger
     */
    async getMethod(trigger) {
        const methods = await this.getMethods();
        return methods.find(method => method.trigger === trigger);
    }

    /**
     * Buscar métodos por término
     */
    async searchMethods(searchTerm, options = {}) {
        const methods = await this.getMethods();
        
        if (!searchTerm) {
            return this.filterMethods(methods, options);
        }

        const term = searchTerm.toLowerCase();
        const filtered = methods.filter(method => 
            method.name.toLowerCase().includes(term) ||
            method.description.toLowerCase().includes(term) ||
            method.trigger.toLowerCase().includes(term) ||
            method.category.toLowerCase().includes(term)
        );

        return this.filterMethods(filtered, options);
    }

    /**
     * Filtrar métodos por opciones
     */
    filterMethods(methods, options = {}) {
        let filtered = [...methods];

        // Filtrar por categoría
        if (options.category) {
            filtered = filtered.filter(method => method.category === options.category);
        }

        // Filtrar por disponibilidad global
        if (options.globalOnly) {
            filtered = filtered.filter(method => method.isGlobal);
        }

        // Ordenar
        if (options.sortBy) {
            filtered.sort((a, b) => {
                const aVal = a[options.sortBy];
                const bVal = b[options.sortBy];
                
                if (options.sortOrder === 'desc') {
                    return bVal > aVal ? 1 : -1;
                }
                return aVal > bVal ? 1 : -1;
            });
        }

        // Limitar resultados
        if (options.limit) {
            filtered = filtered.slice(0, options.limit);
        }

        return filtered;
    }

    /**
     * Obtener categorías disponibles
     */
    async getCategories() {
        const methods = await this.getMethods();
        const categories = new Set(methods.map(method => method.category));
        return Array.from(categories).sort();
    }

    // ===================================================================
    // ESTADÍSTICAS Y MÉTRICAS
    // ===================================================================

    /**
     * Obtener estadísticas de uso
     */
    async getUsageStats() {
        const methods = await this.getMethods();
        
        const stats = {
            total: methods.length,
            byCategory: {},
            mostUsed: [],
            leastUsed: [],
            totalUsage: 0,
            globalMethods: 0
        };

        methods.forEach(method => {
            // Por categoría
            stats.byCategory[method.category] = (stats.byCategory[method.category] || 0) + 1;
            
            // Uso total
            stats.totalUsage += method.usageCount;
            
            // Métodos globales
            if (method.isGlobal) {
                stats.globalMethods++;
            }
        });

        // Más usados
        stats.mostUsed = methods
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, 5)
            .map(method => ({
                trigger: method.trigger,
                name: method.name,
                usage: method.usageCount
            }));

        // Menos usados
        stats.leastUsed = methods
            .filter(method => method.usageCount > 0)
            .sort((a, b) => a.usageCount - b.usageCount)
            .slice(0, 5)
            .map(method => ({
                trigger: method.trigger,
                name: method.name,
                usage: method.usageCount
            }));

        return stats;
    }

    // ===================================================================
    // UTILIDADES
    // ===================================================================

    /**
     * Fetch con timeout
     */
    async fetchWithTimeout(url, options = {}) {
        const { timeout = 5000 } = options;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...options.headers
                }
            });

            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    /**
     * Esperar un tiempo determinado
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Esperar a que termine la carga actual
     */
    async waitForLoad() {
        while (this.isLoading) {
            await this.delay(100);
        }
        return Array.from(this.cache.values());
    }

    // ===================================================================
    // DEBUG Y DESARROLLO
    // ===================================================================

    /**
     * Obtener información de debug
     */
    getDebugInfo() {
        return {
            config: this.config,
            cacheSize: this.cache.size,
            lastUpdate: this.lastUpdate ? new Date(this.lastUpdate).toISOString() : null,
            cacheAge: this.lastUpdate ? Date.now() - this.lastUpdate : null,
            isLoading: this.isLoading,
            cacheValid: this.isCacheValid()
        };
    }
}
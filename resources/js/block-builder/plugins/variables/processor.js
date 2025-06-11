// ===================================================================
// plugins/variables/processor.js
// Responsabilidad: Procesador unificado de variables
// ===================================================================

/**
 * Procesador unificado de variables que trabaja con múltiples providers
 */
export class VariableProcessor {
    constructor(options = {}) {
        this.providers = options.providers || new Map();
        this.cache = options.cache || new Map();
        this.config = {
            cacheEnabled: true,
            maxCacheSize: 1000,
            cacheTimeout: 300000, // 5 minutos
            strictMode: false,
            defaultValue: '',
            ...options.config
        };
        
        // Estadísticas para debugging
        this.stats = {
            cacheHits: 0,
            cacheMisses: 0,
            processedCount: 0,
            lastProcessed: null
        };
        
        console.log('🎯 VariableProcessor initialized');
    }

    // ===================================================================
    // PROCESAMIENTO PRINCIPAL
    // ===================================================================

    /**
     * Procesar código HTML reemplazando variables
     * @param {string} htmlCode - Código HTML con variables {{ variable }}
     * @returns {string} HTML procesado
     */
    processCode(htmlCode) {
        if (!htmlCode || typeof htmlCode !== 'string') {
            return htmlCode || '';
        }
        
        // Optimización: si no hay variables, retornar inmediatamente
        if (!htmlCode.includes('{{')) {
            return htmlCode;
        }

        try {
            let processedCode = htmlCode;
            const allVariables = this.getAllVariables();
            
            // Usar cache si está habilitado
            const cacheKey = this._getCacheKey(htmlCode);
            if (this.config.cacheEnabled && this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (this._isCacheValid(cached)) {
                    this.stats.cacheHits++;
                    return cached.result;
                }
                this.cache.delete(cacheKey);
            }
            
            this.stats.cacheMisses++;

            // Procesar cada categoría de variables por prioridad
            const sortedCategories = this._getSortedCategories();
            
            for (const [categoryKey, provider] of sortedCategories) {
                const variables = provider.getVariables();
                
                Object.entries(variables).forEach(([path, value]) => {
                    const regex = this._createVariableRegex(path);
                    const replacement = this._formatValue(value);
                    processedCode = processedCode.replace(regex, replacement);
                });
            }

            // Validar variables no encontradas en modo estricto
            if (this.config.strictMode) {
                const remainingVars = this.extractVariables(processedCode);
                if (remainingVars.length > 0) {
                    console.warn('🚨 Unresolved variables in strict mode:', remainingVars);
                    
                    // Reemplazar con placeholder de error
                    remainingVars.forEach(variable => {
                        const regex = this._createVariableRegex(variable);
                        processedCode = processedCode.replace(regex, `[ERROR: ${variable}]`);
                    });
                }
            } else {
                // En modo no estricto, reemplazar con valor por defecto
                const remainingVars = this.extractVariables(processedCode);
                remainingVars.forEach(variable => {
                    const regex = this._createVariableRegex(variable);
                    processedCode = processedCode.replace(regex, this.config.defaultValue);
                });
            }

            // Guardar en cache
            if (this.config.cacheEnabled) {
                this._saveToCache(cacheKey, processedCode);
            }

            // Actualizar estadísticas
            this.stats.processedCount++;
            this.stats.lastProcessed = new Date().toISOString();

            return processedCode;
            
        } catch (error) {
            console.error('❌ Error processing variables:', error);
            return htmlCode; // Fallback al código original
        }
    }

    /**
     * Obtener todas las variables de todos los providers
     * @returns {Object} Variables organizadas por categoría
     */
    getAllVariables() {
        const allVariables = {};
        
        // Obtener variables de cada provider ordenados por prioridad
        const sortedProviders = this._getSortedProviders();
        
        for (const [name, provider] of sortedProviders) {
            try {
                const variables = provider.getVariables();
                
                allVariables[name] = {
                    title: provider.title,
                    description: provider.description,
                    category: provider.category,
                    priority: provider.priority,
                    variables: variables,
                    lastUpdated: provider.lastUpdated
                };
                
            } catch (error) {
                console.error(`❌ Error getting variables from provider ${name}:`, error);
                // Continuar con otros providers
            }
        }
        
        return allVariables;
    }

    /**
     * Obtener valor de variable específica
     * @param {string} variablePath - Path de la variable
     * @returns {any} Valor de la variable o null
     */
    getVariableValue(variablePath) {
        if (!variablePath || typeof variablePath !== 'string') {
            return null;
        }

        // Buscar en providers ordenados por prioridad
        const sortedProviders = this._getSortedProviders();
        
        for (const [name, provider] of sortedProviders) {
            try {
                if (provider.hasVariable(variablePath)) {
                    return provider.getVariable(variablePath);
                }
            } catch (error) {
                console.error(`❌ Error getting variable ${variablePath} from ${name}:`, error);
                continue;
            }
        }
        
        return null;
    }

    /**
     * Validar si una variable existe
     * @param {string} variablePath - Path de la variable
     * @returns {boolean} True si existe
     */
    validateVariable(variablePath) {
        return this.getVariableValue(variablePath) !== null;
    }

    /**
     * Extraer variables de código HTML
     * @param {string} htmlCode - Código HTML
     * @returns {Array} Array de variables encontradas
     */
    extractVariables(htmlCode) {
        if (!htmlCode || typeof htmlCode !== 'string') {
            return [];
        }
        
        const variablePattern = /\{\{\s*([^}]+)\s*\}\}/g;
        const variables = [];
        let match;
        
        while ((match = variablePattern.exec(htmlCode)) !== null) {
            const variableName = match[1].trim();
            if (!variables.includes(variableName)) {
                variables.push(variableName);
            }
        }
        
        return variables;
    }

    /**
     * Encontrar variables inválidas
     * @param {string} htmlCode - Código HTML
     * @returns {Array} Variables que no existen
     */
    findInvalidVariables(htmlCode) {
        const usedVariables = this.extractVariables(htmlCode);
        const invalidVariables = [];
        
        usedVariables.forEach(variable => {
            if (!this.validateVariable(variable)) {
                invalidVariables.push(variable);
            }
        });
        
        return invalidVariables;
    }

    /**
     * Encontrar variables similares para sugerencias
     * @param {string} variablePath - Variable a buscar
     * @returns {Array} Variables similares
     */
    getSimilarVariables(variablePath) {
        const allVars = [];
        
        // Recopilar todas las variables disponibles
        for (const [name, provider] of this.providers.entries()) {
            try {
                const variables = provider.getVariables();
                allVars.push(...Object.keys(variables));
            } catch (error) {
                console.error(`Error getting variables from ${name}:`, error);
            }
        }
        
        // Encontrar similares usando distancia de Levenshtein
        const similar = allVars
            .filter(variable => this._calculateDistance(variablePath, variable) <= 3)
            .sort((a, b) => this._calculateDistance(variablePath, a) - this._calculateDistance(variablePath, b))
            .slice(0, 5);
        
        return similar;
    }

    // ===================================================================
    // GESTIÓN DE PROVIDERS
    // ===================================================================

    /**
     * Añadir provider
     */
    addProvider(name, provider) {
        this.providers.set(name, provider);
        this._clearCache();
        console.log(`📦 Provider added to processor: ${name}`);
    }

    /**
     * Remover provider
     */
    removeProvider(name) {
        const removed = this.providers.delete(name);
        if (removed) {
            this._clearCache();
            console.log(`📦 Provider removed from processor: ${name}`);
        }
        return removed;
    }

    /**
     * Obtener provider
     */
    getProvider(name) {
        return this.providers.get(name) || null;
    }

    // ===================================================================
    // CONFIGURACIÓN Y CACHE
    // ===================================================================

    /**
     * Actualizar configuración
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Si se deshabilitó el cache, limpiarlo
        if (!this.config.cacheEnabled) {
            this._clearCache();
        }
        
        console.log('⚙️ VariableProcessor config updated');
    }

    /**
     * Limpiar cache
     */
    clearCache() {
        this._clearCache();
        console.log('🧹 Variable processor cache cleared');
    }

    /**
     * Obtener estadísticas
     */
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.cache.size,
            providerCount: this.providers.size,
            cacheHitRatio: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) || 0
        };
    }

    // ===================================================================
    // MÉTODOS PRIVADOS
    // ===================================================================

    /**
     * Crear regex para variable específica
     * @private
     */
    _createVariableRegex(variablePath) {
        const escapedPath = variablePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`\\{\\{\\s*${escapedPath}\\s*\\}\\}`, 'g');
    }

    /**
     * Formatear valor para reemplazo
     * @private
     */
    _formatValue(value) {
        if (value === null || value === undefined) {
            return this.config.defaultValue;
        }
        
        if (typeof value === 'object') {
            try {
                return JSON.stringify(value);
            } catch (error) {
                return '[Object]';
            }
        }
        
        return String(value);
    }

    /**
     * Obtener providers ordenados por prioridad
     * @private
     */
    _getSortedProviders() {
        return Array.from(this.providers.entries())
            .sort(([, a], [, b]) => (b.priority || 50) - (a.priority || 50));
    }

    /**
     * Obtener categorías ordenadas por prioridad
     * @private
     */
    _getSortedCategories() {
        return this._getSortedProviders();
    }

    /**
     * Generar clave de cache
     * @private
     */
    _getCacheKey(htmlCode) {
        // Hash simple del código
        let hash = 0;
        for (let i = 0; i < htmlCode.length; i++) {
            const char = htmlCode.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convertir a 32bit integer
        }
        return `var_${Math.abs(hash)}`;
    }

    /**
     * Verificar si cache es válido
     * @private
     */
    _isCacheValid(cached) {
        const now = Date.now();
        const age = now - cached.timestamp;
        return age < this.config.cacheTimeout;
    }

    /**
     * Guardar en cache
     * @private
     */
    _saveToCache(key, result) {
        // Verificar límite de cache
        if (this.cache.size >= this.config.maxCacheSize) {
            // Remover entrada más antigua
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
        
        this.cache.set(key, {
            result,
            timestamp: Date.now()
        });
    }

    /**
     * Limpiar cache
     * @private
     */
    _clearCache() {
        this.cache.clear();
        this.stats.cacheHits = 0;
        this.stats.cacheMisses = 0;
    }

    /**
     * Calcular distancia de Levenshtein
     * @private
     */
    _calculateDistance(str1, str2) {
        if (str1.length === 0) return str2.length;
        if (str2.length === 0) return str1.length;
        
        const matrix = Array(str2.length + 1).fill(null).map(() => 
            Array(str1.length + 1).fill(null)
        );
        
        for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
        
        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,     // deletion
                    matrix[j - 1][i] + 1,     // insertion
                    matrix[j - 1][i - 1] + cost // substitution
                );
            }
        }
        
        return matrix[str2.length][str1.length];
    }
}

// ===================================================================
// CLASE PARA ANÁLISIS AVANZADO
// ===================================================================

export class VariableAnalyzer {
    constructor(processor) {
        this.processor = processor;
    }

    /**
     * Analizar uso de variables en código
     */
    analyzeCode(htmlCode) {
        const analysis = {
            totalVariables: 0,
            validVariables: 0,
            invalidVariables: 0,
            variablesByProvider: {},
            unusedProviders: [],
            recommendations: [],
            complexity: 0
        };

        try {
            const usedVariables = this.processor.extractVariables(htmlCode);
            const invalidVariables = this.processor.findInvalidVariables(htmlCode);
            const validVariables = usedVariables.filter(v => !invalidVariables.includes(v));

            analysis.totalVariables = usedVariables.length;
            analysis.validVariables = validVariables.length;
            analysis.invalidVariables = invalidVariables.length;

            // Analizar por provider
            for (const [name, provider] of this.processor.providers.entries()) {
                const providerVars = provider.getVariables();
                const usedFromProvider = validVariables.filter(v => providerVars.hasOwnProperty(v));
                
                if (usedFromProvider.length > 0) {
                    analysis.variablesByProvider[name] = {
                        title: provider.title,
                        used: usedFromProvider.length,
                        available: Object.keys(providerVars).length,
                        variables: usedFromProvider,
                        coverage: Math.round((usedFromProvider.length / Object.keys(providerVars).length) * 100)
                    };
                } else {
                    analysis.unusedProviders.push(name);
                }
            }

            // Calcular complejidad
            analysis.complexity = this._calculateComplexity(analysis);

            // Generar recomendaciones
            analysis.recommendations = this._generateRecommendations(analysis, invalidVariables);

        } catch (error) {
            console.error('Error analyzing variables:', error);
        }

        return analysis;
    }

    /**
     * Obtener métricas de rendimiento
     */
    getPerformanceMetrics() {
        const stats = this.processor.getStats();
        
        return {
            ...stats,
            efficiency: stats.cacheHitRatio,
            averageProcessingTime: this._estimateProcessingTime(),
            memoryUsage: this._estimateMemoryUsage()
        };
    }

    /**
     * Calcular complejidad del código
     * @private
     */
    _calculateComplexity(analysis) {
        let complexity = 0;
        
        complexity += analysis.totalVariables * 2;
        complexity += analysis.invalidVariables * 5; // Penalizar variables inválidas
        complexity += Object.keys(analysis.variablesByProvider).length * 3;
        
        return complexity;
    }

    /**
     * Generar recomendaciones
     * @private
     */
    _generateRecommendations(analysis, invalidVariables) {
        const recommendations = [];

        if (analysis.totalVariables === 0) {
            recommendations.push({
                type: 'usage',
                message: 'Considera usar variables para hacer tu contenido dinámico',
                priority: 'medium'
            });
        }

        if (analysis.invalidVariables > 0) {
            recommendations.push({
                type: 'error',
                message: `Corrige ${analysis.invalidVariables} variable(s) inválida(s)`,
                priority: 'high',
                details: invalidVariables.map(v => ({
                    variable: v,
                    suggestions: this.processor.getSimilarVariables(v)
                }))
            });
        }

        if (analysis.unusedProviders.length > 0) {
            recommendations.push({
                type: 'optimization',
                message: `Explora variables de ${analysis.unusedProviders.length} provider(s) no utilizados`,
                priority: 'low',
                details: analysis.unusedProviders
            });
        }

        if (analysis.complexity > 50) {
            recommendations.push({
                type: 'complexity',
                message: 'Código complejo: considera modularizar o simplificar',
                priority: 'medium'
            });
        }

        return recommendations;
    }

    /**
     * Estimar tiempo de procesamiento
     * @private
     */
    _estimateProcessingTime() {
        // Implementación básica - en producción sería más sofisticada
        const stats = this.processor.getStats();
        return stats.processedCount > 0 ? 'Fast' : 'Unknown';
    }

    /**
     * Estimar uso de memoria
     * @private
     */
    _estimateMemoryUsage() {
        try {
            // Estimar tamaño de providers y cache
            const providersSize = JSON.stringify(Array.from(this.processor.providers.entries())).length;
            const cacheSize = this.processor.cache.size * 100; // Estimación aproximada
            
            return {
                providers: `${Math.round(providersSize / 1024)}KB`,
                cache: `${Math.round(cacheSize / 1024)}KB`,
                total: `${Math.round((providersSize + cacheSize) / 1024)}KB`
            };
        } catch (error) {
            return { total: 'Unknown' };
        }
    }
}

// ===================================================================
// DEBUGGING EN DESARROLLO
// ===================================================================

if (process.env.NODE_ENV === 'development') {
    window.VariableProcessor = VariableProcessor;
    window.VariableAnalyzer = VariableAnalyzer;
    
    console.log('🔧 VariableProcessor exposed to window for debugging');
}
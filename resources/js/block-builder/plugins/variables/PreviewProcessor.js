// ===================================================================
// resources/js/block-builder/plugins/variables/PreviewProcessor.js
// CORREGIDO: Manejo adecuado de variables de BD y objetos complejos
// ===================================================================

export class VariablesPreviewProcessor {
    constructor(variablesPlugin) {
        this.plugin = variablesPlugin;
        this.cache = new Map();
        this.lastCacheUpdate = null;
        this.cacheTimeout = 30000; // 30 segundos
        this.listeners = [];
        
        // Escuchar cambios en variables
        this.setupVariableListeners();
        
        console.log('🎯 Variables Preview Processor initialized');
    }

    /**
     * Procesar contenido para preview con cache inteligente
     */
    async processContentForPreview(content, forceRefresh = false) {
        try {
            const cacheKey = this.generateCacheKey(content);
            
            // Verificar cache si no es refresh forzado
            if (!forceRefresh && this.isCacheValid(cacheKey)) {
                console.log('📦 Using cached processed content');
                return this.cache.get(cacheKey);
            }

            console.log('🔄 Processing content with fresh variables...');
            
            // Obtener variables actualizadas y normalizadas
            const allVariables = await this.getUpdatedVariables();
            
            // Procesar el contenido
            const processedContent = this.replaceVariables(content, allVariables);
            
            // Guardar en cache
            this.cache.set(cacheKey, {
                content: processedContent,
                timestamp: Date.now(),
                variables: allVariables
            });
            
            console.log('✅ Content processed and cached');
            return processedContent;
            
        } catch (error) {
            console.error('❌ Error processing content for preview:', error);
            return content; // Fallback al contenido original
        }
    }

    /**
     * Obtener variables actualizadas de todos los providers
     * CORREGIDO: Manejo adecuado de variables de BD
     */
    async getUpdatedVariables() {
        const allVariables = {};
        
        if (!this.plugin.processor) {
            console.warn('⚠️ Variables processor not available');
            return allVariables;
        }

        // Refrescar providers si es necesario
        await this.refreshProvidersIfNeeded();
        
        // Obtener variables de todos los providers
        for (const [name, provider] of this.plugin.processor.providers.entries()) {
            try {
                const variables = await provider.getVariables();
                
                if (variables && typeof variables === 'object') {
                    // Normalizar variables de BD que vienen en formato especial
                    const normalizedVariables = this.normalizeVariables(variables, name);
                    Object.assign(allVariables, normalizedVariables);
                    
                    console.log(`📦 Loaded ${Object.keys(normalizedVariables).length} variables from ${name}`);
                }
            } catch (error) {
                console.error(`❌ Error loading variables from ${name}:`, error);
            }
        }
        
        console.log('🎯 Total variables loaded:', Object.keys(allVariables).length);
        return allVariables;
    }

    /**
     * NUEVO: Normalizar variables de diferentes providers
     */
    normalizeVariables(variables, providerName) {
        const normalized = {};
        
        Object.entries(variables).forEach(([key, value]) => {
            // Detectar si viene de BD (formato especial con metadata)
            if (providerName === 'database' && value && typeof value === 'object' && value.value !== undefined) {
                // Variables de BD vienen como: { value: "actual_value", type: "static", category: "site" }
                normalized[key] = this.extractVariableValue(value);
                console.log(`🔧 Normalized DB variable ${key}:`, normalized[key]);
            } else {
                // Variables de otros providers (system, user, etc.)
                normalized[key] = this.extractVariableValue(value);
            }
        });
        
        return normalized;
    }

    /**
     * NUEVO: Extraer valor real de variables complejas
     */
    extractVariableValue(value) {
        // Si es un objeto con propiedad 'value', extraer esa propiedad
        if (value && typeof value === 'object' && value.hasOwnProperty('value')) {
            return this.convertToString(value.value);
        }
        
        // Si es un objeto plano, intentar JSON string
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            // Verificar si es un objeto "real" o solo metadatos
            const keys = Object.keys(value);
            if (keys.includes('type') && keys.includes('category') && keys.includes('value')) {
                // Es metadatos de BD, usar solo el valor
                return this.convertToString(value.value);
            }
            
            // Es un objeto complejo, convertir a JSON legible
            try {
                return JSON.stringify(value, null, 2);
            } catch (error) {
                return '[Complex Object]';
            }
        }
        
        // Para valores primitivos
        return this.convertToString(value);
    }

    /**
     * NUEVO: Convertir cualquier valor a string de forma segura
     */
    convertToString(value) {
        if (value === null) return '';
        if (value === undefined) return '';
        if (typeof value === 'string') return value;
        if (typeof value === 'number') return String(value);
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        if (Array.isArray(value)) {
            return value.map(item => this.convertToString(item)).join(', ');
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
     * Refrescar providers si han pasado más de 30 segundos
     */
    async refreshProvidersIfNeeded() {
        const now = Date.now();
        const shouldRefresh = !this.lastCacheUpdate || 
                            (now - this.lastCacheUpdate) > this.cacheTimeout;
        
        if (shouldRefresh) {
            console.log('🔄 Refreshing variable providers...');
            
            // Refrescar DatabaseProvider específicamente
            const dbProvider = this.plugin.processor.getProvider('database');
            if (dbProvider && dbProvider.refresh) {
                await dbProvider.refresh();
            }
            
            // Refrescar SystemProvider para datos dinámicos
            const systemProvider = this.plugin.processor.getProvider('system');
            if (systemProvider && systemProvider.refresh) {
                await systemProvider.refresh();
            }
            
            this.lastCacheUpdate = now;
        }
    }

    /**
     * Reemplazar variables en el contenido
     * MEJORADO: Mejor logging y manejo de errores
     */
    replaceVariables(content, variables) {
        let processed = content;
        let replacementCount = 0;
        
        // Procesar variables con sintaxis {{variable.path}}
        Object.entries(variables).forEach(([key, value]) => {
            // Escapar puntos para regex
            const escapedKey = key.replace(/\./g, '\\.');
            
            // Diferentes patrones de variables
            const patterns = [
                new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, 'g'),           // {{site.name}}
                new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\|\\s*[^}]*\\}\\}`, 'g'), // {{site.name | default: "Test"}}
                new RegExp(`\\$\\{\\s*${escapedKey}\\s*\\}`, 'g')               // ${site.name}
            ];
            
            patterns.forEach(pattern => {
                const matches = processed.match(pattern);
                if (matches) {
                    processed = processed.replace(pattern, (match) => {
                        const stringValue = this.convertToString(value);
                        console.log(`🔄 Replacing ${match} with "${stringValue}" (from ${key})`);
                        replacementCount++;
                        return stringValue;
                    });
                }
            });
        });
        
        console.log(`✅ Completed ${replacementCount} variable replacements`);
        return processed;
    }

    /**
     * Generar clave de cache basada en el contenido
     */
    generateCacheKey(content) {
        // Hash simple del contenido
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return `content_${Math.abs(hash)}`;
    }

    /**
     * Verificar si el cache es válido
     */
    isCacheValid(cacheKey) {
        const cached = this.cache.get(cacheKey);
        if (!cached) return false;
        
        const age = Date.now() - cached.timestamp;
        return age < this.cacheTimeout;
    }

    /**
     * Configurar listeners para cambios en variables
     */
    setupVariableListeners() {
        // Listener para cambios en variables
        if (this.plugin._addVariableChangeListener) {
            this.plugin._addVariableChangeListener((event, data) => {
                console.log(`📡 Variable event: ${event}`, data);
                this.invalidateCache();
                this.notifyListeners(event, data);
            });
        }
        
        // Listener para refresh de providers
        window.addEventListener('variableProviderRefreshed', (event) => {
            console.log('📡 Provider refreshed:', event.detail);
            this.invalidateCache();
        });
    }

    /**
     * Invalidar cache cuando hay cambios
     */
    invalidateCache() {
        console.log('🗑️ Invalidating variables cache');
        this.cache.clear();
        this.lastCacheUpdate = null;
    }

    /**
     * Agregar listener para cambios
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * Notificar a listeners sobre cambios
     */
    notifyListeners(event, data) {
        this.listeners.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Error in preview listener:', error);
            }
        });
    }

    /**
     * Forzar actualización de preview
     */
    async forceRefresh() {
        console.log('🔄 Forcing variables refresh for preview...');
        this.invalidateCache();
        
        // Refrescar DatabaseProvider
        const dbProvider = this.plugin.processor.getProvider('database');
        if (dbProvider) {
            dbProvider.lastFetch = null; // Forzar nueva carga
            await dbProvider.refresh();
        }
        
        // Emitir evento para que el preview se actualice
        window.dispatchEvent(new CustomEvent('variablesForceRefresh', {
            detail: { timestamp: Date.now() }
        }));
    }

    /**
     * Cleanup
     */
    cleanup() {
        this.cache.clear();
        this.listeners = [];
        console.log('🧹 Variables Preview Processor cleaned up');
    }
}

// ===================================================================
// Función utilitaria para debugging MEJORADA
// ===================================================================

export const createVariablesDebugger = (processor) => {
    return {
        showCache() {
            console.log('📦 Preview Cache:');
            processor.cache.forEach((value, key) => {
                console.log(`${key}:`, {
                    age: Date.now() - value.timestamp,
                    variables: Object.keys(value.variables).length,
                    contentLength: value.content.length
                });
            });
        },
        
        async testVariables() {
            const variables = await processor.getUpdatedVariables();
            console.log('🎯 Current variables:', variables);
            return variables;
        },
        
        async testDatabaseVariables() {
            const dbProvider = processor.plugin.processor.getProvider('database');
            if (dbProvider) {
                const raw = await dbProvider.getVariables();
                console.log('💾 Raw database variables:', raw);
                
                const normalized = processor.normalizeVariables(raw, 'database');
                console.log('🔧 Normalized database variables:', normalized);
                
                return { raw, normalized };
            }
            console.warn('❌ Database provider not found');
        },
        
        testVariableConversion(value) {
            const converted = processor.extractVariableValue(value);
            console.log('Input:', value);
            console.log('Output:', converted);
            return converted;
        },
        
        invalidateCache() {
            processor.invalidateCache();
            console.log('🗑️ Cache invalidated');
        },
        
        async forceRefresh() {
            await processor.forceRefresh();
            console.log('🔄 Force refresh completed');
        }
    };
};

export default VariablesPreviewProcessor;
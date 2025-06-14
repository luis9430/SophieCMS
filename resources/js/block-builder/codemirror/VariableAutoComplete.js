// ===================================================================
// SOLUCIÓN PARA EL AUTOCOMPLETADO DE VARIABLES EN CODEMIRROR
// Archivo: resources/js/block-builder/codemirror/VariableAutoComplete.js
// ===================================================================

import { autocompletion } from '@codemirror/autocomplete';
import { Decoration } from '@codemirror/view';

/**
 * Sistema de autocompletado mejorado para variables
 */
export class VariableAutoCompleteSystem {
    constructor() {
        this.cachedVariables = new Map();
        this.lastCacheTime = 0;
        this.cacheTimeout = 30000; // 30 segundos
        this.debug = true;
    }

    /**
     * Obtener variables del plugin con cache inteligente
     */
    async getVariables() {
        const now = Date.now();
        
        // Verificar cache
        if (this.cachedVariables.size > 0 && (now - this.lastCacheTime) < this.cacheTimeout) {
            if (this.debug) console.log('💾 Using cached variables for autocomplete');
            return this.cachedVariables;
        }

        // Obtener variables frescas
        const variablesPlugin = window.pluginManager?.get('variables');
        if (!variablesPlugin) {
            console.warn('⚠️ Variables plugin not found for autocomplete');
            return new Map();
        }

        try {
            const allVariables = variablesPlugin.getAllVariables();
            const processedVariables = new Map();

            // Procesar variables por provider
            Object.entries(allVariables).forEach(([providerKey, providerData]) => {
                const variables = providerData.variables || {};
                const metadata = providerData.metadata || {};
                
                Object.entries(variables).forEach(([key, value]) => {
                    processedVariables.set(key, {
                        key,
                        value,
                        provider: providerKey,
                        title: metadata.title || providerKey,
                        priority: metadata.priority || 50,
                        type: this.determineVariableType(value)
                    });
                });
            });

            this.cachedVariables = processedVariables;
            this.lastCacheTime = now;
            
            if (this.debug) {
                console.log(`✅ Cached ${processedVariables.size} variables for autocomplete`);
            }
            
            return processedVariables;
        } catch (error) {
            console.error('❌ Error getting variables for autocomplete:', error);
            return this.cachedVariables; // Fallback al cache
        }
    }

    /**
     * Determinar el tipo de variable
     */
    determineVariableType(value) {
        if (typeof value === 'string') return 'text';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object') return 'object';
        return 'unknown';
    }

    /**
     * Formatear valor para mostrar en el autocompletado
     */
    formatValue(value, maxLength = 50) {
        if (value === null || value === undefined) return 'null';
        
        let formatted = String(value);
        if (formatted.length > maxLength) {
            formatted = formatted.substring(0, maxLength - 3) + '...';
        }
        
        return formatted;
    }

    /**
     * Función principal de autocompletado
     */
    async getCompletions(context) {
        try {
            // Detectar contexto de variable
            const beforeCursor = context.state.doc.sliceString(
                Math.max(0, context.pos - 50), 
                context.pos
            );
            
            // Buscar patrones de variables: {{ variable }}
            const variableMatch = beforeCursor.match(/\{\{[\w\s.]*$/);
            if (!variableMatch) return null;

            const variables = await this.getVariables();
            if (variables.size === 0) return null;

            // Extraer término de búsqueda
            const searchTerm = variableMatch[0].replace('{{', '').trim().toLowerCase();
            
            // Filtrar y ordenar variables
            const completions = [];
            
            for (const [key, varData] of variables) {
                if (key.toLowerCase().includes(searchTerm) || searchTerm === '') {
                    completions.push({
                        label: key,
                        type: 'variable',
                        info: `${varData.title}: ${varData.type}`,
                        detail: this.formatValue(varData.value),
                        apply: (view, completion, from, to) => {
                            // Calcular posición correcta
                            const insertFrom = from - variableMatch[0].length + 2; // +2 para saltar {{
                            const insertText = `${key}}}`;
                            
                            view.dispatch({
                                changes: { 
                                    from: insertFrom, 
                                    to, 
                                    insert: insertText 
                                }
                            });
                        },
                        boost: varData.priority,
                        section: {
                            name: varData.title,
                            rank: varData.priority
                        }
                    });
                }
            }

            // Limitar resultados
            const maxResults = 15;
            const sortedCompletions = completions
                .sort((a, b) => b.boost - a.boost)
                .slice(0, maxResults);

            if (sortedCompletions.length === 0) return null;

            return {
                from: context.pos - variableMatch[0].length + 2,
                options: sortedCompletions,
                validFor: /^[\w.]*$/
            };

        } catch (error) {
            console.error('❌ Error in variable autocomplete:', error);
            return null;
        }
    }

    /**
     * Invalidar cache
     */
    invalidateCache() {
        this.cachedVariables.clear();
        this.lastCacheTime = 0;
        if (this.debug) console.log('🗑️ Variable autocomplete cache invalidated');
    }
}

// Instancia global del sistema

// Instancia global del sistema
const autoCompleteSystem = new VariableAutoCompleteSystem();

/**
 * Función de autocompletado para CodeMirror
 */
export const variableCompletionSource = async (context) => {
    return await autoCompleteSystem.getCompletions(context);
};

/**
 * Extensión completa de autocompletado de variables
 */
export const createVariableAutoComplete = () => {
    return autocompletion({
        override: [variableCompletionSource],
        maxOptions: 15,
        activateOnTyping: true,
        closeOnBlur: true
    });
};

/**
 * Crear tooltip para variables (para compatibilidad con FinalVisualEditor)
 */
export const createVariableTooltip = (variableKey) => {
    const variablesPlugin = window.pluginManager?.get('variables');
    if (!variablesPlugin) {
        return null;
    }

    try {
        const allVariables = variablesPlugin.getAllVariables();
        let foundVariable = null;
        let providerInfo = null;

        // Buscar la variable en todos los providers
        for (const [providerKey, providerData] of Object.entries(allVariables)) {
            if (providerData.variables && providerData.variables[variableKey]) {
                foundVariable = providerData.variables[variableKey];
                providerInfo = {
                    key: providerKey,
                    title: providerData.metadata?.title || providerKey
                };
                break;
            }
        }

        if (!foundVariable) {
            const tooltip = document.createElement('div');
            tooltip.className = 'cm-tooltip-variable error';
            tooltip.innerHTML = `
                <div class="variable-tooltip-header">
                    <span class="variable-icon">⚠️</span>
                    <strong>Variable no encontrada</strong>
                </div>
                <div class="variable-tooltip-content">
                    <code>{{${variableKey}}}</code>
                    <p>Esta variable no está definida</p>
                </div>
            `;
            return tooltip;
        }

        const tooltip = document.createElement('div');
        tooltip.className = 'cm-tooltip-variable';
        tooltip.innerHTML = `
            <div class="variable-tooltip-header">
                <span class="variable-icon">🔧</span>
                <strong>${variableKey}</strong>
            </div>
            <div class="variable-tooltip-content">
                <div class="variable-provider">📦 ${providerInfo.title}</div>
                <div class="variable-value">
                    <strong>Valor:</strong>
                    <code>${autoCompleteSystem.formatValue(foundVariable, 100)}</code>
                </div>
            </div>
        `;
        return tooltip;

    } catch (error) {
        console.error('Error creating variable tooltip:', error);
        return null;
    }
};

/**
 * Crear decoraciones para variables (para compatibilidad con FinalVisualEditor)
 */
export const createVariableDecorations = (state) => {
    const decorations = [];
    const variablesPlugin = window.pluginManager?.get('variables');
    
    if (!variablesPlugin) {
        return Decoration.set([]);
    }

    try {
        const doc = state.doc;
        const allVariables = variablesPlugin.getAllVariables();
        const availableVarKeys = new Set();

        // Recopilar todas las claves de variables disponibles
        Object.values(allVariables).forEach(providerData => {
            if (providerData.variables) {
                Object.keys(providerData.variables).forEach(key => {
                    availableVarKeys.add(key);
                });
            }
        });

        // Buscar variables en el documento
        const variableRegex = /\{\{([^}]+)\}\}/g;
        let match;
        const text = doc.toString();

        while ((match = variableRegex.exec(text)) !== null) {
            const variableKey = match[1].trim();
            const from = match.index;
            const to = match.index + match[0].length;

            // Determinar el tipo de decoración
            const isValid = availableVarKeys.has(variableKey);
            const className = isValid ? 'cm-variable-valid' : 'cm-variable-invalid';

            decorations.push(
                Decoration.mark({
                    class: className,
                    attributes: {
                        'data-variable': variableKey,
                        'title': isValid ? 
                            `Variable válida: ${variableKey}` : 
                            `Variable no encontrada: ${variableKey}`
                    }
                }).range(from, to)
            );
        }

        return Decoration.set(decorations);

    } catch (error) {
        console.error('Error creating variable decorations:', error);
        return Decoration.set([]);
    }
};

/**
 * Función legacy de completions (para compatibilidad)
 */
export const getVariableCompletions = async (context) => {
    return await autoCompleteSystem.getCompletions(context);
};

/**
 * Invalidar cache externamente
 */
export const invalidateVariableCache = () => {
    autoCompleteSystem.invalidateCache();
};

/**
 * Evento para refrescar variables
 */
if (typeof window !== 'undefined') {
    // Escuchar eventos de cambio de variables
    window.addEventListener('variablesChanged', () => {
        autoCompleteSystem.invalidateCache();
    });
    
    window.addEventListener('variablesForceRefresh', () => {
        autoCompleteSystem.invalidateCache();
    });
    
    // Exponer funciones globalmente para debug
    window.debugVariableAutocomplete = () => {
        console.log('Variables Cache:', autoCompleteSystem.cachedVariables);
        console.log('Last Cache Time:', new Date(autoCompleteSystem.lastCacheTime));
        console.log('Cache Size:', autoCompleteSystem.cachedVariables.size);
    };
    
    window.invalidateVariableCache = invalidateVariableCache;
}
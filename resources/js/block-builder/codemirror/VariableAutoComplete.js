// ===================================================================
// resources/js/block-builder/codemirror/VariableAutoComplete.js
// Sistema completo de autocompletado y manejo de variables en CodeMirror
// ===================================================================

import { Decoration } from '@codemirror/view';

/**
 * Obtener sugerencias de variables para CodeMirror
 * @param {Object} context - Contexto de CodeMirror
 * @returns {Object|null} Completions de variables
 */
export const getVariableCompletions = (context) => {
    try {
        const beforeCursor = context.state.doc.sliceString(
            Math.max(0, context.pos - 50), 
            context.pos
        );
        
        // Detectar si estamos escribiendo una variable {{
        const variableMatch = beforeCursor.match(/\{\{[\w.]*$/);
        if (!variableMatch) return null;

        // Obtener variables del plugin
        const variablesPlugin = window.pluginManager?.get('variables');
        if (!variablesPlugin) return null;

        const allVariables = variablesPlugin.getAllVariables();
        const completions = [];

        // Procesar variables de todos los providers
        Object.entries(allVariables).forEach(([providerKey, providerData]) => {
            const variables = providerData.variables || {};
            const metadata = providerData.metadata || {};
            
            Object.entries(variables).forEach(([key, value]) => {
                completions.push({
                    label: key,
                    type: 'variable',
                    info: `${metadata.title || providerKey}: ${key}`,
                    detail: formatVariableValue(value),
                    apply: (view, completion, from, to) => {
                        // Insertar la variable completa con llaves
                        const insert = `{{${key}}}`;
                        view.dispatch({
                            changes: { from: from - 2, to, insert } // -2 para incluir las {{
                        });
                    },
                    section: {
                        name: metadata.title || providerKey,
                        rank: metadata.priority || 50
                    }
                });
            });
        });

        if (completions.length === 0) return null;

        return {
            from: context.pos - variableMatch[0].length + 2, // +2 para después de {{
            options: completions.sort((a, b) => b.section.rank - a.section.rank),
            validFor: /^[\w.]*$/
        };

    } catch (error) {
        console.error('Error getting variable completions:', error);
        return null;
    }
};

/**
 * Crear decoraciones para resaltar variables en el editor
 * @param {EditorState} state - Estado del editor
 * @returns {DecorationSet} Set de decoraciones
 */
export const createVariableDecorations = (state) => {
    const decorations = [];
    const text = state.doc.toString();
    const variableRegex = /\{\{([^}]+)\}\}/g;
    let match;

    while ((match = variableRegex.exec(text)) !== null) {
        const from = match.index;
        const to = match.index + match[0].length;
        
        decorations.push(
            Decoration.mark({
                class: 'cm-variable-highlight',
                attributes: {
                    title: `Variable: ${match[1]}`
                }
            }).range(from, to)
        );
    }

    return Decoration.set(decorations);
};

/**
 * Crear tooltip para mostrar información de una variable
 * @param {string} variableKey - Clave de la variable
 * @returns {Object} Elemento DOM del tooltip
 */
export const createVariableTooltip = (variableKey) => {
    const dom = document.createElement('div');
    dom.className = 'variable-tooltip';
    
    try {
        const variablesPlugin = window.pluginManager?.get('variables');
        const value = variablesPlugin?.getVariable(variableKey);
        
        if (value !== undefined) {
            dom.innerHTML = `
                <div class="variable-tooltip-header">
                    <strong>${variableKey}</strong>
                </div>
                <div class="variable-tooltip-value">
                    <code>${formatVariableValue(value)}</code>
                </div>
                <div class="variable-tooltip-type">
                    ${typeof value} • Click para debug
                </div>
            `;
            
            // Hacer clickeable para debug
            dom.onclick = () => {
                console.log(`🎯 Variable Debug: ${variableKey}`, value);
                if (window.variablesAdmin) {
                    console.log('Available actions:', Object.keys(window.variablesAdmin));
                }
            };
        } else {
            dom.innerHTML = `
                <div class="variable-tooltip-error">
                    Variable "${variableKey}" no encontrada
                </div>
                <div class="variable-tooltip-help">
                    Usa F1 para ver variables disponibles
                </div>
            `;
        }
    } catch (error) {
        dom.innerHTML = `
            <div class="variable-tooltip-error">
                Error cargando variable: ${error.message}
            </div>
        `;
    }
    
    return { dom };
};

/**
 * Formatear valor de variable para mostrar
 * @param {any} value - Valor de la variable
 * @returns {string} Valor formateado
 */
const formatVariableValue = (value) => {
    if (value === null || value === undefined) {
        return 'null';
    }
    
    if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
    }
    
    if (typeof value === 'object') {
        try {
            const jsonStr = JSON.stringify(value, null, 2);
            return jsonStr.length > 100 ? jsonStr.substring(0, 97) + '...' : jsonStr;
        } catch {
            return '[Object]';
        }
    }
    
    const str = String(value);
    return str.length > 100 ? str.substring(0, 97) + '...' : str;
};

/**
 * Validar si una variable existe en el sistema
 * @param {string} variableKey - Clave de la variable
 * @returns {boolean} True si existe
 */
export const validateVariable = (variableKey) => {
    try {
        const variablesPlugin = window.pluginManager?.get('variables');
        if (!variablesPlugin) return false;
        
        const allVariables = variablesPlugin.getAllVariables();
        
        for (const provider of Object.values(allVariables)) {
            if (provider.variables && provider.variables[variableKey] !== undefined) {
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.error('Error validating variable:', error);
        return false;
    }
};

/**
 * Obtener información completa de una variable
 * @param {string} variableKey - Clave de la variable
 * @returns {Object|null} Información de la variable
 */
export const getVariableInfo = (variableKey) => {
    try {
        const variablesPlugin = window.pluginManager?.get('variables');
        if (!variablesPlugin) return null;
        
        const allVariables = variablesPlugin.getAllVariables();
        
        for (const [providerName, provider] of Object.entries(allVariables)) {
            if (provider.variables && provider.variables[variableKey] !== undefined) {
                return {
                    key: variableKey,
                    value: provider.variables[variableKey],
                    provider: providerName,
                    providerTitle: provider.metadata?.title || providerName,
                    category: provider.metadata?.category || 'unknown',
                    lastUpdated: provider.lastUpdated,
                    type: typeof provider.variables[variableKey]
                };
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error getting variable info:', error);
        return null;
    }
};

/**
 * Obtener todas las variables disponibles en formato plano
 * @returns {Array} Array de objetos con información de variables
 */
export const getAllVariables = () => {
    try {
        const variablesPlugin = window.pluginManager?.get('variables');
        if (!variablesPlugin) return [];
        
        const allVariables = variablesPlugin.getAllVariables();
        const result = [];
        
        Object.entries(allVariables).forEach(([providerName, provider]) => {
            Object.entries(provider.variables || {}).forEach(([key, value]) => {
                result.push({
                    key,
                    value,
                    provider: providerName,
                    providerTitle: provider.metadata?.title || providerName,
                    category: provider.metadata?.category || 'unknown',
                    type: typeof value,
                    formatted: formatVariableValue(value)
                });
            });
        });
        
        return result.sort((a, b) => a.key.localeCompare(b.key));
    } catch (error) {
        console.error('Error getting all variables:', error);
        return [];
    }
};

/**
 * Debug: Mostrar información del sistema de variables
 */
export const debugVariables = () => {
    console.log('🎯 Variable System Debug');
    console.log('========================');
    
    const variablesPlugin = window.pluginManager?.get('variables');
    if (!variablesPlugin) {
        console.log('❌ Variables plugin not found');
        return;
    }
    
    const allVars = getAllVariables();
    console.log(`📦 Total variables: ${allVars.length}`);
    
    const byProvider = {};
    allVars.forEach(v => {
        if (!byProvider[v.provider]) byProvider[v.provider] = 0;
        byProvider[v.provider]++;
    });
    
    console.log('📊 Variables by provider:', byProvider);
    console.table(allVars.slice(0, 10)); // Mostrar primeras 10
    
    return allVars;
};

// Exponer funciones de debug en desarrollo
if (process.env.NODE_ENV === 'development') {
    window.debugVariableAutoComplete = {
        getAllVariables,
        debugVariables,
        validateVariable,
        getVariableInfo,
        formatVariableValue
    };
}
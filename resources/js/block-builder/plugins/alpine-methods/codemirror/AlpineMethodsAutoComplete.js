// ===================================================================
// resources/js/block-builder/plugins/alpine-methods/codemirror/AlpineMethodsAutoComplete.js
// Extensión de autocompletado específica para métodos Alpine
// Integrada con tu sistema CodeMirrorExtensions.js existente
// ===================================================================

import { autocompletion } from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';

/**
 * Sistema de autocompletado para métodos Alpine
 * Se integra con tu VariableAutoComplete.js existente
 */
export class AlpineMethodsAutoCompleteSystem {
    constructor() {
        this.cachedMethods = new Map();
        this.lastCacheTime = 0;
        this.cacheTimeout = 30000; // 30 segundos
        this.debug = true;
    }

    /**
     * Obtener métodos del plugin con cache
     */
    async getMethods() {
        const now = Date.now();
        
        // Verificar cache
        if (this.cachedMethods.size > 0 && (now - this.lastCacheTime) < this.cacheTimeout) {
            if (this.debug) console.log('💾 Using cached Alpine methods for autocomplete');
            return this.cachedMethods;
        }

        // Obtener métodos frescos del plugin
        const alpineMethodsPlugin = window.pluginManager?.get('alpine-methods');
        if (!alpineMethodsPlugin) {
            console.warn('⚠️ Alpine Methods plugin not found for autocomplete');
            return new Map();
        }

        try {
            const methods = alpineMethodsPlugin.getAllMethods();
            const processedMethods = new Map();

            methods.forEach(method => {
                processedMethods.set(method.trigger, {
                    name: method.name,
                    trigger: method.trigger,
                    description: method.description,
                    category: method.category,
                    template: method.template,
                    parameters: method.parameters || {},
                    priority: method.category === 'utility' ? 90 : 70
                });
            });

            this.cachedMethods = processedMethods;
            this.lastCacheTime = now;
            
            if (this.debug) {
                console.log(`✅ Cached ${processedMethods.size} Alpine methods for autocomplete`);
            }

            return processedMethods;

        } catch (error) {
            console.error('❌ Error getting Alpine methods for autocomplete:', error);
            return new Map();
        }
    }

    /**
     * Generar completions para CodeMirror
     */
    async getCompletions(context) {
        try {
            const methods = await this.getMethods();
            if (methods.size === 0) return null;

            // Detectar contexto Alpine Method
            const beforeCursor = context.state.doc.sliceString(
                Math.max(0, context.pos - 50), 
                context.pos
            );

            // Buscar trigger @
            const triggerMatch = beforeCursor.match(/@(\w*)$/);
            if (!triggerMatch) return null;

            const partial = triggerMatch[1];
            const completions = [];

            // Filtrar métodos que coincidan
            for (const [trigger, method] of methods) {
                if (!partial || method.name.toLowerCase().includes(partial.toLowerCase()) || 
                    trigger.toLowerCase().includes(partial.toLowerCase())) {
                    
                    completions.push({
                        label: trigger,
                        type: 'alpine-method',
                        info: this.createMethodInfo(method),
                        detail: method.description || 'Alpine Method',
                        boost: method.priority,
                        apply: this.createMethodApplication(method)
                    });
                }
            }

            if (completions.length === 0) return null;

            // Ordenar por prioridad y relevancia
            completions.sort((a, b) => (b.boost || 0) - (a.boost || 0));

            return {
                from: context.pos - triggerMatch[0].length + 1, // +1 para mantener @
                options: completions.slice(0, 10), // Limitar a 10 resultados
                validFor: /^@?\w*$/
            };

        } catch (error) {
            console.error('❌ Error in Alpine methods autocomplete:', error);
            return null;
        }
    }

    /**
     * Crear información detallada del método (Sin React DOM)
     */
    createMethodInfo(method) {
        // Crear elemento nativo en lugar de usar React
        const info = document.createElement('div');
        info.className = 'cm-alpine-method-info';
        
        const header = document.createElement('div');
        header.className = 'alpine-method-header';
        
        const methodName = document.createElement('span');
        methodName.className = 'method-name';
        methodName.textContent = method.name;
        
        const methodCategory = document.createElement('span');
        methodCategory.className = 'method-category';
        methodCategory.textContent = method.category;
        
        header.appendChild(methodName);
        header.appendChild(methodCategory);
        
        const description = document.createElement('div');
        description.className = 'method-description';
        description.textContent = method.description || 'Método Alpine reutilizable';
        
        info.appendChild(header);
        info.appendChild(description);

        // Agregar parámetros si existen
        if (Object.keys(method.parameters).length > 0) {
            const parametersDiv = document.createElement('div');
            parametersDiv.className = 'method-parameters';
            
            const paramTitle = document.createElement('strong');
            paramTitle.textContent = 'Parámetros:';
            parametersDiv.appendChild(paramTitle);
            
            const paramList = document.createElement('ul');
            Object.entries(method.parameters).forEach(([key, param]) => {
                const li = document.createElement('li');
                const code = document.createElement('code');
                code.textContent = key;
                li.appendChild(code);
                li.appendChild(document.createTextNode(`: ${param.description || param.type || 'any'}`));
                paramList.appendChild(li);
            });
            
            parametersDiv.appendChild(paramList);
            info.appendChild(parametersDiv);
        }

        // Agregar ejemplo de uso
        const usage = document.createElement('div');
        usage.className = 'method-usage';
        const usageTitle = document.createElement('strong');
        usageTitle.textContent = 'Uso: ';
        const usageCode = document.createElement('code');
        usageCode.textContent = `${method.trigger}({})`;
        
        usage.appendChild(usageTitle);
        usage.appendChild(usageCode);
        info.appendChild(usage);
        
        return info;
    }

    /**
     * Crear aplicación del método con snippet
     */
    createMethodApplication(method) {
        const hasParams = Object.keys(method.parameters).length > 0;
        
        if (hasParams) {
            // Crear snippet con parámetros
            const paramSnippet = Object.keys(method.parameters).map((key, index) => 
                `${key}: \${${index + 1}:value}`
            ).join(', ');
            
            return `${method.trigger}({${paramSnippet}})`;
        } else {
            return `${method.trigger}()`;
        }
    }

    /**
     * Invalidar cache
     */
    invalidateCache() {
        this.cachedMethods.clear();
        this.lastCacheTime = 0;
        if (this.debug) console.log('🗑️ Alpine methods autocomplete cache invalidated');
    }
}

// Instancia global del sistema
const alpineMethodsAutoComplete = new AlpineMethodsAutoCompleteSystem();

/**
 * Función de autocompletado para CodeMirror (compatible con tu sistema)
 */
export const alpineMethodsCompletionSource = async (context) => {
    return await alpineMethodsAutoComplete.getCompletions(context);
};

/**
 * Extensión completa de autocompletado de métodos Alpine
 */
export const createAlpineMethodsAutoComplete = () => {
    return autocompletion({
        override: [alpineMethodsCompletionSource],
        maxOptions: 10,
        activateOnTyping: true,
        closeOnBlur: true
    });
};

// ===================================================================
// INTEGRACIÓN CON TU SISTEMA CODEMIRROR EXISTENTE
// ===================================================================

/**
 * Extender tu CodeMirrorExtensions.js existente
 * Esta función se puede importar en CodeMirrorExtensions.js
 */
export const extendCodeMirrorWithAlpineMethods = () => {
    // Verificar si el sistema existe
    if (typeof window.createCodeMirrorExtensions !== 'function') {
        console.warn('⚠️ CodeMirror extensions system not found');
        return;
    }

    // Obtener la función original
    const originalCreateExtensions = window.createCodeMirrorExtensions;

    // Crear wrapper que incluya Alpine Methods
    window.createCodeMirrorExtensions = (extensions = [], completionSources = [], theme = 'light') => {
        // Agregar nuestro completion source a los existentes
        const enhancedCompletionSources = [
            alpineMethodsCompletionSource,
            ...completionSources
        ];

        // Llamar la función original con nuestras extensiones
        return originalCreateExtensions(extensions, enhancedCompletionSources, theme);
    };

    console.log('✅ CodeMirror extended with Alpine Methods autocomplete');
};

/**
 * Función para integrar con el sistema unificado de tu CodeMirrorExtensions.js
 */
export const integrateWithUnifiedCompletion = () => {
    // Si existe el sistema unificado, integrarlo
    if (typeof window.unifiedCompletionSource === 'function') {
        const originalUnified = window.unifiedCompletionSource;
        
        window.unifiedCompletionSource = async (context) => {
            // 1. Intentar completions de Alpine Methods primero
            try {
                const alpineResult = await alpineMethodsCompletionSource(context);
                if (alpineResult) {
                    console.log('⚡ Alpine Methods completions found:', alpineResult.options.length);
                    return alpineResult;
                }
            } catch (error) {
                console.warn('Error in Alpine Methods completions:', error);
            }

            // 2. Usar el sistema original como fallback
            return await originalUnified(context);
        };

        console.log('✅ Alpine Methods integrated with unified completion system');
    }
};

// ===================================================================
// ESTILOS CSS PARA EL AUTOCOMPLETADO
// ===================================================================

export const alpineMethodsAutoCompleteStyles = `
    .cm-alpine-method-info {
        max-width: 300px;
        padding: 8px;
        font-size: 12px;
        line-height: 1.4;
    }

    .alpine-method-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
        padding-bottom: 4px;
        border-bottom: 1px solid #e5e7eb;
    }

    .method-name {
        font-weight: 600;
        color: #1f2937;
    }

    .method-category {
        font-size: 10px;
        background: #3b82f6;
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        text-transform: uppercase;
    }

    .method-description {
        color: #6b7280;
        margin-bottom: 6px;
    }

    .method-parameters {
        margin-bottom: 6px;
    }

    .method-parameters ul {
        margin: 4px 0 0 0;
        padding-left: 16px;
    }

    .method-parameters li {
        margin: 2px 0;
    }

    .method-parameters code {
        background: #f3f4f6;
        padding: 1px 3px;
        border-radius: 2px;
        font-size: 11px;
    }

    .method-usage {
        font-size: 11px;
        color: #059669;
    }

    .method-usage code {
        background: #ecfdf5;
        padding: 2px 4px;
        border-radius: 3px;
    }

    /* Integración con tooltips existentes */
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon-alpine-method::before {
        content: "⚡";
        color: #3b82f6;
    }
`;

// ===================================================================
// AUTO-INICIALIZACIÓN
// ===================================================================

/**
 * Auto-inicializar cuando el DOM esté listo
 */
if (typeof document !== 'undefined') {
    const autoInit = () => {
        // Inyectar estilos
        const style = document.createElement('style');
        style.textContent = alpineMethodsAutoCompleteStyles;
        document.head.appendChild(style);

        // Intentar integrar con el sistema existente
        setTimeout(() => {
            extendCodeMirrorWithAlpineMethods();
            integrateWithUnifiedCompletion();
        }, 100);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }
}

export default alpineMethodsAutoComplete;
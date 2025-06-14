// ===================================================================
// resources/js/block-builder/extensions/CodeMirrorExtensions.js
// SOLUCIONADO: Sistema unificado de autocompletado sin conflictos
// ===================================================================

import { basicSetup } from 'codemirror';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { autocompletion, snippetCompletion } from '@codemirror/autocomplete';

// ===================================================================
// TEMAS
// ===================================================================

const lightTheme = EditorView.theme({
    '&': {
        color: '#333',
        backgroundColor: '#fff',
        fontSize: '14px',
        fontFamily: 'Fira Code, Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace'
    },
    '.cm-content': {
        padding: '12px',
        minHeight: '200px',
        caretColor: '#007acc'
    },
    '.cm-focused': {
        outline: 'none'
    },
    '.cm-editor': {
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
    },
    '.cm-scroller': {
        overflow: 'auto'
    },
    '.cm-line': {
        lineHeight: '1.6'
    },
    '&.cm-focused .cm-selectionBackground': {
        backgroundColor: '#316ac5'
    },
    '.cm-tooltip': {
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '6px',
        fontSize: '13px'
    },
    
    // Estilos para sintaxis Liquid y Variables
    '.cm-liquid-tag': {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        color: '#059669',
        fontWeight: 'bold',
        borderRadius: '3px',
        padding: '1px 2px'
    },
    '.cm-liquid-filter': {
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        color: '#4338ca',
        fontWeight: '500'
    },
    '.cm-liquid-variable': {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        color: '#d97706',
        fontWeight: '500'
    },
    
    // Variables válidas/inválidas
    '.cm-variable-valid': {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderRadius: '3px'
    },
    '.cm-variable-invalid': {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: '3px',
        textDecoration: 'underline wavy red'
    },
    
    // Autocompletado mejorado
    '.cm-tooltip-autocomplete': {
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        maxHeight: '400px',
        minWidth: '350px',
        fontSize: '13px'
    },
    
    // Tooltip para variables
    '.cm-tooltip-variable': {
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        maxWidth: '300px'
    },
    '.cm-tooltip-variable.error': {
        borderColor: '#ef4444',
        background: '#fef2f2'
    },
    '.variable-tooltip-header': {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '4px',
        fontWeight: '600'
    },
    '.variable-tooltip-content': {
        fontSize: '12px',
        color: '#6b7280'
    },
    
    // Iconos para tipos de completions
    '.cm-completion-template:before': { content: '"📄"', marginRight: '4px' },
    '.cm-completion-liquid-tag:before': { content: '"🏷️"', marginRight: '4px' },
    '.cm-completion-liquid-filter:before': { content: '"🔧"', marginRight: '4px' },
    '.cm-completion-variable:before': { content: '"🎯"', marginRight: '4px' },
    '.cm-completion-snippet:before': { content: '"⚡"', marginRight: '4px' }
}, { dark: false });

const darkTheme = [oneDark, EditorView.theme({
    '.cm-editor': {
        borderRadius: '8px',
        border: '1px solid #374151'
    },
    '.cm-content': {
        padding: '12px',
        minHeight: '200px'
    },
    
    // Estilos para tema oscuro
    '.cm-liquid-tag': {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        color: '#10b981',
        fontWeight: 'bold',
        borderRadius: '3px',
        padding: '1px 2px'
    },
    '.cm-liquid-filter': {
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        color: '#6366f1',
        fontWeight: '500'
    },
    '.cm-liquid-variable': {
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        color: '#f59e0b',
        fontWeight: '500'
    },
    '.cm-variable-valid': {
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderRadius: '3px'
    },
    '.cm-variable-invalid': {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderRadius: '3px',
        textDecoration: 'underline wavy red'
    }
})];

// ===================================================================
// SISTEMA UNIFICADO DE AUTOCOMPLETADO
// ===================================================================

/**
 * Obtener snippets de plugins
 */
const getPluginSnippets = () => {
    const snippets = [];
    
    if (window.pluginManager) {
        const plugins = window.pluginManager.list();
        
        plugins.forEach(pluginInfo => {
            try {
                const plugin = window.pluginManager.get(pluginInfo.name);
                if (plugin && plugin.getSnippets) {
                    const pluginSnippets = plugin.getSnippets();
                    Object.entries(pluginSnippets).forEach(([key, snippet]) => {
                        snippets.push(snippetCompletion(snippet.body, {
                            label: key,
                            detail: snippet.description || 'Plugin snippet',
                            type: 'snippet',
                            info: `${pluginInfo.name} snippet`,
                            boost: 80
                        }));
                    });
                }
            } catch (error) {
                console.warn(`Error loading snippets from plugin ${pluginInfo.name}:`, error);
            }
        });
    }
    
    return snippets;
};

/**
 * Completions para templates Liquid
 */
const getLiquidCompletions = (context) => {
    const templatesPlugin = window.pluginManager?.get('templates');
    if (!templatesPlugin || !templatesPlugin.getEditorCompletions) {
        return null;
    }

    try {
        const templateCompletions = templatesPlugin.getEditorCompletions(context);
        
        if (templateCompletions.length === 0) {
            return null;
        }
        
        return {
            from: context.pos,
            options: templateCompletions.map(completion => ({
                label: completion.label,
                type: completion.type || 'template',
                info: completion.info || 'Template',
                detail: completion.detail || '',
                apply: completion.apply || completion.label,
                boost: completion.boost || 70
            }))
        };
    } catch (error) {
        console.warn('Error getting template completions:', error);
        return null;
    }
};

/**
 * Completions para variables (importar dinámicamente para evitar conflictos)
 */
const getVariableCompletions = async (context) => {
    const beforeCursor = context.state.doc.sliceString(
        Math.max(0, context.pos - 50), 
        context.pos
    );
    
    const variableMatch = beforeCursor.match(/\{\{[\w.]*$/);
    if (!variableMatch) return null;

    const variablesPlugin = window.pluginManager?.get('variables');
    if (!variablesPlugin) return null;

    try {
        // Usar la función optimizada del sistema de autocompletado
        const { variableCompletionSource } = await import('../codemirror/VariableAutoComplete.js');
        return await variableCompletionSource(context);
    } catch (error) {
        console.warn('Error importing variable completions:', error);
        return null;
    }
};

/**
 * Completions básicas para HTML/Alpine
 */
const getHTMLCompletions = (context) => {
    const word = context.matchBefore(/[\w-]*/);
    if (!word) return null;

    const htmlCompletions = [
        { label: 'div', type: 'element', info: 'HTML div element' },
        { label: 'span', type: 'element', info: 'HTML span element' },
        { label: 'p', type: 'element', info: 'HTML paragraph element' },
        { label: 'x-data', type: 'attribute', info: 'Alpine.js data directive' },
        { label: 'x-show', type: 'attribute', info: 'Alpine.js show directive' },
        { label: 'x-if', type: 'attribute', info: 'Alpine.js conditional directive' }
    ];

    return {
        from: word.from,
        options: htmlCompletions.map(completion => ({
            ...completion,
            boost: 60
        }))
    };
};

/**
 * SISTEMA UNIFICADO: Función principal de autocompletado que maneja todas las fuentes
 */
const unifiedCompletionSource = async (context) => {
    // 1. Intentar completions de variables primero (mayor prioridad)
    try {
        const variableResult = await getVariableCompletions(context);
        if (variableResult) {
            console.log('🎯 Variable completions found:', variableResult.options.length);
            return variableResult;
        }
    } catch (error) {
        console.warn('Error in variable completions:', error);
    }

    // 2. Completions de templates Liquid
    try {
        const liquidResult = getLiquidCompletions(context);
        if (liquidResult) {
            console.log('🏷️ Template completions found:', liquidResult.options.length);
            return liquidResult;
        }
    } catch (error) {
        console.warn('Error in template completions:', error);
    }

    // 3. Snippets de plugins
    const word = context.matchBefore(/\w*/);
    if (word && word.from < word.to) {
        const pluginSnippets = getPluginSnippets();
        if (pluginSnippets.length > 0) {
            console.log('⚡ Plugin snippets found:', pluginSnippets.length);
            return {
                from: word.from,
                options: pluginSnippets
            };
        }
    }

    // 4. Completions HTML básicas (fallback)
    const htmlResult = getHTMLCompletions(context);
    if (htmlResult) {
        console.log('🏗️ HTML completions found:', htmlResult.options.length);
        return htmlResult;
    }

    return null;
};

// ===================================================================
// FUNCIÓN PRINCIPAL PARA CREAR EXTENSIONES
// ===================================================================

/**
 * Crear extensiones de CodeMirror con sistema unificado de autocompletado
 */
export const createCodeMirrorExtensions = (
    extensions = [],
    completionSources = [],
    theme = 'light'
) => {
    const selectedTheme = theme === 'dark' ? darkTheme : lightTheme;
    
    // Update listener para cambios de documento
    const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged) {
            console.log('📝 Document updated');
        }
    });
    
    return [
        basicSetup,
        html(),
        selectedTheme,
        // SISTEMA UNIFICADO DE AUTOCOMPLETADO (sin conflictos)
        autocompletion({
            maxOptions: 20,
            activateOnTyping: true,
            closeOnBlur: true,
            override: [
                unifiedCompletionSource,
                ...completionSources // Fuentes adicionales si se proporcionan
            ]
        }),
        updateListener,
        ...extensions
    ];
};

// ===================================================================
// EXTENSIONES ESPECÍFICAS PARA DIFERENTES CONTEXTOS
// ===================================================================

export const createEditorExtensions = (options = {}) => {
    return createCodeMirrorExtensions(
        options.extensions || [],
        options.completionSources || [],
        options.theme || 'light'
    );
};

// Helper para detectar contexto de templates
export const isInTemplateContext = (state, pos) => {
    const beforeCursor = state.doc.sliceString(Math.max(0, pos - 50), pos);
    return /\{%|\{\{/.test(beforeCursor);
};

// ===================================================================
// DEBUG HELPERS
// ===================================================================

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    window.debugExtensions = {
        listSnippets() {
            const snippets = getPluginSnippets();
            console.log('📝 Available snippets:', snippets.map(s => s.label));
            return snippets;
        },
        
        async testVariableCompletion() {
            const context = {
                pos: 2,
                state: {
                    doc: {
                        sliceString: (from, to) => '{{',
                        length: 100
                    }
                },
                matchBefore: () => ({ from: 0, to: 2 })
            };
            
            const result = await getVariableCompletions(context);
            console.log('🎯 Variable completions test:', result);
            return result;
        },
        
        testTemplateCompletions() {
            const context = {
                pos: 10,
                state: {
                    doc: {
                        sliceString: (from, to) => '{% for it',
                        length: 100
                    }
                },
                matchBefore: () => ({ from: 0, to: 10 })
            };
            
            const result = getLiquidCompletions(context);
            console.log('📄 Template completions test:', result);
            return result;
        },
        
        async testUnifiedCompletion() {
            const context = {
                pos: 2,
                state: {
                    doc: {
                        sliceString: (from, to) => '{{',
                        length: 100
                    }
                },
                matchBefore: () => ({ from: 0, to: 2 })
            };
            
            const result = await unifiedCompletionSource(context);
            console.log('🔄 Unified completion test:', result);
            return result;
        },
        
        showPluginStatus() {
            const variablesPlugin = window.pluginManager?.get('variables');
            const templatesPlugin = window.pluginManager?.get('templates');
            
            console.log('🔌 Plugin Status:', {
                variables: {
                    found: !!variablesPlugin,
                    hasGetAllVariables: !!(variablesPlugin?.getAllVariables)
                },
                templates: {
                    found: !!templatesPlugin,
                    hasEditorCompletions: !!(templatesPlugin?.getEditorCompletions)
                },
                pluginManager: !!window.pluginManager
            });
        }
    };
    
    console.log('🔧 Debug extensions available: window.debugExtensions');
}
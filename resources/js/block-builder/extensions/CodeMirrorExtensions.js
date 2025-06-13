// resources/js/block-builder/extensions/CodeMirrorExtensions.js

import { basicSetup } from 'codemirror';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { autocompletion, snippetCompletion } from '@codemirror/autocomplete';

// Temas
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
    
    // NUEVO: Estilos para sintaxis Liquid
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
    
    // Iconos para tipos de completions
    '.cm-completion-template:before': { content: '"📄"', marginRight: '4px' },
    '.cm-completion-liquid-tag:before': { content: '"🏷️"', marginRight: '4px' },
    '.cm-completion-liquid-filter:before': { content: '"🔧"', marginRight: '4px' },
    '.cm-completion-liquid-variable:before': { content: '"🎯"', marginRight: '4px' },
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
    
    // Estilos para Liquid en tema oscuro
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
    }
})];

// Update listener para cambios de documento
const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
        console.log('📝 Document updated');
    }
});

// NUEVO: Función para obtener completions de templates
const getTemplateCompletions = (context) => {
    const completions = [];
    
    // Obtener plugin de templates
    const templatesPlugin = window.pluginManager?.get('templates');
    if (templatesPlugin && templatesPlugin.getEditorCompletions) {
        try {
            const templateCompletions = templatesPlugin.getEditorCompletions(context);
            completions.push(...templateCompletions);
        } catch (error) {
            console.warn('⚠️ Error getting template completions:', error);
        }
    }
    
    return completions;
};

// Obtener snippets de plugins
const getPluginSnippets = () => {
    const snippets = [];
    
    if (window.pluginManager) {
        const plugins = window.pluginManager.list();
        
        plugins.forEach(pluginInfo => {
            const plugin = window.pluginManager.get(pluginInfo.name);
            if (plugin?.getSnippets) {
                const pluginSnippets = plugin.getSnippets();
                Object.entries(pluginSnippets).forEach(([key, snippet]) => {
                    snippets.push(snippetCompletion(snippet.body, {
                        label: snippet.label,
                        detail: snippet.detail || `${pluginInfo.name} snippet`,
                        type: 'snippet',
                        boost: 10 // Prioridad alta para snippets
                    }));
                });
            }
        });
    }
    
    return snippets;
};

// Completions de directivas Alpine/HTML
const getHTMLCompletions = (context) => {
    const word = context.matchBefore(/[\w:-]*/);
    if (!word) return null;

    const completions = [
        // Directivas Alpine básicas
        { label: 'x-data', detail: 'Alpine.js component data', insertText: 'x-data="${1:{}}"' },
        { label: 'x-show', detail: 'Show/hide element', insertText: 'x-show="${1:condition}"' },
        { label: 'x-if', detail: 'Conditional rendering', insertText: 'x-if="${1:condition}"' },
        { label: 'x-for', detail: 'Loop directive', insertText: 'x-for="${1:item} in ${2:items}"' },
        { label: 'x-on:click', detail: 'Click event handler', insertText: 'x-on:click="${1:handler}"' },
        { label: '@click', detail: 'Click event (shorthand)', insertText: '@click="${1:handler}"' },
        { label: 'x-bind:', detail: 'Bind attribute', insertText: 'x-bind:${1:attr}="${2:value}"' },
        { label: ':class', detail: 'Bind class (shorthand)', insertText: ':class="${1:classes}"' },
        { label: 'x-text', detail: 'Set text content', insertText: 'x-text="${1:expression}"' },
        { label: 'x-html', detail: 'Set HTML content', insertText: 'x-html="${1:expression}"' },
        { label: 'x-model', detail: 'Two-way binding', insertText: 'x-model="${1:property}"' },
        { label: 'x-ref', detail: 'Element reference', insertText: 'x-ref="${1:name}"' },
        { label: 'x-cloak', detail: 'Hide until Alpine loads', insertText: 'x-cloak' },
        { label: 'x-transition', detail: 'CSS transitions', insertText: 'x-transition' },
        
        // Clases Tailwind comunes
        { label: 'class="flex"', detail: 'Flexbox container', insertText: 'class="flex ${1:items-center justify-center}"' },
        { label: 'class="grid"', detail: 'Grid container', insertText: 'class="grid ${1:grid-cols-2 gap-4}"' },
        { label: 'class="bg-"', detail: 'Background color', insertText: 'class="bg-${1:blue-500}"' },
        { label: 'class="text-"', detail: 'Text color', insertText: 'class="text-${1:gray-800}"' },
        { label: 'class="p-"', detail: 'Padding', insertText: 'class="p-${1:4}"' },
        { label: 'class="m-"', detail: 'Margin', insertText: 'class="m-${1:4}"' },
        { label: 'class="w-"', detail: 'Width', insertText: 'class="w-${1:full}"' },
        { label: 'class="h-"', detail: 'Height', insertText: 'class="h-${1:full}"' }
    ];

    // Agregar completions de plugins (no templates, para evitar duplicados)
    if (window.pluginManager) {
        const plugins = window.pluginManager.list();
        plugins.forEach(pluginInfo => {
            const plugin = window.pluginManager.get(pluginInfo.name);
            if (plugin?.getCompletions && pluginInfo.name !== 'templates') {
                completions.push(...plugin.getCompletions());
            }
        });
    }

    return {
        from: word.from,
        options: completions.map(comp => ({
            label: comp.label,
            detail: comp.detail,
            insertText: comp.insertText || comp.label,
            type: comp.type || 'keyword'
        }))
    };
};

// NUEVO: Completions específicos para Liquid Templates
const getLiquidCompletions = (context) => {
    // Detectar si estamos en contexto Liquid
    const beforeCursor = context.state.doc.sliceString(Math.max(0, context.pos - 20), context.pos);
    const afterCursor = context.state.doc.sliceString(context.pos, Math.min(context.state.doc.length, context.pos + 10));
    
    // Patrones Liquid
    const isInLiquidTag = /\{%\s*\w*$/.test(beforeCursor);
    const isInLiquidOutput = /\{\{\s*[\w.]*$/.test(beforeCursor);
    const needsClosingTag = /\{%\s*\w+/.test(beforeCursor) && !/\s*%\}/.test(afterCursor);
    const needsClosingOutput = /\{\{\s*[\w.]+/.test(beforeCursor) && !/\s*\}\}/.test(afterCursor);
    
    if (!isInLiquidTag && !isInLiquidOutput && !needsClosingTag && !needsClosingOutput) {
        return null;
    }
    
    // Obtener completions del plugin de templates
    const templateCompletions = getTemplateCompletions(context);
    
    if (templateCompletions.length === 0) {
        return null;
    }
    
    // Encontrar el inicio de la palabra Liquid
    const liquidWord = context.matchBefore(/\{%[\s\w]*|%\}|\{\{[\s\w.]*|\}\}/);
    
    return {
        from: liquidWord ? liquidWord.from : context.pos,
        options: templateCompletions.map(completion => ({
            label: completion.label,
            type: completion.type || 'template',
            info: completion.info || 'Template',
            detail: completion.detail || '',
            apply: completion.apply || completion.label,
            boost: completion.boost || 70
        }))
    };
};

// Crear extensiones principales
export const createCodeMirrorExtensions = (
    extensions = [],
    completionSources = [],
    theme = 'light'
) => {
    const pluginSnippets = getPluginSnippets();
    const selectedTheme = theme === 'dark' ? darkTheme : lightTheme;
    
    return [
        basicSetup,
        html(),
        selectedTheme,
        autocompletion({
            maxOptions: 25,
            activateOnTyping: true,
            override: [
                // 1. Snippets de plugins (prioridad alta)
                (context) => {
                    const word = context.matchBefore(/\w*/);
                    if (word && word.from < word.to) {
                        return {
                            from: word.from,
                            options: pluginSnippets
                        };
                    }
                    return null;
                },
                
                // 2. NUEVO: Completions para Liquid Templates
                getLiquidCompletions,
                
                // 3. Completions HTML/Alpine
                getHTMLCompletions,
                
                // 4. Fuentes adicionales
                ...completionSources
            ]
        }),
        updateListener,
        ...extensions
    ];
};

// Extensiones específicas para diferentes contextos
export const createEditorExtensions = (options = {}) => {
    return createCodeMirrorExtensions(
        options.extensions || [],
        options.completionSources || [],
        options.theme || 'light'
    );
};

// NUEVO: Helper para detectar contexto de templates
export const isInTemplateContext = (state, pos) => {
    const beforeCursor = state.doc.sliceString(Math.max(0, pos - 50), pos);
    return /\{%|\{\{/.test(beforeCursor);
};

// Debug helper actualizado
if (process.env.NODE_ENV === 'development') {
    window.debugExtensions = {
        listSnippets() {
            const snippets = getPluginSnippets();
            console.log('📝 Available snippets:', snippets.map(s => s.label));
        },
        
        testCompletion() {
            const completions = getHTMLCompletions({ 
                matchBefore: () => ({ from: 0, to: 2 }) 
            });
            console.log('🔧 HTML completions:', completions?.options?.slice(0, 10));
        },
        
        // NUEVO: Debug para templates
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
            
            const templateCompletions = getLiquidCompletions(context);
            console.log('📄 Template completions:', templateCompletions);
        },
        
        showTemplatesPlugin() {
            const templatesPlugin = window.pluginManager?.get('templates');
            if (templatesPlugin) {
                console.log('📄 Templates plugin found:', {
                    name: templatesPlugin.name,
                    version: templatesPlugin.version,
                    hasEditorCompletions: !!templatesPlugin.getEditorCompletions,
                    hasSnippets: !!templatesPlugin.getSnippets
                });
            } else {
                console.log('❌ Templates plugin not found');
            }
        }
    };
}
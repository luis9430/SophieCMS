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
    }
}, { dark: false });

const darkTheme = [oneDark, EditorView.theme({
    '.cm-editor': {
        borderRadius: '8px',
        border: '1px solid #374151'
    },
    '.cm-content': {
        padding: '12px',
        minHeight: '200px'
    }
})];

// Update listener para cambios de documento
const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
        console.log('📝 Document updated');
    }
});

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

    // Agregar completions de plugins
    if (window.pluginManager) {
        const plugins = window.pluginManager.list();
        plugins.forEach(pluginInfo => {
            const plugin = window.pluginManager.get(pluginInfo.name);
            if (plugin?.getCompletions) {
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
                // Snippets de plugins (prioridad alta)
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
                // Completions HTML/Alpine
                getHTMLCompletions,
                // Fuentes adicionales
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

// Debug helper
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
        }
    };
}
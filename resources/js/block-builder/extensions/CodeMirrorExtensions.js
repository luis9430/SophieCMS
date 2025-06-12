// resources/js/block-builder/extensions/CodeMirrorExtensions.js - ACTUALIZADO

import { basicSetup } from 'codemirror';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, keymap, Decoration } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';
import { autocompletion, snippetCompletion } from '@codemirror/autocomplete';
import { linter, lintGutter } from '@codemirror/lint';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// Función para obtener completions de templates
function getTemplateCompletions(context) {
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
}

function getPluginCompletions(context) {
    const completions = [];
    
    if (window.pluginManager) {
        const plugins = window.pluginManager.list();
        
        plugins.forEach(pluginInfo => {
            const plugin = window.pluginManager.get(pluginInfo.name);
            
            // Templates: Obtener snippets de Liquid
            if (pluginInfo.name === 'templates' && plugin?.getSnippets) {
                const snippets = plugin.getSnippets();
                Object.entries(snippets).forEach(([key, snippet]) => {
                    completions.push({
                        label: snippet.label || key,
                        type: 'liquid-snippet',
                        info: 'Liquid Template',
                        detail: snippet.description || 'Template snippet',
                        apply: snippet.body,
                        boost: 90
                    });
                });
            }
            
            // Otros plugins (mantenemos lo existente)
            if (plugin?.getSnippets && pluginInfo.name !== 'templates') {
                const snippets = plugin.getSnippets();
                Object.entries(snippets).forEach(([key, snippet]) => {
                    completions.push({
                        label: snippet.label || key,
                        type: 'snippet',
                        info: `${pluginInfo.name} snippet`,
                        detail: snippet.detail || snippet.description || '',
                        apply: snippet.body
                    });
                });
            }
        });
    }
    
    const word = context.matchBefore(/\w*/);
    if (word && word.from < word.to && completions.length > 0) {
        return {
            from: word.from,
            options: completions
        };
    }
    
    return null;
}

// Autocompletado mejorado que incluye templates
const createVariableCompletions = () => {
    return autocompletion({
        override: [
            // Variables (mantener existente)
            (context) => {
                const word = context.matchBefore(/\{\{[\w\s.]*\}?/);
                if (!word && !isStartingVariable(context)) {
                    return null;
                }

                const variablesPlugin = window.pluginManager?.get('variables');
                if (variablesPlugin && variablesPlugin.getCompletions) {
                    return {
                        from: word ? word.from : context.pos,
                        options: variablesPlugin.getCompletions(context)
                    };
                }
                
                return getBasicVariableCompletions(context, word);
            },
            
            // Alpine.js (mantener existente)
            (context) => {
                return getAlpineCompletions(context);
            },
            
            // NUEVO: Templates Liquid
            (context) => {
                return getTemplateCompletions(context);
            },
            
            // Plugins (actualizado)
            (context) => {
                return getPluginCompletions(context);
            }
        ],
        activateOnTyping: true,
        maxRenderedOptions: 25,
        closeOnBlur: true,
        defaultKeymap: true,
        interactionDelay: 75
    });
};

// Función para validar con templates
const createVariableLinter = () => {
    return linter((view) => {
        const diagnostics = [];
        const code = view.state.doc.toString();
        
        try {
            // Validación con plugin de templates
            const templatesPlugin = window.pluginManager?.get('templates');
            if (templatesPlugin && templatesPlugin.validateEditorSyntax) {
                const validation = templatesPlugin.validateEditorSyntax(code);
                
                validation.errors?.forEach(error => {
                    diagnostics.push({
                        from: error.position || 0,
                        to: (error.position || 0) + (error.length || 1),
                        severity: 'error',
                        message: error.message
                    });
                });

                validation.warnings?.forEach(warning => {
                    diagnostics.push({
                        from: warning.position || 0,
                        to: (warning.position || 0) + (warning.length || 1),
                        severity: 'warning',
                        message: warning.message
                    });
                });
            }
            
            // Validación de variables (mantener existente)
            const variablesPlugin = window.pluginManager?.get('variables');
            if (variablesPlugin && variablesPlugin.validateSyntax) {
                const validation = variablesPlugin.validateSyntax(code);
                
                validation.errors?.forEach(error => {
                    diagnostics.push({
                        from: error.position || 0,
                        to: (error.position || 0) + (error.length || 1),
                        severity: error.severity === 'error' ? 'error' : 'warning',
                        message: error.message
                    });
                });
            } else {
                // Validación básica como fallback
                const basicErrors = validateBasicSyntax(code);
                diagnostics.push(...basicErrors);
            }

        } catch (error) {
            console.error('❌ Linting error:', error);
        }

        return diagnostics;
    });
};

// Resaltar sintaxis Liquid
const createVariableHighlighting = (theme) => {
    const isDark = theme === 'dark';
    
    return syntaxHighlighting(HighlightStyle.define([
        // Base colors
        { tag: t.content, color: isDark ? '#ffffff' : '#000000' },
        { tag: t.comment, color: isDark ? '#6b7280' : '#6b7280', fontStyle: 'italic' },
        
        // HTML tags
        { tag: t.tagName, color: isDark ? '#f87171' : '#dc2626', fontWeight: 'bold' },
        { tag: t.angleBracket, color: isDark ? '#d1d5db' : '#6b7280' },
        
        // NUEVO: Liquid tags {% %}
        { tag: t.brace, color: isDark ? '#10b981' : '#059669', fontWeight: 'bold' },
        
        // Alpine directives
        { 
            tag: t.attributeName, 
            color: isDark ? '#10b981' : '#059669', 
            fontWeight: '600'
        },
        
        // Attribute values & strings
        { tag: t.attributeValue, color: isDark ? '#60a5fa' : '#2563eb' },
        { tag: t.string, color: isDark ? '#a78bfa' : '#7c3aed' },
        
        // NUEVO: Variables Liquid {{ }}
        { tag: t.special(t.string), color: isDark ? '#fbbf24' : '#d97706', fontWeight: 'bold' },
        
        // Numbers and literals
        { tag: t.number, color: isDark ? '#34d399' : '#10b981' },
        { tag: t.bool, color: isDark ? '#f472b6' : '#ec4899' },
        { tag: t.null, color: isDark ? '#9ca3af' : '#6b7280' },
        
        // Operators
        { tag: t.operator, color: isDark ? '#fb7185' : '#e11d48' },
        { tag: t.punctuation, color: isDark ? '#d1d5db' : '#6b7280' },
        { tag: t.bracket, color: isDark ? '#c084fc' : '#8b5cf6' },
        
        // CSS classes
        { tag: t.className, color: isDark ? '#06b6d4' : '#0891b2' }
    ]));
};

// Tema actualizado con estilos para Liquid
const lightTheme = EditorView.theme({
    '&': {
        color: '#333',
        backgroundColor: '#fff',
        fontSize: '14px',
        fontFamily: 'JetBrains Mono, Fira Code, Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace'
    },
    '.cm-content': {
        padding: '16px',
        minHeight: '300px',
        caretColor: '#007acc',
        lineHeight: '1.6'
    },
    
    // NUEVO: Estilos para Liquid
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
    
    // Autocompletado
    '.cm-tooltip-autocomplete': {
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        maxHeight: '400px',
        minWidth: '350px',
        fontSize: '13px'
    },
    
    // NUEVO: Iconos para tipos de completions de templates
    '.cm-completion-liquid-snippet:before': { content: '"📄"', marginRight: '4px' },
    '.cm-completion-liquid-tag:before': { content: '"🏷️"', marginRight: '4px' },
    '.cm-completion-liquid-filter:before': { content: '"🔧"', marginRight: '4px' },
    '.cm-completion-liquid-variable:before': { content: '"🎯"', marginRight: '4px' }
}, { dark: false });

// Mantener todas las demás funciones existentes sin cambios...
// (isStartingVariable, getBasicVariableCompletions, getAlpineCompletions, etc.)

// Función principal actualizada
export const createCodeMirrorExtensions = (
    extensions = [],
    completionSources = [],
    theme = 'light'
) => {
    const selectedTheme = theme === 'dark' ? [oneDark, /* tema oscuro con liquid */] : lightTheme;
    
    return [
        basicSetup,
        html({
            matchClosingTags: true,
            autoCloseTags: true,
            nestedLanguages: []
        }),
        
        // Tema y highlighting (actualizado)
        selectedTheme,
        createVariableHighlighting(theme),
        
        // Sistema de variables (mantener)
        // variableDecorations,
        
        // Autocompletado (actualizado con templates)
        createVariableCompletions(),
        
        // Validación (actualizada con templates)
        createVariableLinter(),
        lintGutter(),
        
        // Keymaps (mantener)
        // createCustomKeymap(),
        
        // Configuración del editor
        EditorView.lineWrapping,
        
        // Extensiones adicionales
        ...extensions,
        ...completionSources
    ];
};

// Debugging para templates
if (process.env.NODE_ENV === 'development') {
    window.debugTemplatesIntegration = {
        testTemplateCompletion() {
            const templatesPlugin = window.pluginManager?.get('templates');
            if (templatesPlugin) {
                console.log('📄 Templates plugin found:', templatesPlugin);
                console.log('📋 Snippets:', templatesPlugin.getSnippets?.());
            } else {
                console.log('❌ Templates plugin not found');
            }
        }
    };
}
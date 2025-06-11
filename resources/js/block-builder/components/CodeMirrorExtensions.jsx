// ===================================================================
// components/CodeMirrorExtensions.js - Extensiones que podrían faltar
// ===================================================================

import { EditorView, keymap, Decoration, DecorationSet } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';
import { linter } from '@codemirror/lint';

// ===================================================================
// 1. HOTKEYS MEJORADOS PARA EL EDITOR
// ===================================================================

export const createEditorHotkeys = () => {
    return keymap.of([
        // Autocompletado inteligente
        {
            key: 'Ctrl-Space',
            run: (view) => {
                // Forzar autocompletado
                return true;
            }
        },
        
        // Formatear código
        {
            key: 'Ctrl-Shift-F',
            run: (view) => {
                if (window.editorBridge?.formatCode) {
                    const formatted = window.editorBridge.formatCode(view.state.doc.toString());
                    view.dispatch({
                        changes: { from: 0, to: view.state.doc.length, insert: formatted }
                    });
                    return true;
                }
                return false;
            }
        },
        
        // Insertar variable rápido
        {
            key: 'Ctrl-Shift-V',
            run: (view) => {
                const cursor = view.state.selection.main.head;
                view.dispatch({
                    changes: { from: cursor, insert: '{{ }}' },
                    selection: { anchor: cursor + 3 }
                });
                return true;
            }
        },
        
        // Comentar línea
        {
            key: 'Ctrl-/',
            run: (view) => {
                const { from, to } = view.state.selection.main;
                const line = view.state.doc.lineAt(from);
                const isCommented = line.text.trim().startsWith('<!--');
                
                if (isCommented) {
                    // Descomentar
                    const newText = line.text.replace(/<!--\s*/, '').replace(/\s*-->/, '');
                    view.dispatch({
                        changes: { from: line.from, to: line.to, insert: newText }
                    });
                } else {
                    // Comentar
                    view.dispatch({
                        changes: { from: line.from, to: line.to, insert: `<!-- ${line.text} -->` }
                    });
                }
                return true;
            }
        },
        
        // Duplicar línea
        {
            key: 'Ctrl-Shift-D',
            run: (view) => {
                const { from } = view.state.selection.main;
                const line = view.state.doc.lineAt(from);
                view.dispatch({
                    changes: { from: line.to, insert: '\n' + line.text },
                    selection: { anchor: line.to + 1 + line.text.length }
                });
                return true;
            }
        }
    ]);
};

// ===================================================================
// 2. SISTEMA DE BRACKETS INTELIGENTES
// ===================================================================

export const createSmartBrackets = () => {
    return EditorView.inputHandler.of((view, from, to, text) => {
        // Auto-cerrar {{ con }}
        if (text === '{' && view.state.doc.sliceString(from - 1, from) === '{') {
            view.dispatch({
                changes: { from, to, insert: '  }}' },
                selection: { anchor: from + 1 }
            });
            return true;
        }
        
        // Auto-cerrar comillas en atributos Alpine
        if (text === '"' && isInAlpineAttribute(view, from)) {
            const hasClosingQuote = view.state.doc.sliceString(from, from + 20).includes('"');
            if (!hasClosingQuote) {
                view.dispatch({
                    changes: { from, to, insert: '""' },
                    selection: { anchor: from + 1 }
                });
                return true;
            }
        }
        
        return false;
    });
};

// ===================================================================
// 3. RESALTADO INTELIGENTE DE VARIABLES
// ===================================================================

const variableHighlightEffect = StateEffect.define();

const variableHighlightField = StateField.define({
    create() {
        return Decoration.none;
    },
    update(highlights, tr) {
        highlights = highlights.map(tr.changes);
        
        for (let effect of tr.effects) {
            if (effect.is(variableHighlightEffect)) {
                highlights = effect.value;
            }
        }
        return highlights;
    },
    provide: f => EditorView.decorations.from(f)
});

export const createVariableHighlight = () => {
    return [
        variableHighlightField,
        EditorView.updateListener.of((update) => {
            if (update.docChanged || update.selectionSet) {
                const decorations = [];
                const doc = update.state.doc;
                const cursor = update.state.selection.main.head;
                const line = doc.lineAt(cursor);
                
                // Resaltar variables en la línea actual
                const variablePattern = /\{\{\s*([^}]+)\s*\}\}/g;
                let match;
                
                while ((match = variablePattern.exec(line.text)) !== null) {
                    const from = line.from + match.index;
                    const to = from + match[0].length;
                    
                    // Verificar si la variable es válida
                    const isValid = window.editorBridge?.validateVariable?.(match[1].trim());
                    
                    decorations.push(
                        Decoration.mark({
                            class: isValid ? 'cm-variable-valid-highlight' : 'cm-variable-invalid-highlight'
                        }).range(from, to)
                    );
                }
                
                update.view.dispatch({
                    effects: variableHighlightEffect.of(Decoration.set(decorations))
                });
            }
        })
    ];
};

// ===================================================================
// 4. LINTER AVANZADO CON WINDOW.EDITORBRIDGE
// ===================================================================

export const createAdvancedLinter = () => {
    return linter(async (view) => {
        const diagnostics = [];
        const code = view.state.doc.toString();
        
        try {
            // 1. Validación con EditorBridge
            if (window.editorBridge?.validateSyntax) {
                const result = await window.editorBridge.validateSyntax(code);
                
                result.errors?.forEach(error => {
                    diagnostics.push({
                        from: error.position || 0,
                        to: (error.position || 0) + (error.length || 1),
                        severity: 'error',
                        message: error.message,
                        actions: error.fixes?.map(fix => ({
                            name: fix.title,
                            apply: (view) => {
                                view.dispatch({ changes: fix.changes });
                            }
                        }))
                    });
                });
                
                result.warnings?.forEach(warning => {
                    diagnostics.push({
                        from: warning.position || 0,
                        to: (warning.position || 0) + (warning.length || 1),
                        severity: 'warning',
                        message: warning.message
                    });
                });
            }
            
            // 2. Validación específica de Alpine
            const alpineErrors = validateAlpineSpecific(code);
            diagnostics.push(...alpineErrors);
            
            // 3. Validación de HTML
            const htmlErrors = validateHTML(code);
            diagnostics.push(...htmlErrors);
            
        } catch (error) {
            console.error('Error in advanced linter:', error);
        }
        
        return diagnostics;
    });
};

// ===================================================================
// 5. TEMA VISUAL COMPLETO
// ===================================================================

export const createCompleteEditorTheme = (theme = 'light') => {
    const isDark = theme === 'dark';
    
    return EditorView.theme({
        // Editor base
        '&': {
            fontSize: '14px',
            fontFamily: 'JetBrains Mono, Monaco, Menlo, Consolas, monospace',
            lineHeight: '1.6'
        },
        
        // Variables válidas destacadas
        '.cm-variable-valid-highlight': {
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.1)',
            borderRadius: '3px',
            padding: '1px 2px',
            border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.4)' : 'rgba(5, 150, 105, 0.3)'}`,
            animation: 'variable-highlight 0.3s ease'
        },
        
        // Variables inválidas destacadas
        '.cm-variable-invalid-highlight': {
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(220, 38, 38, 0.1)',
            borderRadius: '3px',
            padding: '1px 2px',
            border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(220, 38, 38, 0.3)'}`,
            textDecoration: 'underline wavy red'
        },
        
        // Animaciones CSS
        '@keyframes variable-highlight': {
            '0%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.05)' },
            '100%': { transform: 'scale(1)' }
        },
        
        // Mejorar autocompletado
        '.cm-tooltip-autocomplete': {
            minWidth: '350px',
            maxHeight: '400px',
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            borderRadius: '12px',
            boxShadow: isDark ? 
                '0 25px 50px -12px rgba(0, 0, 0, 0.8)' :
                '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
        },
        
        // Items de autocompletado mejorados
        '.cm-tooltip-autocomplete > ul': {
            padding: '8px 0'
        },
        
        '.cm-tooltip-autocomplete > ul > li': {
            padding: '12px 16px',
            borderBottom: `1px solid ${isDark ? '#374151' : '#f3f4f6'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
        },
        
        '.cm-tooltip-autocomplete > ul > li:hover': {
            backgroundColor: isDark ? '#374151' : '#f9fafb'
        },
        
        '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
            backgroundColor: isDark ? '#10b981' : '#059669',
            color: 'white',
            fontWeight: '600'
        },
        
        // Gutter mejorado
        '.cm-gutters': {
            backgroundColor: isDark ? '#1f2937' : '#f9fafb',
            borderRight: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            borderRadius: '8px 0 0 8px'
        },
        
        // Línea activa más sutil
        '.cm-activeLine': {
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.05)' : 'rgba(5, 150, 105, 0.02)',
            borderLeft: `3px solid ${isDark ? '#10b981' : '#059669'}`,
            paddingLeft: '12px'
        }
    }, { dark: isDark });
};

// ===================================================================
// FUNCIONES AUXILIARES
// ===================================================================

function isInAlpineAttribute(view, pos) {
    const line = view.state.doc.lineAt(pos);
    const beforeCursor = line.text.slice(0, pos - line.from);
    
    // Verificar si estamos dentro de un atributo Alpine
    const alpineAttrPattern = /(x-[\w-]+|@[\w-]+|:[\w-]+)\s*=/;
    return alpineAttrPattern.test(beforeCursor);
}

function validateAlpineSpecific(code) {
    const diagnostics = [];
    
    // Verificar x-if sin template
    const xIfPattern = /<(?!template)[^>]+x-if="[^"]*"[^>]*>/g;
    let match;
    
    while ((match = xIfPattern.exec(code)) !== null) {
        diagnostics.push({
            from: match.index,
            to: match.index + match[0].length,
            severity: 'error',
            message: 'x-if debe usarse solo en elementos <template>',
            actions: [{
                name: 'Convertir a template',
                apply: (view) => {
                    // Lógica para convertir a template
                }
            }]
        });
    }
    
    return diagnostics;
}

function validateHTML(code) {
    const diagnostics = [];
    
    // Validación básica de HTML (tags no cerrados, etc.)
    const tagStack = [];
    const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
    let match;
    
    while ((match = tagPattern.exec(code)) !== null) {
        const isClosing = match[0].startsWith('</');
        const tagName = match[1].toLowerCase();
        
        if (isClosing) {
            if (tagStack.length === 0 || tagStack[tagStack.length - 1] !== tagName) {
                diagnostics.push({
                    from: match.index,
                    to: match.index + match[0].length,
                    severity: 'error',
                    message: `Tag de cierre sin apertura: </${tagName}>`
                });
            } else {
                tagStack.pop();
            }
        } else {
            // Tags auto-cerrados
            const selfClosing = ['br', 'hr', 'img', 'input', 'meta', 'link'];
            if (!selfClosing.includes(tagName) && !match[0].endsWith('/>')) {
                tagStack.push(tagName);
            }
        }
    }
    
    // Tags sin cerrar
    tagStack.forEach(tagName => {
        diagnostics.push({
            from: 0,
            to: 0,
            severity: 'warning',
            message: `Tag sin cerrar: <${tagName}>`
        });
    });
    
    return diagnostics;
}

// Exportar todas las extensiones como un bundle
export const createCompleteEditorExtensions = (theme = 'light') => {
    return [
        createEditorHotkeys(),
        createSmartBrackets(),
        createVariableHighlight(),
        createAdvancedLinter(),
        createCompleteEditorTheme(theme)
    ];
};
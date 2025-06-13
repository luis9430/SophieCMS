// ===================================================================
// resources/js/block-builder/components/FinalVisualEditor.jsx
// Editor avanzado con sistema de snippets, plugins y VARIABLES
// ===================================================================

import { useCallback, useMemo, useRef, useEffect, useState } from 'preact/hooks';
import CodeMirror from '@uiw/react-codemirror';
import { createCodeMirrorExtensions } from '../extensions/CodeMirrorExtensions.js';
import { StateEffect } from '@codemirror/state';
import { autocompletion } from '@codemirror/autocomplete';
import { hoverTooltip } from '@codemirror/view';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// NUEVO: Importar funciones de variables existentes
import { 
    getVariableCompletions, 
    createVariableTooltip, 
    createVariableDecorations 
} from '../codemirror/VariableAutoComplete.js';

const FinalVisualEditor = ({
    initialContent = '',
    onContentChange,
    theme = 'light'
}) => {
    // ===================================================================
    // ESTADO Y REFS
    // ===================================================================
    
    const debounceTimeoutRef = useRef(null);
    const lastContentRef = useRef(initialContent);
    const isExternalUpdateRef = useRef(false);
    const viewRef = useRef(null);
    const [variablesEnabled, setVariablesEnabled] = useState(false);

    // ===================================================================
    // VERIFICAR ESTADO DE VARIABLES
    // ===================================================================

    useEffect(() => {
        const checkVariables = () => {
            const hasVariables = !!(window.pluginManager && window.pluginManager.get('variables'));
            setVariablesEnabled(hasVariables);
        };

        checkVariables();
        const interval = setInterval(checkVariables, 5000);
        return () => clearInterval(interval);
    }, []);

    // ===================================================================
    // MANEJO DE CAMBIOS CON DEBOUNCE
    // ===================================================================

    const handleChange = useCallback((value) => {
        if (isExternalUpdateRef.current) {
            isExternalUpdateRef.current = false;
            return;
        }

        lastContentRef.current = value;

        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(() => {
            if (onContentChange && lastContentRef.current !== initialContent) {
                onContentChange(lastContentRef.current);
            }
        }, 300);
    }, [onContentChange, initialContent]);

    // ===================================================================
    // NUEVA: EXTENSIÓN DE VARIABLES PARA FINAL EDITOR
    // ===================================================================

    const createVariablesExtension = useCallback(() => {
        if (!variablesEnabled) return [];

        return [
            // Autocompletado de variables usando tu función existente
        

            // Highlighting de variables
            syntaxHighlighting(HighlightStyle.define([
                {
                    tag: t.special(t.string),
                    color: '#8b5cf6',
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderRadius: '3px',
                    padding: '1px 3px'
                }
            ])),

            // Tooltips usando tu función existente
            hoverTooltip((view, pos, side) => {
                const { from, to, text } = view.state.doc.lineAt(pos);
                const variableRegex = /\{\{([^}]+)\}\}/g;
                let match;

                while ((match = variableRegex.exec(text)) !== null) {
                    const start = from + match.index;
                    const end = start + match[0].length;
                    
                    if (pos >= start && pos <= end) {
                        const variableKey = match[1];
                        return {
                            pos: start,
                            end: end,
                            above: true,
                            create() {
                                // Usar tu función existente
                                return createVariableTooltip(variableKey);
                            }
                        };
                    }
                }
                return null;
            })
        ];
    }, [variablesEnabled]);

    // ===================================================================
    // EXTENSIONES COMBINADAS (SNIPPETS + VARIABLES)
    // ===================================================================

    const extensions = useMemo(() => {
        // Obtener extensiones base (tu sistema existente)
        const baseExtensions = createCodeMirrorExtensions([], [], theme);
        
        // Agregar extensiones de variables
        const variableExtensions = createVariablesExtension();
        
        // Combinar todas las extensiones
        return [...baseExtensions, ...variableExtensions];
    }, [theme, variablesEnabled]);

    // ===================================================================
    // ACTUALIZAR EXTENSIONES DINÁMICAMENTE
    // ===================================================================

    useEffect(() => {
        const updateExtensions = () => {
            if (viewRef.current) {
                const baseExtensions = createCodeMirrorExtensions([], [], theme);
                const variableExtensions = createVariablesExtension();
                const newExtensions = [...baseExtensions, ...variableExtensions];
                
                viewRef.current.dispatch({
                    effects: StateEffect.reconfigure.of(newExtensions)
                });
                console.log('🔄 Editor extensions updated with variables support');
            }
        };

        // Escuchar eventos de plugins
        if (window.pluginManager) {
            window.pluginManager.on('plugin:registered', updateExtensions);
            window.pluginManager.on('plugin:unregistered', updateExtensions);
        }

        return () => {
            if (window.pluginManager) {
                window.pluginManager.off('plugin:registered', updateExtensions);
                window.pluginManager.off('plugin:unregistered', updateExtensions);
            }
        };
    }, [theme, createVariablesExtension]);

    // ===================================================================
    // CONTROL DE ACTUALIZACIONES EXTERNAS
    // ===================================================================

    const currentValue = useRef(initialContent);
    if (initialContent !== lastContentRef.current && initialContent !== currentValue.current) {
        currentValue.current = initialContent;
        lastContentRef.current = initialContent;
        isExternalUpdateRef.current = true;
    }

    // ===================================================================
    // CLEANUP
    // ===================================================================

    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    // ===================================================================
    // CAPTURAR REFERENCIA DEL EDITOR
    // ===================================================================

    const onCreateEditor = useCallback((view) => {
        viewRef.current = view;
        window.currentEditor = view; // Para debug
        console.log('🎯 FinalVisualEditor initialized with variables support');
    }, []);

    // ===================================================================
    // RENDER
    // ===================================================================

    return (
        <div className="final-visual-editor-container">
            {/* Header con información de variables */}
            {variablesEnabled && (
                <div className="editor-variables-header">
                    <div className="variables-status">
                        <span className="status-indicator online"></span>
                        <span>Variables activas</span>
                        <VariableQuickStats />
                    </div>
                    <div className="variables-help">
                        <span className="help-text">💡 Escribe {'{{'} para ver variables disponibles</span>
                    </div>
                </div>
            )}
            
            {/* Editor principal */}
            <CodeMirror
                value={currentValue.current}
                height="100%"
                style={{ height: '100%', fontSize: '14px' }}
                extensions={extensions}
                onChange={handleChange}
                onCreateEditor={onCreateEditor}
                basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    dropCursor: true,
                    allowMultipleSelections: false,
                    indentOnInput: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    highlightActiveLine: true,
                    highlightSelectionMatches: false,
                    searchKeymap: true,
                    tabSize: 2
                }}
            />
        </div>
    );
};

// ===================================================================
// COMPONENTE: STATS RÁPIDAS DE VARIABLES
// ===================================================================

function VariableQuickStats() {
    const [stats, setStats] = useState({ count: 0, providers: 0 });

    useEffect(() => {
        const updateStats = () => {
            try {
                const variablesPlugin = window.pluginManager?.get('variables');
                if (variablesPlugin) {
                    const allVars = variablesPlugin.getAllVariables();
                    const count = Object.values(allVars).reduce((acc, provider) => {
                        return acc + Object.keys(provider.variables || {}).length;
                    }, 0);
                    const providers = Object.keys(allVars).length;
                    
                    setStats({ count, providers });
                }
            } catch (error) {
                console.error('Error updating variable stats:', error);
            }
        };

        updateStats();
        const interval = setInterval(updateStats, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <span className="variable-stats">
            📦 {stats.count} variables • 🔌 {stats.providers} providers
        </span>
    );
}

// ===================================================================
// DEBUG HELPERS EXTENDIDOS
// ===================================================================

if (process.env.NODE_ENV === 'development') {
    // Extender debug existente con funciones de variables
    window.debugEditor = {
        // Funciones existentes de tu sistema
        insertSnippet(snippetKey = 'accordion') {
            if (!window.currentEditor || !window.pluginManager) {
                console.log('❌ Editor o PluginManager no disponible');
                return;
            }

            const plugins = window.pluginManager.list();
            let snippet = null;

            for (const pluginInfo of plugins) {
                const plugin = window.pluginManager.get(pluginInfo.name);
                if (plugin?.getSnippets) {
                    const snippets = plugin.getSnippets();
                    if (snippets[snippetKey]) {
                        snippet = snippets[snippetKey];
                        break;
                    }
                }
            }

            if (snippet) {
                const view = window.currentEditor;
                const cursor = view.state.selection.main.head;
                
                view.dispatch({
                    changes: {
                        from: cursor,
                        insert: snippet.body
                    },
                    selection: { anchor: cursor + snippet.body.length }
                });
                
                console.log(`✅ Snippet "${snippetKey}" insertado`);
            } else {
                console.log(`❌ Snippet "${snippetKey}" no encontrado`);
            }
        },

        listSnippets() {
            if (!window.pluginManager) return console.log('❌ No PluginManager');
            
            const plugins = window.pluginManager.list();
            const allSnippets = {};
            
            plugins.forEach(pluginInfo => {
                const plugin = window.pluginManager.get(pluginInfo.name);
                if (plugin?.getSnippets) {
                    allSnippets[pluginInfo.name] = Object.keys(plugin.getSnippets());
                }
            });
            
            console.log('📝 Snippets disponibles:', allSnippets);
        },

        // NUEVAS: Funciones de debug para variables
        showVariables() {
            const variablesPlugin = window.pluginManager?.get('variables');
            if (!variablesPlugin) {
                console.log('❌ Variables plugin no encontrado');
                return;
            }
            
            const allVars = variablesPlugin.getAllVariables();
            console.log('🎯 Variables disponibles:');
            console.table(allVars);
        },

        insertTestVariable() {
            if (!window.currentEditor) {
                console.log('❌ Editor no disponible');
                return;
            }
            
            const view = window.currentEditor;
            const pos = view.state.selection.main.head;
            view.dispatch({
                changes: { from: pos, insert: '{{site.company_name}}' }
            });
            console.log('✅ Variable de prueba insertada');
        },

        validateVariables() {
            const view = window.currentEditor;
            if (!view) {
                console.log('❌ Editor no disponible');
                return;
            }
            
            const code = view.state.doc.toString();
            const variableRegex = /\{\{([^}]*)\}\}/g;
            const variables = [];
            let match;
            
            while ((match = variableRegex.exec(code)) !== null) {
                variables.push(match[1]);
            }
            
            console.log('🔍 Variables encontradas en el código:', variables);
            
            const variablesPlugin = window.pluginManager?.get('variables');
            if (variablesPlugin) {
                const allVars = variablesPlugin.getAllVariables();
                const available = [];
                Object.values(allVars).forEach(provider => {
                    available.push(...Object.keys(provider.variables || {}));
                });
                console.log('✅ Variables disponibles en el sistema:', available);
                
                // Verificar qué variables del código no están disponibles
                const missing = variables.filter(v => !available.includes(v.trim()));
                if (missing.length > 0) {
                    console.warn('⚠️ Variables no encontradas:', missing);
                } else {
                    console.log('✅ Todas las variables están disponibles');
                }
            }
        },

        testVariableCompletion() {
            if (!window.currentEditor) {
                console.log('❌ Editor no disponible');
                return;
            }

            const view = window.currentEditor;
            const pos = view.state.selection.main.head;
            
            // Insertar {{ para activar autocompletado
            view.dispatch({
                changes: { from: pos, insert: '{{' }
            });
            
            console.log('✅ Autocompletado de variables activado - escribe para ver sugerencias');
        },

        getVariableStats() {
            const variablesPlugin = window.pluginManager?.get('variables');
            if (!variablesPlugin) {
                console.log('❌ Variables plugin no encontrado');
                return;
            }

            const allVars = variablesPlugin.getAllVariables();
            const stats = {
                totalProviders: Object.keys(allVars).length,
                totalVariables: 0,
                byProvider: {}
            };

            Object.entries(allVars).forEach(([providerKey, providerData]) => {
                const varCount = Object.keys(providerData.variables || {}).length;
                stats.totalVariables += varCount;
                stats.byProvider[providerKey] = {
                    count: varCount,
                    title: providerData.metadata?.title || providerKey,
                    priority: providerData.metadata?.priority || 50
                };
            });

            console.log('📊 Estadísticas de variables:', stats);
            return stats;
        }
    };

    console.log('🔧 Debug editor con variables: window.debugEditor');
}

export default FinalVisualEditor;
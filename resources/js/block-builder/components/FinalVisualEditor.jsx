// ===================================================================
// resources/js/block-builder/components/FinalVisualEditor.jsx
// Editor avanzado con sistema de snippets, plugins y VARIABLES OPTIMIZADO
// ===================================================================

import { useCallback, useMemo, useRef, useEffect, useState } from 'preact/hooks';
import CodeMirror from '@uiw/react-codemirror';
import { createCodeMirrorExtensions } from '../extensions/CodeMirrorExtensions.js';
import { StateEffect } from '@codemirror/state';
import { autocompletion } from '@codemirror/autocomplete';
import { hoverTooltip } from '@codemirror/view';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// IMPORTAR SISTEMA OPTIMIZADO DE VARIABLES (solo para tooltips)
import { 
    createVariableTooltip,
    invalidateVariableCache
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
    const [variableStats, setVariableStats] = useState({ count: 0, providers: 0 });

    // ===================================================================
    // VERIFICAR ESTADO DE VARIABLES Y STATS
    // ===================================================================

    useEffect(() => {
        const checkVariables = () => {
            const hasVariables = !!(window.pluginManager && window.pluginManager.get('variables'));
            setVariablesEnabled(hasVariables);
            
            if (hasVariables) {
                updateVariableStats();
            }
        };

        const updateVariableStats = () => {
            try {
                const variablesPlugin = window.pluginManager?.get('variables');
                if (variablesPlugin) {
                    const allVars = variablesPlugin.getAllVariables();
                    const count = Object.values(allVars).reduce((acc, provider) => {
                        return acc + Object.keys(provider.variables || {}).length;
                    }, 0);
                    const providers = Object.keys(allVars).length;
                    
                    setVariableStats({ count, providers });
                }
            } catch (error) {
                console.error('Error updating variable stats:', error);
            }
        };

        checkVariables();
        const interval = setInterval(checkVariables, 10000); // Check cada 10 segundos
        
        // Escuchar eventos de cambio de variables
        const handleVariableChange = () => {
            invalidateVariableCache();
            updateVariableStats();
        };
        
        window.addEventListener('variablesChanged', handleVariableChange);
        window.addEventListener('variablesForceRefresh', handleVariableChange);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('variablesChanged', handleVariableChange);
            window.removeEventListener('variablesForceRefresh', handleVariableChange);
        };
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
    // EXTENSIÓN DE VARIABLES OPTIMIZADA (SIN CONFLICTOS)
    // ===================================================================

    const createVariablesExtension = useCallback(() => {
        if (!variablesEnabled) return [];

        const extensions = [];

        // 1. Solo highlighting y tooltips (NO autocompletado - se maneja en CodeMirrorExtensions)
        extensions.push(
            syntaxHighlighting(HighlightStyle.define([
                {
                    tag: t.special(t.string),
                    color: '#8b5cf6',
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderRadius: '3px',
                    padding: '1px 3px'
                }
            ]))
        );

        // 2. Tooltips mejorados
        extensions.push(
            hoverTooltip((view, pos, side) => {
                const { from, to, text } = view.state.doc.lineAt(pos);
                const variableRegex = /\{\{([^}]+)\}\}/g;
                let match;

                while ((match = variableRegex.exec(text)) !== null) {
                    const start = from + match.index;
                    const end = start + match[0].length;
                    
                    if (pos >= start && pos <= end) {
                        const variableKey = match[1].trim();
                        return {
                            pos: start,
                            end: end,
                            above: true,
                            create() {
                                return createVariableTooltip(variableKey);
                            }
                        };
                    }
                }
                return null;
            })
        );

        return extensions;
    }, [variablesEnabled]);

    // ===================================================================
    // EXTENSIONES COMBINADAS
    // ===================================================================

    const extensions = useMemo(() => {
        try {
            // Obtener extensiones base
            const baseExtensions = createCodeMirrorExtensions([], [], theme);
            
            // Agregar extensiones de variables
            const variableExtensions = createVariablesExtension();
            
            console.log(`🔧 CodeMirror extensions loaded: base(${baseExtensions.length}) + variables(${variableExtensions.length}) [unified autocomplete]`);
            
            // Combinar todas las extensiones
            return [...baseExtensions, ...variableExtensions];
        } catch (error) {
            console.error('Error creating CodeMirror extensions:', error);
            // Fallback a extensiones básicas
            return createCodeMirrorExtensions([], [], theme);
        }
    }, [theme, variablesEnabled, createVariablesExtension]);

    // ===================================================================
    // ACTUALIZACIÓN DINÁMICA DE EXTENSIONES
    // ===================================================================

    useEffect(() => {
        const updateExtensions = () => {
            if (viewRef.current) {
                try {
                    const baseExtensions = createCodeMirrorExtensions([], [], theme);
                    const variableExtensions = createVariablesExtension();
                    const newExtensions = [...baseExtensions, ...variableExtensions];
                    
                    viewRef.current.dispatch({
                        effects: StateEffect.reconfigure.of(newExtensions)
                    });
                    console.log('🔄 Editor extensions updated with variables support');
                } catch (error) {
                    console.error('Error updating extensions:', error);
                }
            }
        };

        // Escuchar eventos de plugins
        if (window.pluginManager) {
            window.pluginManager.on?.('plugin:registered', updateExtensions);
            window.pluginManager.on?.('plugin:unregistered', updateExtensions);
        }

        return () => {
            if (window.pluginManager) {
                window.pluginManager.off?.('plugin:registered', updateExtensions);
                window.pluginManager.off?.('plugin:unregistered', updateExtensions);
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
        console.log('🎯 FinalVisualEditor initialized with unified autocomplete system');
        
        // Invalidar cache de variables al crear editor
        if (variablesEnabled) {
            invalidateVariableCache();
        }
    }, [variablesEnabled]);

    // ===================================================================
    // HANDLERS PARA VARIABLES
    // ===================================================================

    const handleRefreshVariables = useCallback(async () => {
        try {
            invalidateVariableCache();
            
            // Disparar evento para que otros componentes se actualicen
            window.dispatchEvent(new CustomEvent('variablesForceRefresh'));
            
            console.log('🔄 Variables cache refreshed from editor');
        } catch (error) {
            console.error('Error refreshing variables:', error);
        }
    }, []);

    // ===================================================================
    // RENDER
    // ===================================================================

    return (
        <div className="final-visual-editor-container">
            {/* Header con información de variables */}
            {variablesEnabled && (
                <div className="editor-variables-header bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                            <span className="text-sm font-medium text-blue-900">Variables Activas</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-blue-700">
                            <span>📦 {variableStats.count} variables</span>
                            <span>•</span>
                            <span>🔌 {variableStats.providers} providers</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <span className="text-xs text-blue-600">💡 Escribe <code className="bg-blue-100 px-1 rounded">{'{{'}</code> para ver variables</span>
                        <button 
                            onClick={handleRefreshVariables}
                            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                            title="Refrescar variables"
                        >
                            🔄 Refresh
                        </button>
                    </div>
                </div>
            )}
            
            {/* Editor principal */}
            <div className="editor-content" style={{ height: variablesEnabled ? 'calc(100% - 50px)' : '100%' }}>
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
        </div>
    );
};

// ===================================================================
// DEBUG HELPERS MEJORADOS
// ===================================================================

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Extender debug existente con funciones optimizadas
    window.debugEditor = {
        ...window.debugEditor, // Mantener funciones existentes
        
        // VARIABLES - Funciones mejoradas
        showVariables() {
            const variablesPlugin = window.pluginManager?.get('variables');
            if (!variablesPlugin) {
                console.log('❌ Variables plugin no encontrado');
                return;
            }
            
            const allVars = variablesPlugin.getAllVariables();
            console.log('🎯 Variables disponibles:');
            console.table(allVars);
            return allVars;
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

        testAutoComplete() {
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
            
            console.log('✅ Autocompletado activado - escribe para ver sugerencias');
        },

        refreshVariables() {
            invalidateVariableCache();
            window.dispatchEvent(new CustomEvent('variablesForceRefresh'));
            console.log('🔄 Cache de variables refrescado');
        },

        variableStats() {
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
        },

        validateVariablesInEditor() {
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
                variables.push(match[1].trim());
            }
            
            console.log('🔍 Variables encontradas en el código:', variables);
            
            const variablesPlugin = window.pluginManager?.get('variables');
            if (variablesPlugin) {
                const allVars = variablesPlugin.getAllVariables();
                const available = [];
                Object.values(allVars).forEach(provider => {
                    available.push(...Object.keys(provider.variables || {}));
                });
                console.log('✅ Variables disponibles:', available);
                
                const missing = variables.filter(v => !available.includes(v));
                const valid = variables.filter(v => available.includes(v));
                
                console.log('✅ Variables válidas:', valid);
                if (missing.length > 0) {
                    console.warn('⚠️ Variables no encontradas:', missing);
                } else {
                    console.log('🎉 Todas las variables están disponibles');
                }
                
                return { valid, missing, total: variables.length };
            }
        }
    };

    console.log('🔧 Debug editor optimizado disponible: window.debugEditor');
}

export default FinalVisualEditor;
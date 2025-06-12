// resources/js/block-builder/components/FinalVisualEditor.jsx

import { useCallback, useMemo, useRef, useEffect } from 'preact/hooks';
import CodeMirror from '@uiw/react-codemirror';
import { createCodeMirrorExtensions } from '../extensions/CodeMirrorExtensions.js';
import { StateEffect } from '@codemirror/state';

const FinalVisualEditor = ({
    initialContent = '',
    onContentChange,
    theme = 'light'
}) => {
    const debounceTimeoutRef = useRef(null);
    const lastContentRef = useRef(initialContent);
    const isExternalUpdateRef = useRef(false);
    const viewRef = useRef(null);

    // Manejo optimizado de cambios con debounce
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

    // Extensiones con soporte para snippets de plugins
    const extensions = useMemo(() => {
        return createCodeMirrorExtensions([], [], theme);
    }, [theme]);

    // Actualizar extensiones cuando cambien los plugins
    useEffect(() => {
        const updateExtensions = () => {
            if (viewRef.current) {
                const newExtensions = createCodeMirrorExtensions([], [], theme);
                viewRef.current.dispatch({
                    effects: StateEffect.reconfigure.of(newExtensions)
                });
                console.log('🔄 Editor extensions updated with plugin snippets');
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
    }, [theme]);

    // Control de actualizaciones externas
    const currentValue = useRef(initialContent);
    if (initialContent !== lastContentRef.current && initialContent !== currentValue.current) {
        currentValue.current = initialContent;
        lastContentRef.current = initialContent;
        isExternalUpdateRef.current = true;
    }

    // Cleanup
    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    // Capturar referencia del editor para debug
    const onCreateEditor = useCallback((view) => {
        viewRef.current = view;
        window.currentEditor = view; // Para debug
    }, []);

    return (
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
    );
};

// Debug helpers
if (process.env.NODE_ENV === 'development') {
    window.debugEditor = {
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
        }
    };

    console.log('🔧 Debug editor: window.debugEditor');
}

export default FinalVisualEditor;
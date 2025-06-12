// ===================================================================
// resources/js/block-builder/components/IntegratedPageBuilderEditor.jsx 
// ACTUALIZADO CON PANEL DE VARIABLES
// ===================================================================

import { useCallback, useRef, useState } from 'preact/hooks';
import FinalVisualEditor from './FinalVisualEditor';
import TemplateManager from './TemplateManager';
import VariablesPanel from './VariablesPanel';
import usePluginPreview from '../hooks/usePluginPreview';

const IntegratedPageBuilderEditor = ({ initialContent, onContentChange, onSaveTemplate }) => {
    
    const { previewRef, updatePreview } = usePluginPreview();
    const lastNotifiedContentRef = useRef(initialContent);
    const editorRef = useRef(null);
    
    // Estado para el panel de variables
    const [showVariablesPanel, setShowVariablesPanel] = useState(false);

    const handleContentChange = useCallback((newContent) => {
        if (newContent === lastNotifiedContentRef.current) {
            return;
        }

        lastNotifiedContentRef.current = newContent;

        if (onContentChange) {
            onContentChange(newContent);
        }
        
        updatePreview(newContent);
    }, [onContentChange, updatePreview]);

    const handleSave = useCallback(() => {
        console.log("Guardando plantilla...");
        onSaveTemplate?.();
    }, [onSaveTemplate]);

    const handleLoad = useCallback((templateName) => {
        console.log(`Cargando plantilla: ${templateName}`);
    }, []);
    
    const handleDelete = useCallback(() => {
        console.log("Eliminando plantilla...");
    }, []);

    // Manejar inserción de variables
    const handleInsertVariable = useCallback((formattedVariable, variablePath) => {
        if (editorRef.current) {
            // Si tenemos referencia al editor CodeMirror
            const editor = editorRef.current;
            if (editor.view) {
                const cursor = editor.view.state.selection.main.head;
                editor.view.dispatch({
                    changes: {
                        from: cursor,
                        insert: formattedVariable
                    },
                    selection: { anchor: cursor + formattedVariable.length }
                });
                editor.view.focus();
            }
        }
        
        console.log(`✅ Variable insertada: ${formattedVariable}`);
    }, []);

    // Función para abrir el panel de variables
    const openVariablesPanel = useCallback(() => {
        setShowVariablesPanel(true);
    }, []);

    // Función para cerrar el panel de variables
    const closeVariablesPanel = useCallback(() => {
        setShowVariablesPanel(false);
    }, []);

    // Debug de variables (solo en desarrollo)
    const debugVariables = useCallback(() => {
        if (process.env.NODE_ENV === 'development') {
            const variablesPlugin = window.pluginManager?.get('variables');
            if (variablesPlugin) {
                console.log('🎯 Variables disponibles:', variablesPlugin.getAvailableVariables());
                console.log('🔧 Plugin de variables:', variablesPlugin);
            } else {
                console.log('❌ Plugin de variables no disponible');
            }
        }
    }, []);

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: 'calc(100vh - 100px)', 
            fontFamily: 'sans-serif' 
        }}>
            
            <TemplateManager
                onSave={handleSave}
                onLoad={handleLoad}
                onDelete={handleDelete}
            />

            <div style={{ 
                display: 'flex', 
                flex: 1, 
                gap: '1rem', 
                padding: '1rem',
                overflow: 'hidden'
            }}>
                
                <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    minWidth: 0
                }}>
                    {/* Header del Editor con botones */}
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '1rem' 
                    }}>
                        <h3 style={{ margin: 0 }}>Editor</h3>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {/* Botón de Variables */}
                            <button
                                onClick={openVariablesPanel}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '8px 12px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                                onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                                title="Insertar variables dinámicas"
                            >
                                🎯 Variables
                            </button>

                            {/* Botón de Debug (solo en desarrollo) */}
                            {process.env.NODE_ENV === 'development' && (
                                <button
                                    onClick={debugVariables}
                                    style={{
                                        padding: '8px 12px',
                                        backgroundColor: '#6b7280',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                    }}
                                    title="Debug variables (desarrollo)"
                                >
                                    🔧 Debug
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={{ 
                        flex: 1, 
                        border: '1px solid #ccc', 
                        borderRadius: '4px', 
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        <FinalVisualEditor 
                            ref={editorRef}
                            initialContent={initialContent} 
                            onContentChange={handleContentChange}
                            theme="light"
                        />
                    </div>

                    {/* Información sobre variables */}
                    <div style={{
                        marginTop: '0.5rem',
                        padding: '0.75rem',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#64748b'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>💡</span>
                            <span>
                                <strong>Variables:</strong> Usa <code style={{ 
                                    backgroundColor: '#e2e8f0', 
                                    padding: '2px 6px', 
                                    borderRadius: '3px',
                                    fontFamily: 'monospace'
                                }}>{'{{ variable.name }}'}</code> para contenido dinámico
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    minWidth: 0
                }}>
                    <h3 style={{ margin: '0 0 1rem 0' }}>Vista Previa</h3>
                    <iframe
                        ref={previewRef}
                        title="Preview"
                        style={{ 
                            width: '100%', 
                            height: '100%', 
                            border: '1px solid #ccc', 
                            borderRadius: '4px', 
                            background: 'white'
                        }}
                    />
                </div>
            </div>

            {/* Panel de Variables */}
            <VariablesPanel
                visible={showVariablesPanel}
                onClose={closeVariablesPanel}
                onInsertVariable={handleInsertVariable}
            />
        </div>
    );
};

export default IntegratedPageBuilderEditor;
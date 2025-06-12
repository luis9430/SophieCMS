// resources/js/block-builder/components/IntegratedPageBuilderEditor.jsx - ACTUALIZADO

import { useCallback, useRef } from 'preact/hooks';
import FinalVisualEditor from './FinalVisualEditor';
import TemplateManager from './TemplateManager';
import usePluginPreview from '../hooks/usePluginPreview'; // CAMBIADO

const IntegratedPageBuilderEditor = ({ initialContent, onContentChange, onSaveTemplate }) => {
    
    const { previewRef, updatePreview } = usePluginPreview(); // CAMBIADO
    const lastNotifiedContentRef = useRef(initialContent);

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
                    <h3 style={{ margin: '0 0 1rem 0' }}>Editor</h3>
                    <div style={{ 
                        flex: 1, 
                        border: '1px solid #ccc', 
                        borderRadius: '4px', 
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        <FinalVisualEditor 
                            initialContent={initialContent} 
                            onContentChange={handleContentChange}
                            theme="light"
                        />
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
        </div>
    );
};

export default IntegratedPageBuilderEditor;
// ===================================================================
// resources/js/block-builder/components/IntegratedPageBuilderEditor.jsx 
// CORREGIDO - handleLoad funcionando
// ===================================================================

import { useCallback, useRef, useState } from 'preact/hooks';
import FinalVisualEditor from './FinalVisualEditor';
import TemplateManager from './TemplateManager';
import usePluginPreview from '../hooks/usePluginPreview';

const IntegratedPageBuilderEditor = ({ initialContent, onContentChange, onSaveTemplate }) => {
    
    const { previewRef, updatePreview } = usePluginPreview();
    const lastNotifiedContentRef = useRef(initialContent);
    
    // Estados para el TemplateManager
    const [currentContent, setCurrentContent] = useState(initialContent || '');
    const [currentType, setCurrentType] = useState('html');

    const handleContentChange = useCallback((newContent) => {
        if (newContent === lastNotifiedContentRef.current) {
            return;
        }

        lastNotifiedContentRef.current = newContent;
        setCurrentContent(newContent); // Actualizar estado local

        if (onContentChange) {
            onContentChange(newContent);
        }
        
        updatePreview(newContent);
    }, [onContentChange, updatePreview]);

    const handleSave = useCallback(() => {
        console.log("Guardando plantilla...");
        onSaveTemplate?.();
    }, [onSaveTemplate]);

    // ✅ CORREGIDO: Recibe el objeto template completo
    const handleLoad = useCallback((template) => {
        console.log('🔍 Template recibido:', {
            id: template.id,
            name: template.name,
            type: template.type,
            hasCode: !!template.code,
            hasContent: !!template.content,
            codeLength: template.code?.length || 0,
            contentLength: template.content?.length || 0
        });
        
        // Obtener el contenido del template
        const templateContent = template.code || template.content || '';
        
        if (templateContent) {
            console.log('📄 Cargando contenido en editor:', templateContent.substring(0, 100) + '...');
            
            // Actualizar el contenido del editor
            handleContentChange(templateContent);
            
            // Actualizar tipo si está disponible
            if (template.type) {
                setCurrentType(template.type);
            }
            
            console.log('✅ Template cargado exitosamente:', template.name);
        } else {
            console.warn('⚠️ Template sin contenido:', template.name);
        }
    }, [handleContentChange]);
    
    const handleDelete = useCallback((templateId) => {
        console.log("🗑️ Eliminando plantilla:", templateId);
        // Aquí podrías agregar lógica adicional si es necesario
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
                currentContent={currentContent}
                currentType={currentType}
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
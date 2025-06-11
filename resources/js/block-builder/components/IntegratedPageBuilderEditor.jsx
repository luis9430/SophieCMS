// resources/js/block-builder/components/IntegratedPageBuilderEditor.jsx

import { useCallback } from 'preact/hooks';

// Componentes hijos que ahora tienen sus propias responsabilidades
import FinalVisualEditor from './FinalVisualEditor';
import TemplateManager from './TemplateManager'; // Lo añadiremos a continuación
import useAlpinePreview from '../hooks/useAlpinePreview';

/**
 * 🚀 EDITOR COMPLETO INTEGRADO (Refactorizado)
 * Este componente organiza los paneles principales de la interfaz:
 * 1. El gestor de plantillas (TemplateManager).
 * 2. El editor de código (FinalVisualEditor).
 * 3. El panel de previsualización en tiempo real (iframe).
 * * Ya no maneja lógica interna de CodeMirror, esa responsabilidad
 * ahora vive en FinalVisualEditor y en los plugins.
 */
const IntegratedPageBuilderEditor = ({ initialContent, onContentChange, onSaveTemplate }) => {
    
    // Hook para la previsualización: nos da una referencia al iframe y una función para actualizarlo.
    const { previewRef, updatePreview } = useAlpinePreview(initialContent);

    // Callback que se ejecuta cuando el contenido del editor cambia.
    const handleContentChange = useCallback((newContent) => {
        // 1. Notifica al componente padre sobre el cambio.
        if (onContentChange) {
            onContentChange(newContent);
        }
        // 2. Actualiza el panel de previsualización.
        updatePreview(newContent);
    }, [onContentChange, updatePreview]);

    // Lógica para el manejo de plantillas (la conectaremos a la API en el siguiente paso)
    const handleSave = () => {
        console.log("Guardando plantilla...");
        // Aquí llamaremos a window.templateEngine.save()
        onSaveTemplate();
    };

    const handleLoad = (templateName) => {
        console.log(`Cargando plantilla: ${templateName}`);
        // Aquí llamaremos a window.templateEngine.load()
    };
    
    const handleDelete = () => {
        console.log("Eliminando plantilla...");
        // Aquí llamaremos a window.templateEngine.delete()
    };


    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', fontFamily: 'sans-serif' }}>
            
            {/* === BARRA DE GESTIÓN DE PLANTILLAS (Paso 3) === */}
            <TemplateManager
                onSave={handleSave}
                onLoad={handleLoad}
                onDelete={handleDelete}
            />

            <div style={{ display: 'flex', flex: 1, gap: '1rem', padding: '1rem' }}>
                {/* === Columna del Editor === */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: '0 0 1rem 0' }}>Editor</h3>
                    <div style={{ flex: 1, border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
                        {/* El componente FinalVisualEditor ahora encapsula toda la complejidad de CodeMirror */}
                        <FinalVisualEditor 
                            initialContent={initialContent} 
                            onContentChange={handleContentChange} 
                        />
                    </div>
                </div>

                {/* === Columna de la Preview === */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: '0 0 1rem 0' }}>Vista Previa</h3>
                    <iframe
                        ref={previewRef}
                        title="Preview"
                        style={{ width: '100%', height: '100%', border: '1px solid #ccc', borderRadius: '4px', background: 'white' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default IntegratedPageBuilderEditor;
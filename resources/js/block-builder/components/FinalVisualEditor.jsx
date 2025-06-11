// resources/js/block-builder/components/FinalVisualEditor.jsx

import { useCallback, useMemo } from 'preact/hooks';
import CodeMirror from '@uiw/react-codemirror';

// 1. IMPORTACIÓN CORREGIDA Y ÚNICA:
//    Apunta directamente al archivo centralizado en la carpeta /extensions.
import { createEditorExtensions } from '../extensions/CodeMirrorExtensions.js'; 

/**
 * 🎨 EDITOR VISUAL FINAL (Versión Refactorizada)
 *
 * Este componente es el núcleo del editor de texto. Su única responsabilidad
 * es renderizar CodeMirror y configurarlo con las extensiones que vienen del
 * sistema de plugins.
 *
 * Se han eliminado:
 * - Verificaciones del estado del sistema (eso lo hace CoreSystemInitializer).
 * - Lógica de autocompletado y validación (eso ahora vive en los plugins y se carga
 * a través de `createEditorExtensions`).
 * - Barras de herramientas y de estado (eso pertenece al layout, en IntegratedPageBuilderEditor).
 * - Importaciones duplicadas o incorrectas.
 */
const FinalVisualEditor = ({
    initialContent = '',
    onContentChange,
    theme = 'light' // Acepta 'light' o 'dark'
}) => {

    // 2. SIMPLIFICACIÓN DE `onChange`:
    //    Usa `useCallback` para optimizar. Simplemente notifica al componente padre del cambio.
    const handleChange = useCallback((value) => {
        if (onContentChange) {
            onContentChange(value);
        }
    }, [onContentChange]);

    // 3. CENTRALIZACIÓN DE EXTENSIONES:
    //    Usa `useMemo` para crear las extensiones una sola vez, a menos que el tema cambie.
    //    Toda la complejidad de `createUnifiedLinter`, `createUnifiedAutocompletion`, etc.,
    //    ya está encapsulada dentro de `createEditorExtensions`.
    const extensions = useMemo(() => {
        return createEditorExtensions({ theme });
    }, [theme]);

    // 4. RENDER LIMPIO:
    //    El componente ahora solo renderiza CodeMirror. No más toolbars, status bars, o overlays.
    return (
        <CodeMirror
            value={initialContent}
            height="100%"
            style={{ height: '100%', fontSize: '14px' }}
            extensions={extensions}
            onChange={handleChange}
            basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                dropCursor: true,
                allowMultipleSelections: true,
                indentOnInput: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: false, // Deshabilitado porque nuestro plugin lo gestiona.
                highlightActiveLine: true,
                highlightSelectionMatches: true,
                searchKeymap: true,
                tabSize: 2
            }}
        />
    );
};

export default FinalVisualEditor;
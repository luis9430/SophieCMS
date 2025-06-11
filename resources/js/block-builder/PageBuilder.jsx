// resources/js/block-builder/PageBuilder.jsx

import { useState, useEffect, useCallback } from 'preact/hooks';
//import 'construct-style-sheets-polyfill';
import IntegratedPageBuilderEditor from './components/IntegratedPageBuilderEditor'; // <-- Importamos directamente
import { initializeCoreSystem } from './core/CoreSystemInitializer'; // Fixed import name

const PageBuilder = ({ content: initialContent, onContentChange }) => {
    const [isReady, setIsReady] = useState(false);
    const [editorContent, setEditorContent] = useState(initialContent || '');

    useEffect(() => {
        // Updated function name here as well
        initializeCoreSystem().then(() => {
            console.log("Block Builder Core Systems Initialized.");
            setIsReady(true);
        });
    }, []);
    
    const handleContentUpdate = useCallback((newContent) => {
        setEditorContent(newContent);
        if (onContentChange) {
            onContentChange(newContent);
        }
    }, [onContentChange]);

    if (!isReady) {
        return <div>Loading Page Builder...</div>;
    }

    return (
        <>
            <h1 style={{ padding: '1rem 1rem 0 1rem', fontFamily: 'sans-serif', color: '#333' }}>Page Builder</h1>
            <IntegratedPageBuilderEditor
                initialContent={editorContent}
                onContentChange={handleContentUpdate}
            />
        </>
    );
};

export default PageBuilder;
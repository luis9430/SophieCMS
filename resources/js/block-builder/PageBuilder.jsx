// resources/js/block-builder/PageBuilder.jsx

import { useState, useEffect, useCallback } from 'preact/hooks';
import IntegratedPageBuilderEditor from './components/IntegratedPageBuilderEditor';
import { initializeCoreSystem } from './core/CoreSystemInitializer';

const PageBuilder = ({ content: initialContent, onContentChange }) => {
    const [isReady, setIsReady] = useState(false);
    const [editorContent, setEditorContent] = useState(initialContent || '');

    useEffect(() => {
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
        <div>
            <h1 style={{ padding: '1rem 1rem 0 1rem', fontFamily: 'sans-serif', color: '#333' }}>Page Builder</h1>
            <IntegratedPageBuilderEditor
                initialContent={editorContent}
                onContentChange={handleContentUpdate}
            />
        </div>
    );
};

export default PageBuilder;
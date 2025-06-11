// resources/js/block-builder/hooks/useAlpinePreview.js

import { useRef, useCallback } from 'preact/hooks';
import { getPlugin } from '../core/PluginManager';

const useAlpinePreview = () => {
    const previewRef = useRef(null);

    const updatePreview = useCallback((content) => {
        if (!previewRef.current) return;

        const alpinePlugin = getPlugin('alpine');
        if (alpinePlugin && typeof alpinePlugin.generatePreview === 'function') {
            // El plugin genera el HTML completo para la preview
            const previewHtml = alpinePlugin.generatePreview(content);
            
            const doc = previewRef.current.contentWindow.document;
            doc.open();
            doc.write(previewHtml);
            doc.close();
        } else {
            // Fallback si el plugin no está o no tiene el método
            previewRef.current.srcdoc = content;
        }
    }, []);

    return { previewRef, updatePreview };
};

export default useAlpinePreview;
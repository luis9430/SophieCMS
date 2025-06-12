// resources/js/block-builder/hooks/usePluginPreview.js

import { useRef, useCallback, useEffect } from 'preact/hooks';

const usePluginPreview = () => {
    const previewRef = useRef(null);
    const updateTimeoutRef = useRef(null);
    const lastContentRef = useRef('');

    const updatePreview = useCallback((content) => {
        if (!previewRef.current || content === lastContentRef.current) {
            return;
        }

        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }

        updateTimeoutRef.current = setTimeout(() => {
            try {
                lastContentRef.current = content;
                
                // CORREGIR: Llamar a la función
                const previewHTML = generateUnifiedPreview(content);
                
                // Actualizar iframe
                const doc = previewRef.current.contentWindow.document;
                doc.open();
                doc.write(previewHTML);
                doc.close();

                // Reinicializar Alpine.js para nuevo contenido
                setTimeout(() => {
                    const win = previewRef.current.contentWindow;
                    
                    // Esperar a que Tailwind cargue completamente
                    const waitForTailwind = () => {
                        if (win?.tailwind) {
                            console.log('🎨 Tailwind cargado, reinicializando Alpine');
                            
                            // Reinicializar Alpine
                            if (win?.Alpine) {
                                win.Alpine.initTree(win.document.body);
                                console.log('🔄 Alpine reinitializado');
                            }
                        } else {
                            // Reintentar en 100ms
                            setTimeout(waitForTailwind, 100);
                        }
                    };
                    
                    waitForTailwind();
                }, 150);

            } catch (error) {
                console.error('Error updating preview:', error);
            }
        }, 1000);

    }, []);

    useEffect(() => {
        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, []);

    return { previewRef, updatePreview };
};

/**
 * Genera preview unificado combinando todos los plugins
 */
const generateUnifiedPreview = (content) => {
    const baseTemplate = getBaseTemplate();
    const pluginTemplates = getPluginTemplates();
    const combinedScripts = combinePluginScripts(pluginTemplates);
    
    // Procesar variables en el contenido
    let processedContent = content;
    if (window.processVariables) {
        processedContent = window.processVariables(content);
    }
    
    return baseTemplate
        .replace('{{PLUGIN_SCRIPTS}}', combinedScripts)
        .replace('{{CONTENT}}', processedContent);
};

/**
 * Template base HTML
 */
const getBaseTemplate = () => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    
    {{PLUGIN_SCRIPTS}}
    
    <style>
        [x-cloak] { display: none !important; }
        body { 
            font-family: system-ui, sans-serif; 
            padding: 1rem; 
            margin: 0;
            background: white;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        {{CONTENT}}
    </div>
</body>
</html>
`;

/**
 * Obtener templates de todos los plugins activos
 */
const getPluginTemplates = () => {
    const templates = [];
    
    if (window.pluginManager) {
        const plugins = window.pluginManager.list();
        
        plugins.forEach(pluginInfo => {
            const plugin = window.pluginManager.get(pluginInfo.name);
            if (plugin && plugin.getPreviewTemplate) {
                templates.push({
                    name: pluginInfo.name,
                    priority: plugin.previewPriority || 50,
                    template: plugin.getPreviewTemplate()
                });
            }
        });
    }
    
    return templates.sort((a, b) => b.priority - a.priority);
};

/**
 * Combinar scripts de plugins en orden correcto
 */
const combinePluginScripts = (pluginTemplates) => {
    return pluginTemplates
        .map(({ name, template }) => {
            return `<!-- ${name.toUpperCase()} PLUGIN -->\n${template}\n`;
        })
        .join('\n');
};

// Debug helpers
if (process.env.NODE_ENV === 'development') {
    window.debugPreviewSystem = {
        listPlugins() {
            if (!window.pluginManager) {
                console.log('❌ PluginManager no disponible');
                return;
            }
            
            const plugins = window.pluginManager.list();
            console.log('🔌 Plugins activos:', plugins);
            
            plugins.forEach(plugin => {
                const instance = window.pluginManager.get(plugin.name);
                console.log(`📦 ${plugin.name}:`, {
                    hasPreviewTemplate: !!instance?.getPreviewTemplate,
                    priority: instance?.previewPriority || 50
                });
            });
        },
        
        showPreviewTemplate() {
            const templates = getPluginTemplates();
            console.log('📄 Templates:', templates);
            
            const combined = combinePluginScripts(templates);
            console.log('🔗 Combined:', combined);
        },
        
        testPreview(content = '<div x-data="{ test: true }">Test: <span x-text="test"></span></div>') {
            const html = generateUnifiedPreview(content);
            console.log('🎨 Preview HTML:', html);
            
            const newWindow = window.open('', '_blank');
            newWindow.document.write(html);
            newWindow.document.close();
        }
    };
    
    console.log('🔧 Debug preview system: window.debugPreviewSystem');
}

export default usePluginPreview;
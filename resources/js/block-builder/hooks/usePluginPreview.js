// resources/js/block-builder/hooks/usePluginPreview.js - ACTUALIZADO

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
                
                // ACTUALIZADO: Procesar tanto variables como templates
                const processedContent = processContentWithAll(content);
                
                // Generar HTML completo del preview
                const previewHTML = generateUnifiedPreview(processedContent);
                
                // Actualizar iframe
                const doc = previewRef.current.contentWindow.document;
                doc.open();
                doc.write(previewHTML);
                doc.close();

                // Reinicializar sistemas después de cargar contenido
                setTimeout(() => {
                    initializePreviewSystems(previewRef.current.contentWindow);
                }, 200);

            } catch (error) {
                console.error('❌ Error updating preview:', error);
            }
        }, 800);

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

// NUEVO: Procesamiento unificado de contenido
const processContentWithAll = (content) => {
    try {
        let processed = content;
        
        // 1. Procesar templates Liquid primero
        processed = processLiquidTemplates(processed);
        
        // 2. Procesar variables después
        processed = processContentWithVariables(processed);
        
        return processed;
        
    } catch (error) {
        console.error('❌ Error processing content:', error);
        return content;
    }
};

// NUEVO: Procesamiento de templates Liquid
const processLiquidTemplates = (content) => {
    try {
        const templatesPlugin = window.pluginManager?.get('templates');
        if (templatesPlugin && templatesPlugin.renderTemplate) {
            
            // Datos de ejemplo para el preview
            const previewData = {
                // Variables de usuario
                user: {
                    name: 'María García',
                    email: 'maria@demo.com',
                    role: 'admin'
                },
                
                // Variables del sitio
                site: {
                    title: 'Page Builder Pro',
                    description: 'Crea páginas increíbles',
                    url: window.location.origin
                },
                
                // Variables de tiempo
                current: {
                    time: new Date().toLocaleTimeString('es-ES'),
                    date: new Date().toLocaleDateString('es-ES'),
                    year: new Date().getFullYear()
                },
                
                // Datos de ejemplo para templates
                title: 'Bienvenido al Page Builder',
                subtitle: 'Crea experiencias increíbles',
                description: 'Con nuestro editor visual puedes crear páginas web profesionales de manera rápida y sencilla.',
                image: 'https://via.placeholder.com/400x200/3b82f6/ffffff?text=Demo+Image',
                price: 29.99,
                button_text: 'Empezar ahora',
                button_url: '#demo',
                
                // Array de productos para loops
                products: [
                    { name: 'Producto 1', price: 19.99, image: 'https://via.placeholder.com/200x200' },
                    { name: 'Producto 2', price: 29.99, image: 'https://via.placeholder.com/200x200' },
                    { name: 'Producto 3', price: 39.99, image: 'https://via.placeholder.com/200x200' }
                ]
            };
            
            // Renderizar template con datos
            return templatesPlugin.renderTemplate(content, previewData)
                .then(rendered => rendered)
                .catch(error => {
                    console.warn('⚠️ Liquid template rendering failed:', error);
                    return content; // Fallback al contenido original
                });
        }
        
        return content;
        
    } catch (error) {
        console.error('❌ Error processing Liquid templates:', error);
        return content;
    }
};

// Mantener función existente de variables (sin cambios)
const processContentWithVariables = (content) => {
    try {
        const variablesPlugin = window.pluginManager?.get('variables');
        if (variablesPlugin && variablesPlugin.processVariables) {
            const processed = variablesPlugin.processVariables(content);
            
            const originalVars = (content.match(/\{\{[^}]+\}\}/g) || []).length;
            const remainingVars = (processed.match(/\{\{[^}]+\}\}/g) || []).length;
            
            if (originalVars > 0) {
                console.log('🎯 Variables processed:', {
                    original: originalVars,
                    remaining: remainingVars,
                    processed: originalVars - remainingVars
                });
            }
            
            return processed;
        }
        
        return processBasicVariables(content);
        
    } catch (error) {
        console.error('❌ Error processing variables:', error);
        return content;
    }
};

// Mantener función existente (sin cambios)
const processBasicVariables = (content) => {
    if (!content || !content.includes('{{')) {
        return content;
    }
    
    const now = new Date();
    const basicVariables = {
        'app.name': 'Page Builder',
        'app.version': '2.0.0',
        'user.name': 'María García',
        'user.email': 'maria.garcia@demo.com',
        'site.title': 'Page Builder Pro',
        'current.time': now.toLocaleTimeString('es-ES'),
        'current.date': now.toLocaleDateString('es-ES'),
        'current.year': now.getFullYear().toString()
    };

    let processed = content;
    Object.entries(basicVariables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{\\s*${key.replace(/\./g, '\\.')}\\s*\\}\\}`, 'g');
        processed = processed.replace(regex, String(value));
    });

    return processed;
};

// ACTUALIZADO: Template base con Liquid.js
const getBaseTemplate = () => `
<!DOCTYPE html>
<html lang="es">
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
        
        /* Estilos para templates */
        .liquid-error {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 1rem;
            border-radius: 0.5rem;
            margin: 1rem 0;
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

// ACTUALIZADO: Incluir templates en plugins
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

// Mantener resto de funciones sin cambios...
const generateUnifiedPreview = (content) => {
    const baseTemplate = getBaseTemplate();
    const pluginTemplates = getPluginTemplates();
    const combinedScripts = combinePluginScripts(pluginTemplates);
    
    return baseTemplate
        .replace('{{PLUGIN_SCRIPTS}}', combinedScripts)
        .replace('{{CONTENT}}', content);
};

const combinePluginScripts = (pluginTemplates) => {
    return pluginTemplates
        .map(({ name, template }) => {
            return `<!-- ${name.toUpperCase()} PLUGIN -->\n${template}\n`;
        })
        .join('\n');
};

const initializePreviewSystems = (previewWindow) => {
    if (!previewWindow) return;
    
    try {
        const waitForSystems = () => {
            // Esperar a que Tailwind y Liquid carguen
            if (previewWindow?.tailwind && previewWindow?.Liquid) {
                console.log('🎨 Tailwind y Liquid cargados, reinicializando Alpine');
                
                if (previewWindow?.Alpine) {
                    previewWindow.Alpine.initTree(previewWindow.document.body);
                    console.log('🔄 Alpine reinitializado');
                }
            } else {
                setTimeout(waitForSystems, 100);
            }
        };
        
        waitForSystems();
        
    } catch (error) {
        console.error('❌ Error initializing preview systems:', error);
    }
};

// NUEVO: Debug helpers para templates
if (process.env.NODE_ENV === 'development') {
    window.debugTemplatePreview = {
        testTemplateRender(liquidCode = '{% if user.name %}Hello {{ user.name }}!{% endif %}') {
            const templatesPlugin = window.pluginManager?.get('templates');
            if (templatesPlugin) {
                const testData = { user: { name: 'Test User' } };
                templatesPlugin.renderTemplate(liquidCode, testData)
                    .then(result => console.log('🎨 Template result:', result))
                    .catch(error => console.error('❌ Template error:', error));
            } else {
                console.log('❌ Templates plugin not found');
            }
        },
        
        showAvailableTemplates() {
            const templatesPlugin = window.pluginManager?.get('templates');
            if (templatesPlugin) {
                templatesPlugin.listTemplates()
                    .then(templates => console.table(templates))
                    .catch(error => console.error('❌ Error:', error));
            } else {
                console.log('❌ Templates plugin not found');
            }
        }
    };
}

export default usePluginPreview;
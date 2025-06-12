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
                
                // 🎯 PROCESAR VARIABLES ANTES DE GENERAR EL PREVIEW
                const processedContent = processContentWithVariables(content);
                
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

// ===================================================================
// PROCESAMIENTO DE VARIABLES
// ===================================================================

/**
 * Procesar contenido con variables antes del preview
 */
const processContentWithVariables = (content) => {
    try {
        // 🎯 USAR EL PLUGIN DE VARIABLES SI ESTÁ DISPONIBLE
        const variablesPlugin = window.pluginManager?.get('variables');
        if (variablesPlugin && variablesPlugin.processVariables) {
            const processed = variablesPlugin.processVariables(content);
            
            // Log para debugging
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
        
        // 🔄 FALLBACK: PROCESAMIENTO BÁSICO DE VARIABLES
        return processBasicVariables(content);
        
    } catch (error) {
        console.error('❌ Error processing variables:', error);
        return content; // Fallback al contenido original
    }
};

/**
 * Procesamiento básico de variables como fallback
 */
const processBasicVariables = (content) => {
    if (!content || !content.includes('{{')) {
        return content;
    }
    
    // Variables básicas para el preview
    const now = new Date();
    const basicVariables = {
        // App variables
        'app.name': 'Page Builder',
        'app.version': '2.0.0',
        'app.environment': 'preview',
        
        // User variables  
        'user.name': 'María García',
        'user.email': 'maria.garcia@demo.com',
        'user.role': 'admin',
        'user.firstName': 'María',
        'user.lastName': 'García',
        'user.initials': 'MG',
        'user.isAdmin': 'true',
        'user.isLoggedIn': 'true',
        
        // Site variables
        'site.title': 'Page Builder Pro',
        'site.description': 'Crea páginas web increíbles con nuestro editor visual',
        'site.url': window.location.origin,
        'site.domain': window.location.hostname,
        'site.author': 'Equipo Development',
        
        // Current time variables (actualizadas en tiempo real)
        'current.time': now.toLocaleTimeString('es-ES'),
        'current.date': now.toLocaleDateString('es-ES'),
        'current.datetime': now.toLocaleString('es-ES'),
        'current.year': now.getFullYear().toString(),
        'current.month': now.toLocaleDateString('es-ES', { month: 'long' }),
        'current.day': now.getDate().toString(),
        'current.weekday': now.toLocaleDateString('es-ES', { weekday: 'long' }),
        'current.timestamp': now.getTime().toString(),
        'current.iso': now.toISOString(),
        
        // System variables
        'system.timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
        'system.language': navigator.language || 'es-ES',
        'system.platform': navigator.platform,
        'system.viewport.width': window.innerWidth.toString(),
        'system.viewport.height': window.innerHeight.toString(),
        'system.colorScheme': window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
        
        // Templates variables
        'templates.count': '3',
        'templates.latest': 'Landing Hero',
        'templates.latestDate': now.toLocaleDateString('es-ES')
    };

    // Procesar el contenido reemplazando variables
    let processed = content;
    Object.entries(basicVariables).forEach(([key, value]) => {
        // Crear regex que maneje espacios opcionales
        const regex = new RegExp(`\\{\\{\\s*${key.replace(/\./g, '\\.')}\\s*\\}\\}`, 'g');
        processed = processed.replace(regex, String(value));
    });

    return processed;
};

// ===================================================================
// GENERACIÓN DEL PREVIEW UNIFICADO
// ===================================================================

/**
 * Genera preview unificado combinando todos los plugins
 */
const generateUnifiedPreview = (content) => {
    const baseTemplate = getBaseTemplate();
    const pluginTemplates = getPluginTemplates();
    const combinedScripts = combinePluginScripts(pluginTemplates);
    
    return baseTemplate
        .replace('{{PLUGIN_SCRIPTS}}', combinedScripts)
        .replace('{{CONTENT}}', content);
};

/**
 * Template base HTML
 */
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

/**
 * Inicializar sistemas del preview después de cargar contenido
 */
const initializePreviewSystems = (previewWindow) => {
    if (!previewWindow) return;
    
    try {
        // Esperar a que Tailwind cargue completamente
        const waitForTailwind = () => {
            if (previewWindow?.tailwind) {
                console.log('🎨 Tailwind cargado, reinicializando Alpine');
                
                // Reinicializar Alpine
                if (previewWindow?.Alpine) {
                    previewWindow.Alpine.initTree(previewWindow.document.body);
                    console.log('🔄 Alpine reinitializado');
                }
            } else {
                // Reintentar en 100ms
                setTimeout(waitForTailwind, 100);
            }
        };
        
        waitForTailwind();
        
    } catch (error) {
        console.error('❌ Error initializing preview systems:', error);
    }
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
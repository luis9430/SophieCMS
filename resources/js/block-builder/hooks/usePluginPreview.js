// ===================================================================
// resources/js/block-builder/hooks/usePluginPreview.js
// ACTUALIZADO - Integrado con Backend Laravel
// ===================================================================

import { useRef, useCallback, useEffect } from 'preact/hooks';
import templatesApi from '../services/templatesApi.js';

const usePluginPreview = () => {
    const previewRef = useRef(null);
    const updateTimeoutRef = useRef(null);
    const lastContentRef = useRef('');
    const backendPreviewCacheRef = useRef(new Map());

    // ===================================================================
    // FUNCIÓN PRINCIPAL DE ACTUALIZACIÓN
    // ===================================================================

    const updatePreview = useCallback((content) => {
        if (!previewRef.current || content === lastContentRef.current) {
            return;
        }

        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }

        updateTimeoutRef.current = setTimeout(async () => {
            try {
                lastContentRef.current = content;
                
                // NUEVO: Procesar contenido con backend si es necesario
                const processedContent = await processContentWithBackend(content);
                
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
                // Fallback a procesamiento solo frontend
                fallbackToClientPreview(content);
            }
        }, 800);

    }, []);

    // ===================================================================
    // PROCESAMIENTO CON BACKEND
    // ===================================================================

    const processContentWithBackend = async (content) => {
        let processed = content;
        
        try {
            // 1. DETECTAR TEMPLATES DE BLOQUES (Laravel Blade syntax)
            if (content.includes('{{') || content.includes('{%')) {
                processed = await processBackendTemplates(processed);
            }
            
            // 2. PROCESAR TEMPLATES LIQUID (Frontend)
            processed = await processLiquidTemplates(processed);
            
            // 3. PROCESAR VARIABLES (Frontend)
            processed = processContentWithVariables(processed);
            
            return processed;
            
        } catch (error) {
            console.error('❌ Error processing with backend:', error);
            // Fallback a solo procesamiento frontend
            return processContentWithFrontendOnly(content);
        }
    };

    const processBackendTemplates = async (content) => {
        try {
            // Detectar si hay sintaxis de Blade o bloques específicos
            const hasBladeTemplates = content.match(/\{\{\s*\$config\[.*?\]\s*\}\}/g) || 
                                     content.match(/@\w+/g);
            
            if (!hasBladeTemplates) {
                return content;
            }

            // Cache para evitar llamadas repetidas
            const cacheKey = btoa(content).substring(0, 32);
            if (backendPreviewCacheRef.current.has(cacheKey)) {
                return backendPreviewCacheRef.current.get(cacheKey);
            }

            // Llamar al backend para procesar template
            const response = await templatesApi.previewBlockTemplate(
                content,
                getPreviewConfig(),
                getPreviewStyles()
            );

            const processedHtml = response.html || response.rendered || content;
            
            // Guardar en cache por 2 minutos
            backendPreviewCacheRef.current.set(cacheKey, processedHtml);
            setTimeout(() => {
                backendPreviewCacheRef.current.delete(cacheKey);
            }, 2 * 60 * 1000);

            return processedHtml;

        } catch (error) {
            console.error('❌ Backend template processing failed:', error);
            return content; // Fallback al contenido original
        }
    };

    // ===================================================================
    // CONFIGURACIONES DE PREVIEW
    // ===================================================================

    const getPreviewConfig = () => ({
        // Datos de ejemplo para bloques
        title: 'Título de Ejemplo',
        subtitle: 'Subtítulo descriptivo',
        content: 'Este es el contenido de ejemplo para el preview.',
        buttonText: 'Botón de Acción',
        buttonUrl: '#demo',
        imageUrl: 'https://via.placeholder.com/600x400/3b82f6/ffffff?text=Imagen',
        
        // Datos dinámicos
        currentDate: new Date().toLocaleDateString('es-ES'),
        currentTime: new Date().toLocaleTimeString('es-ES'),
        currentYear: new Date().getFullYear(),
        
        // Datos de usuario de ejemplo
        userName: 'Usuario Demo',
        userEmail: 'demo@pagebuilder.com',
    });

    const getPreviewStyles = () => ({
        textAlign: 'center',
        padding: 'md',
        margin: 'sm',
        backgroundColor: 'white',
        textColor: 'gray-800',
        borderRadius: 'md',
        shadow: 'sm'
    });

    // ===================================================================
    // PROCESAMIENTO SOLO FRONTEND (FALLBACK)
    // ===================================================================

    const processContentWithFrontendOnly = (content) => {
        let processed = content;
        
        try {
            // 1. Procesar templates Liquid
            processed = processLiquidTemplates(processed);
            
            // 2. Procesar variables
            processed = processContentWithVariables(processed);
            
            return processed;
            
        } catch (error) {
            console.error('❌ Frontend processing failed:', error);
            return content;
        }
    };

    const fallbackToClientPreview = (content) => {
        try {
            const processedContent = processContentWithFrontendOnly(content);
            const previewHTML = generateUnifiedPreview(processedContent);
            
            const doc = previewRef.current.contentWindow.document;
            doc.open();
            doc.write(previewHTML);
            doc.close();

            setTimeout(() => {
                initializePreviewSystems(previewRef.current.contentWindow);
            }, 200);

        } catch (error) {
            console.error('❌ Fallback preview failed:', error);
        }
    };

    // ===================================================================
    // PROCESAMIENTO LIQUID (MANTENER FUNCIONALIDAD EXISTENTE)
    // ===================================================================

    const processLiquidTemplates = async (content) => {
        try {
            const templatesPlugin = window.pluginManager?.get('templates');
            if (templatesPlugin && templatesPlugin.renderTemplate) {
                
                // Datos de ejemplo mejorados
                const previewData = {
                    ...getPreviewConfig(),
                    
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
                    
                    // Datos de usuario
                    user: {
                        name: 'María García',
                        email: 'maria@demo.com',
                        role: 'admin'
                    }
                };

                return await templatesPlugin.renderTemplate(content, previewData);
            }
            
            return content;
            
        } catch (error) {
            console.error('❌ Liquid template processing failed:', error);
            return content;
        }
    };

    // ===================================================================
    // PROCESAMIENTO DE VARIABLES (MANTENER FUNCIONALIDAD EXISTENTE)
    // ===================================================================

    const processContentWithVariables = (content) => {
        try {
            const variablesPlugin = window.pluginManager?.get('variables');
            if (variablesPlugin && variablesPlugin.processContent) {
                return variablesPlugin.processContent(content);
            }

            // Fallback al procesamiento básico de variables
            return processBasicVariables(content);
            
        } catch (error) {
            console.error('❌ Variables processing failed:', error);
            return content;
        }
    };

    const processBasicVariables = (content) => {
        const variables = {
            'app.name': 'Page Builder',
            'current.date': new Date().toLocaleDateString('es-ES'),
            'current.time': new Date().toLocaleTimeString('es-ES'),
            'current.year': new Date().getFullYear().toString()
        };

        let processed = content;
        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`\\{\\{\\s*${key.replace('.', '\\.')}\\s*\\}\\}`, 'g');
            processed = processed.replace(regex, String(value));
        });

        return processed;
    };

    // ===================================================================
    // GENERACIÓN DE HTML COMPLETO (MANTENER FUNCIONALIDAD EXISTENTE)
    // ===================================================================

    const generateUnifiedPreview = (content) => {
        const baseTemplate = getBaseTemplate();
        const pluginTemplates = getPluginTemplates();
        const combinedScripts = combinePluginScripts(pluginTemplates);
        
        return baseTemplate
            .replace('{{PLUGIN_SCRIPTS}}', combinedScripts)
            .replace('{{CONTENT}}', content);
    };

    const getBaseTemplate = () => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    
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
        .liquid-error, .blade-error {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 1rem;
            border-radius: 0.5rem;
            margin: 1rem 0;
        }

        .preview-container {
            min-height: 200px;
        }
        
        /* Estilos para bloques de ejemplo */
        .hero-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 4rem 2rem;
            text-align: center;
            border-radius: 0.5rem;
        }
        
        .card {
            background: white;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            padding: 1.5rem;
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

    const combinePluginScripts = (pluginTemplates) => {
        return pluginTemplates
            .map(({ name, template }) => {
                return `<!-- ${name.toUpperCase()} PLUGIN -->\n${template}\n`;
            })
            .join('\n');
    };

    // ===================================================================
    // INICIALIZACIÓN DE SISTEMAS (MANTENER FUNCIONALIDAD EXISTENTE)
    // ===================================================================

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

    // ===================================================================
    // CLEANUP
    // ===================================================================

    useEffect(() => {
        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
            // Limpiar cache al desmontar
            backendPreviewCacheRef.current.clear();
        };
    }, []);

    // ===================================================================
    // DEBUG HELPERS (DEVELOPMENT)
    // ===================================================================

    if (process.env.NODE_ENV === 'development') {
        window.debugIntegratedPreview = {
            async testBackendTemplate(template = '{{ $config["title"] ?? "Test Title" }}') {
                const result = await processBackendTemplates(template);
                console.log('🎨 Backend template result:', result);
                return result;
            },
            
            async testLiquidTemplate(template = '{% if user.name %}Hello {{ user.name }}!{% endif %}') {
                const result = await processLiquidTemplates(template);
                console.log('💧 Liquid template result:', result);
                return result;
            },
            
            showCache() {
                console.table([...backendPreviewCacheRef.current.entries()]);
            },
            
            clearCache() {
                backendPreviewCacheRef.current.clear();
                console.log('🗑️ Preview cache cleared');
            }
        };
    }

    return { previewRef, updatePreview };
};

export default usePluginPreview;
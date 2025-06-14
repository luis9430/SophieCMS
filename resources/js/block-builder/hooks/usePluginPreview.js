// ===================================================================
// resources/js/block-builder/hooks/usePluginPreview.js
// CORRECCIONES para errores de consola
// ===================================================================

import { useRef, useCallback, useEffect } from 'preact/hooks';
import templatesApi from '../services/templatesApi.js';
import VariablesPreviewProcessor, { createVariablesDebugger } from '../plugins/variables/PreviewProcessor.js';

const usePluginPreview = () => {
    const previewRef = useRef(null);
    const updateTimeoutRef = useRef(null);
    const lastContentRef = useRef('');
    const backendPreviewCacheRef = useRef(new Map());
    const variablesProcessorRef = useRef(null);

    // ===================================================================
    // INICIALIZACIÓN DEL PROCESADOR DE VARIABLES (SIN CAMBIOS)
    // ===================================================================

    useEffect(() => {
        const initVariablesProcessor = async () => {
            try {
                const maxWait = 5000;
                const startTime = Date.now();
                
                while (!window.pluginManager?.get('variables') && (Date.now() - startTime) < maxWait) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                const variablesPlugin = window.pluginManager?.get('variables');
                if (variablesPlugin) {
                    variablesProcessorRef.current = new VariablesPreviewProcessor(variablesPlugin);
                    
                    variablesProcessorRef.current.addListener((event, data) => {
                        if (lastContentRef.current) {
                            console.log(`🔄 Auto-refreshing preview due to ${event}`);
                            updatePreview(lastContentRef.current, true);
                        }
                    });
                    
                    window.addEventListener('variablesForceRefresh', () => {
                        if (lastContentRef.current) {
                            updatePreview(lastContentRef.current, true);
                        }
                    });
                    
                    console.log('✅ Variables Preview Processor initialized');
                    
                    if (process.env.NODE_ENV === 'development') {
                        window.debugVariablesPreview = createVariablesDebugger(variablesProcessorRef.current);
                    }
                } else {
                    console.warn('⚠️ Variables plugin not found, preview will work without variable processing');
                }
            } catch (error) {
                console.error('❌ Error initializing variables processor:', error);
            }
        };

        initVariablesProcessor();
    }, []);

    // ===================================================================
    // FUNCIÓN PRINCIPAL DE ACTUALIZACIÓN (CORREGIDA)
    // ===================================================================

    const updatePreview = useCallback((content, forceRefresh = false) => {
        if (!previewRef.current || (!forceRefresh && content === lastContentRef.current)) {
            return;
        }

        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }

        const delay = forceRefresh ? 100 : 800;

        updateTimeoutRef.current = setTimeout(async () => {
            try {
                lastContentRef.current = content;
                
                console.log('🔄 Starting preview update...', { forceRefresh });
                
                // 1. Procesar variables PRIMERO (SIN CAMBIOS)
                let processedContent = await processContentWithVariables(content, forceRefresh);
                
                // 2. OMITIR procesamiento backend si falla (CORREGIDO)
                try {
                    processedContent = await processContentWithBackend(processedContent);
                } catch (backendError) {
                    console.warn('⚠️ Backend processing skipped:', backendError.message);
                    // Continuar sin backend
                }
                
                // 3. Procesar templates Liquid (CORREGIDO)
                try {
                    processedContent = await processLiquidTemplates(processedContent);
                } catch (liquidError) {
                    console.warn('⚠️ Liquid processing skipped:', liquidError.message);
                    // Continuar sin Liquid
                }
                
                // 4. Generar HTML completo del preview
                const previewHTML = generateUnifiedPreview(processedContent);
                
                // 5. Actualizar iframe
                const doc = previewRef.current.contentWindow.document;
                doc.open();
                doc.write(previewHTML);
                doc.close();

                // 6. Reinicializar sistemas después de cargar contenido
                setTimeout(() => {
                    initializePreviewSystems(previewRef.current.contentWindow);
                }, 200);

                console.log('✅ Preview updated successfully');

            } catch (error) {
                console.error('❌ Error updating preview:', error);
                fallbackToClientPreview(content);
            }
        }, delay);

    }, []);

    // ===================================================================
    // PROCESAMIENTO DE VARIABLES (SIN CAMBIOS)
    // ===================================================================

    const processContentWithVariables = async (content, forceRefresh = false) => {
        try {
            if (variablesProcessorRef.current) {
                return await variablesProcessorRef.current.processContentForPreview(content, forceRefresh);
            }
            
            return processBasicVariables(content);
            
        } catch (error) {
            console.error('❌ Variables processing failed:', error);
            return content;
        }
    };

    const processBasicVariables = (content) => {
        console.log('📦 Using basic variables processing (fallback)');
        
        try {
            const variablesPlugin = window.pluginManager?.get('variables');
            if (variablesPlugin && variablesPlugin.processContent) {
                return variablesPlugin.processContent(content);
            }

            const basicVariables = {
                'app.name': 'Page Builder',
                'site.name': 'Mi Sitio Web',
                'current.date': new Date().toLocaleDateString('es-ES'),
                'current.time': new Date().toLocaleTimeString('es-ES'),
                'current.year': new Date().getFullYear().toString(),
                'user.name': 'Usuario Demo',
                'user.email': 'demo@example.com'
            };

            let processed = content;
            Object.entries(basicVariables).forEach(([key, value]) => {
                const regex = new RegExp(`\\{\\{\\s*${key.replace('.', '\\.')}\\s*\\}\\}`, 'g');
                processed = processed.replace(regex, String(value));
            });

            return processed;
            
        } catch (error) {
            console.error('❌ Basic variables processing failed:', error);
            return content;
        }
    };

    // ===================================================================
    // PROCESAMIENTO CON BACKEND (CORREGIDO - Más tolerante a errores)
    // ===================================================================

    const processContentWithBackend = async (content) => {
        // VERIFICAR si la ruta existe antes de intentar usarla
        const hasBladeTemplates = content.match(/\{\{\s*\$config\[.*?\]\s*\}\}/g) || 
                                 content.match(/@\w+/g);
        
        if (!hasBladeTemplates) {
            return content;
        }

        try {
            const cacheKey = btoa(content).substring(0, 32);
            if (backendPreviewCacheRef.current.has(cacheKey)) {
                return backendPreviewCacheRef.current.get(cacheKey);
            }

            console.log('🔄 Attempting backend processing...');

            // USAR RUTA CORRECTA basada en tus rutas existentes
            const response = await fetch('/admin/page-builder/preview-template', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    content: content,
                    config: getPreviewConfig(),
                    styles: getPreviewStyles()
                })
            });

            if (!response.ok) {
                throw new Error(`Backend processing failed: ${response.status}`);
            }

            const data = await response.json();
            const processedHtml = data.html || data.rendered || content;
            
            backendPreviewCacheRef.current.set(cacheKey, processedHtml);
            setTimeout(() => {
                backendPreviewCacheRef.current.delete(cacheKey);
            }, 2 * 60 * 1000);

            return processedHtml;

        } catch (error) {
            console.warn('⚠️ Backend processing not available, skipping...', error.message);
            return content; // Graceful fallback
        }
    };

    // ===================================================================
    // PROCESAMIENTO LIQUID (CORREGIDO - Más tolerante a errores)
    // ===================================================================

    const processLiquidTemplates = async (content) => {
        try {
            const templatesPlugin = window.pluginManager?.get('templates');
            if (templatesPlugin && templatesPlugin.renderTemplate) {
                
                const previewData = {
                    ...getPreviewConfig(),
                    
                    site: {
                        title: 'Page Builder Pro',
                        description: 'Crea páginas increíbles',
                        url: window.location.origin
                    },
                    
                    current: {
                        time: new Date().toLocaleTimeString('es-ES'),
                        date: new Date().toLocaleDateString('es-ES'),
                        year: new Date().getFullYear()
                    },
                    
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
            console.warn('⚠️ Liquid processing not available, skipping...', error.message);
            return content;
        }
    };

    // ===================================================================
    // CONFIGURACIONES DE PREVIEW (SIN CAMBIOS)
    // ===================================================================

    const getPreviewConfig = () => ({
        title: 'Título de Ejemplo',
        subtitle: 'Subtítulo descriptivo',
        content: 'Este es el contenido de ejemplo para el preview.',
        buttonText: 'Botón de Acción',
        buttonUrl: '#demo',
        imageUrl: 'https://via.placeholder.com/600x400/3b82f6/ffffff?text=Imagen',
        currentDate: new Date().toLocaleDateString('es-ES'),
        currentTime: new Date().toLocaleTimeString('es-ES'),
        currentYear: new Date().getFullYear(),
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
    // GENERACIÓN DE HTML COMPLETO (CORREGIDO)
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
        
        .variable-placeholder {
            background: #f3f4f6;
            border: 1px dashed #d1d5db;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-family: monospace;
            font-size: 0.875rem;
            color: #6b7280;
        }
        
        .preview-container {
            min-height: 200px;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        {{CONTENT}}
    </div>
</body>
</html>`;

    // CORREGIDO: Método más seguro para obtener templates de plugins
    const getPluginTemplates = () => {
        const templates = {};
        
        try {
            // Verificar si pluginManager existe y tiene el método getAll
            if (window.pluginManager && typeof window.pluginManager.getAll === 'function') {
                const plugins = window.pluginManager.getAll();
                plugins.forEach(plugin => {
                    if (plugin && plugin.getPreviewTemplate) {
                        templates[plugin.name] = plugin.getPreviewTemplate();
                    }
                });
            } else {
                console.warn('⚠️ PluginManager.getAll() not available, using fallback templates');
                // Fallback templates básicos
                templates.basic = {
                    scripts: '<!-- Basic fallback scripts -->'
                };
            }
        } catch (error) {
            console.warn('⚠️ Error getting plugin templates:', error.message);
        }
        
        return templates;
    };

    const combinePluginScripts = (templates) => {
        let combinedScripts = '';
        
        // Alpine.js
        combinedScripts += `
        <!-- Alpine.js -->
        <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
        `;
        
        // Liquid.js
        combinedScripts += `
        <!-- Liquid.js -->
        <script src="https://unpkg.com/liquidjs/dist/liquid.browser.umd.js"></script>
        `;
        
        // Scripts específicos de plugins
        Object.entries(templates).forEach(([pluginName, template]) => {
            if (template && template.scripts) {
                combinedScripts += `\n<!-- ${pluginName} Scripts -->\n${template.scripts}\n`;
            }
        });
        
        return combinedScripts;
    };

    // ===================================================================
    // INICIALIZACIÓN DE SISTEMAS (SIN CAMBIOS)
    // ===================================================================

    const initializePreviewSystems = (previewWindow) => {
        if (!previewWindow) return;
        
        try {
            const waitForSystems = () => {
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
    // FALLBACK Y CLEANUP (SIN CAMBIOS)
    // ===================================================================

    const fallbackToClientPreview = (content) => {
        try {
            const processedContent = processBasicVariables(content);
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

    const forceRefresh = useCallback(() => {
        if (variablesProcessorRef.current) {
            variablesProcessorRef.current.forceRefresh();
        } else if (lastContentRef.current) {
            updatePreview(lastContentRef.current, true);
        }
    }, [updatePreview]);

    useEffect(() => {
        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
            backendPreviewCacheRef.current.clear();
            
            if (variablesProcessorRef.current) {
                variablesProcessorRef.current.cleanup();
            }
        };
    }, []);

    // ===================================================================
    // DEBUG HELPERS (ACTUALIZADOS)
    // ===================================================================

    if (process.env.NODE_ENV === 'development') {
        window.debugIntegratedPreview = {
            async testVariables(template = '{{site.company_name}} - {{current.date}}') {
                const result = await processContentWithVariables(template);
                console.log('🎯 Variables result:', result);
                return result;
            },
            
            showCache() {
                console.table([...backendPreviewCacheRef.current.entries()]);
            },
            
            clearCache() {
                backendPreviewCacheRef.current.clear();
                if (variablesProcessorRef.current) {
                    variablesProcessorRef.current.invalidateCache();
                }
                console.log('🗑️ All caches cleared');
            },
            
            forceRefresh() {
                forceRefresh();
                console.log('🔄 Force refresh triggered');
            },
            
            // NUEVO: Test solo variables sin backend
            async testVariablesOnly(template = '{{site.company_name}} - {{contact.email}}') {
                const result = await processContentWithVariables(template, true);
                console.log('🎯 Variables only result:', result);
                return result;
            }
        };
    }

    return { 
        previewRef, 
        updatePreview,
        forceRefresh
    };
};

export default usePluginPreview;
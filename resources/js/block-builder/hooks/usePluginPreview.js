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

        updateTimeoutRef.current = setTimeout(async () => {
            try {
                lastContentRef.current = content;
                
                // ACTUALIZADO: Procesar tanto variables como templates
                const processedContent = await processContentWithAll(content);
                
                // Generar HTML completo del preview
                const previewHTML = generateUnifiedPreview(processedContent);
                
                // ARREGLO: Usar directamente el método más seguro (Blob URL)
                const sanitizedHTML = sanitizeHTMLForIframe(previewHTML);
                
                // Usar método Blob URL como predeterminado (más seguro que doc.write)
                if (!updateIframeWithBlob(previewRef.current, sanitizedHTML)) {
                    console.warn('⚠️ All methods failed, using basic fallback');
                    // Si todo falla, usar contenido básico
                    previewRef.current.srcdoc = createFallbackHTML('Error cargando contenido');
                }

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

// NUEVO: Sanitizar HTML para evitar errores en iframe
const sanitizeHTMLForIframe = (html) => {
    try {
        // ARREGLO MEJORADO: Sanitización más robusta
        let sanitized = html;
        
        // 1. Validar que el HTML no esté vacío o corrupto
        if (!sanitized || typeof sanitized !== 'string') {
            return createFallbackHTML('Contenido vacío o inválido');
        }
        
        // 2. Remover caracteres de control problemáticos
        sanitized = sanitized
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Caracteres de control
            .replace(/\uFEFF/g, '') // BOM
            .replace(/\r\n/g, '\n') // Normalizar saltos de línea
            .replace(/\r/g, '\n');
        
        // 3. Escapar contenido de scripts de forma más segura
        sanitized = sanitized.replace(/<script([^>]*)>([\s\S]*?)<\/script>/gi, (match, attrs, content) => {
            try {
                // Si el script está vacío o solo tiene espacios, devolverlo tal como está
                if (!content || content.trim() === '') {
                    return match;
                }
                
                // No procesar si el script ya parece estar escapado correctamente
                if (content.includes('\\n') || content.includes('\\"')) {
                    return match;
                }
                
                // Para scripts que contienen template literals o código complejo,
                // es mejor ponerlos en CDATA o no procesarlos
                if (content.includes('`') || content.includes('${')) {
                    return `<script${attrs}><![CDATA[${content}]]></script>`;
                }
                
                // Escapar solo caracteres realmente problemáticos
                const safeContent = content
                    .replace(/\\/g, '\\\\')     // Escapar backslashes
                    .replace(/\n/g, '\\n')      // Escapar saltos de línea
                    .replace(/\r/g, '\\r')      // Escapar retorno de carro  
                    .replace(/\t/g, '\\t')      // Escapar tabs
                    .replace(/'/g, "\\'")       // Escapar comillas simples
                    .replace(/"/g, '\\"');      // Escapar comillas dobles
                
                return `<script${attrs}>${safeContent}</script>`;
            } catch (e) {
                console.warn('⚠️ Error processing script tag:', e);
                // Si hay error, usar CDATA para proteger el contenido
                return `<script${attrs}><![CDATA[${content}]]></script>`;
            }
        });
        
        // 4. Limpiar comentarios HTML problemáticos
        sanitized = sanitized.replace(/<!--([\s\S]*?)-->/g, (match, content) => {
            const cleanContent = content.replace(/--/g, '- -');
            return `<!--${cleanContent}-->`;
        });
        
        // 5. Validar que el HTML resultante sea válido
        if (sanitized.length === 0) {
            return createFallbackHTML('Contenido vacío después de sanitización');
        }
        
        return sanitized;
        
    } catch (error) {
        console.error('❌ Error sanitizing HTML:', error);
        return createFallbackHTML(`Error de sanitización: ${error.message}`);
    }
};

// NUEVO: Crear HTML de fallback seguro
const createFallbackHTML = (message) => {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview Error</title>
    <style>
        body { font-family: system-ui, sans-serif; padding: 1rem; margin: 0; }
        .error-container { 
            color: #dc2626; 
            border: 1px solid #fecaca; 
            background: #fef2f2; 
            padding: 1rem; 
            border-radius: 0.5rem; 
        }
        .error-title { margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: bold; }
        .error-message { margin: 0; }
    </style>
</head>
<body>
    <div class="error-container">
        <h3 class="error-title">⚠️ Error de Preview</h3>
        <p class="error-message">${message}</p>
        <p><small>Verifica la sintaxis de tu código y los templates.</small></p>
    </div>
</body>
</html>`;
};

// NUEVO: Método principal usando Blob URL (más seguro)
const updateIframeWithBlob = (iframe, html) => {
    try {
        console.log('🔄 Using blob URL method (primary method)');
        
        // Validar inputs
        if (!iframe) {
            console.error('❌ Iframe not provided');
            return false;
        }
        
        if (!html || typeof html !== 'string') {
            console.error('❌ Invalid HTML content');
            return false;
        }
        
        // Crear blob con el HTML
        const blob = new Blob([html], { 
            type: 'text/html;charset=utf-8' 
        });
        const url = URL.createObjectURL(blob);
        
        // Configurar limpieza de URL
        const cleanup = () => {
            try {
                URL.revokeObjectURL(url);
                console.log('🧹 Blob URL cleaned up');
            } catch (e) {
                console.warn('⚠️ Error cleaning up blob URL:', e);
            }
        };
        
        // Limpiar listeners previos
        iframe.onload = null;
        iframe.onerror = null;
        
        // Asignar URL al iframe
        iframe.src = url;
        
        // Configurar eventos de limpieza
        iframe.onload = () => {
            cleanup();
            console.log('✅ Iframe loaded successfully with blob URL');
        };
        
        iframe.onerror = () => {
            cleanup();
            console.error('❌ Error loading iframe with blob URL');
        };
        
        // Fallback de limpieza después de 15 segundos
        setTimeout(cleanup, 15000);
        
        return true;
        
    } catch (error) {
        console.error('❌ Error using blob method:', error);
        
        // FALLBACK: usar srcdoc
        return updateIframeWithSrcDoc(iframe, html);
    }
};

// NUEVO: Método srcdoc como fallback
const updateIframeWithSrcDoc = (iframe, html) => {
    try {
        console.log('🔄 Using srcdoc method as fallback');
        
        // srcdoc maneja automáticamente el escaping
        iframe.srcdoc = html;
        
        console.log('✅ Iframe updated successfully with srcdoc');
        return true;
        
    } catch (error) {
        console.error('❌ Error using srcdoc method:', error);
        
        // FALLBACK ABSOLUTO: HTML de error
        iframe.srcdoc = createFallbackHTML(`Error final: ${error.message}`);
        return false;
    }
};

// NUEVO: Procesamiento unificado de contenido (ahora async)
const processContentWithAll = async (content) => {
    try {
        let processed = content;
        
        // 1. Procesar templates Liquid primero (puede ser async)
        processed = await processLiquidTemplates(processed);
        
        // 2. Procesar variables después
        processed = processContentWithVariables(processed);
        
        return processed;
        
    } catch (error) {
        console.error('❌ Error processing content:', error);
        return content;
    }
};

// NUEVO: Procesamiento de templates Liquid (mejorado)
const processLiquidTemplates = async (content) => {
    try {
        const templatesPlugin = window.pluginManager?.get('templates');
        if (!templatesPlugin) {
            return content;
        }

        // Verificar si hay sintaxis Liquid en el contenido
        const hasLiquidSyntax = /\{%.*?%\}|\{\{.*?\}\}/s.test(content);
        if (!hasLiquidSyntax) {
            return content;
        }

        // Datos de ejemplo más completos para el preview
        const previewData = {
            // Variables de usuario
            user: {
                id: 1,
                name: 'María García',
                email: 'maria@demo.com',
                role: 'admin',
                avatar: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=MG',
                isOnline: true,
                lastLogin: new Date().toLocaleDateString('es-ES')
            },
            
            // Variables del sitio
            site: {
                title: 'Page Builder Pro',
                description: 'Crea páginas increíbles sin código',
                url: window.location.origin,
                logo: 'https://via.placeholder.com/120x40/1f2937/ffffff?text=LOGO',
                copyright: `© ${new Date().getFullYear()} Page Builder Pro`,
                version: '2.0.0'
            },
            
            // Variables de tiempo
            current: {
                time: new Date().toLocaleTimeString('es-ES'),
                date: new Date().toLocaleDateString('es-ES'),
                year: new Date().getFullYear(),
                month: new Date().toLocaleDateString('es-ES', { month: 'long' }),
                day: new Date().getDate(),
                timestamp: Date.now()
            },
            
            // Datos de contenido para templates
            title: 'Bienvenido al Page Builder',
            subtitle: 'Crea experiencias increíbles sin programar',
            description: 'Con nuestro editor visual puedes crear páginas web profesionales de manera rápida y sencilla. No necesitas conocimientos de código.',
            hero_image: 'https://via.placeholder.com/800x400/3b82f6/ffffff?text=Hero+Image',
            featured_image: 'https://via.placeholder.com/400x300/10b981/ffffff?text=Featured',
            price: 29.99,
            old_price: 49.99,
            discount: 40,
            button_text: 'Empezar ahora',
            button_url: '#demo',
            cta_text: '¡Únete a más de 10,000 usuarios!',
            
            // Arrays para loops y condiciones
            products: [
                { 
                    id: 1, 
                    name: 'Plan Básico', 
                    price: 19.99, 
                    image: 'https://via.placeholder.com/200x200/3b82f6/ffffff?text=Básico',
                    features: ['5 páginas', 'Soporte por email', 'Templates básicos']
                },
                { 
                    id: 2, 
                    name: 'Plan Pro', 
                    price: 29.99, 
                    image: 'https://via.placeholder.com/200x200/10b981/ffffff?text=Pro',
                    features: ['Páginas ilimitadas', 'Soporte prioritario', 'Templates premium', 'Integraciones']
                },
                { 
                    id: 3, 
                    name: 'Plan Enterprise', 
                    price: 99.99, 
                    image: 'https://via.placeholder.com/200x200/f59e0b/ffffff?text=Enterprise',
                    features: ['Todo incluido', 'Soporte 24/7', 'Diseño personalizado', 'Consultoría']
                }
            ],
            
            // Testimonios
            testimonials: [
                {
                    name: 'Ana López',
                    role: 'Diseñadora',
                    avatar: 'https://via.placeholder.com/60x60/ec4899/ffffff?text=AL',
                    text: 'Page Builder me ha ahorrado horas de trabajo. ¡Increíble!',
                    rating: 5
                },
                {
                    name: 'Carlos Ruiz',
                    role: 'Emprendedor',
                    avatar: 'https://via.placeholder.com/60x60/8b5cf6/ffffff?text=CR',
                    text: 'La herramienta perfecta para crear landing pages profesionales.',
                    rating: 5
                }
            ],
            
            // Features/características
            features: [
                { 
                    icon: '🎨', 
                    title: 'Diseño Visual',
                    description: 'Editor drag & drop intuitivo'
                },
                { 
                    icon: '⚡', 
                    title: 'Super Rápido',
                    description: 'Carga instantánea en todos los dispositivos'
                },
                { 
                    icon: '📱', 
                    title: 'Responsive',
                    description: 'Perfecto en móvil, tablet y desktop'
                },
                { 
                    icon: '🔒', 
                    title: 'Seguro',
                    description: 'Protección SSL y backups automáticos'
                }
            ],
            
            // Variables de configuración
            config: {
                showHeader: true,
                showFooter: true,
                enableComments: false,
                maintenanceMode: false,
                theme: 'light'
            },
            
            // Contadores y estadísticas
            stats: {
                users: 10547,
                pages: 45230,
                templates: 156,
                satisfaction: 98
            }
        };
        
        // Intentar renderizar con el plugin de templates
        if (templatesPlugin.renderTemplate) {
            try {
                const rendered = await templatesPlugin.renderTemplate(content, previewData);
                console.log('✅ Liquid template rendered successfully');
                return rendered;
            } catch (error) {
                console.warn('⚠️ Liquid template rendering failed:', error);
                
                // Mostrar error en el preview
                const errorContent = `
                    <div class="liquid-error">
                        <strong>❌ Error en Template Liquid:</strong><br>
                        ${error.message}
                        <details style="margin-top: 0.5rem;">
                            <summary>Contenido original</summary>
                            <pre style="background: #f3f4f6; padding: 0.5rem; border-radius: 0.25rem; margin-top: 0.5rem; overflow-x: auto;">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                        </details>
                    </div>
                `;
                
                return errorContent;
            }
        }
        
        // Fallback: procesamiento básico de Liquid si no hay plugin
        return processBasicLiquid(content, previewData);
        
    } catch (error) {
        console.error('❌ Error processing Liquid templates:', error);
        return content;
    }
};

// NUEVO: Procesamiento básico de Liquid como fallback
const processBasicLiquid = (content, data) => {
    let processed = content;
    
    try {
        // Procesar variables simples {{ variable }}
        processed = processed.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, path) => {
            const value = getNestedValue(data, path);
            return value !== undefined ? String(value) : match;
        });
        
        // Procesar variables con filtros simples {{ variable | filter }}
        processed = processed.replace(/\{\{\s*([\w.]+)\s*\|\s*(\w+)\s*\}\}/g, (match, path, filter) => {
            const value = getNestedValue(data, path);
            if (value === undefined) return match;
            
            switch (filter) {
                case 'upcase':
                case 'uppercase':
                    return String(value).toUpperCase();
                case 'downcase':
                case 'lowercase':
                    return String(value).toLowerCase();
                case 'capitalize':
                    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
                case 'currency':
                    return '$' + parseFloat(value).toFixed(2);
                default:
                    return String(value);
            }
        });
        
        // Procesar condiciones básicas {% if condition %}
        processed = processed.replace(/\{%\s*if\s+([\w.]+)\s*%\}(.*?)\{%\s*endif\s*%\}/gs, (match, condition, content) => {
            const value = getNestedValue(data, condition);
            return value ? content : '';
        });
        
        console.log('✅ Basic Liquid processing completed');
        
    } catch (error) {
        console.warn('⚠️ Basic Liquid processing failed:', error);
    }
    
    return processed;
};

// Helper para obtener valores anidados
const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
};

// Procesamiento de variables (mantener sin cambios)
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

// Procesamiento básico de variables (sin cambios)
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

// ACTUALIZADO: Template base con Liquid.js y mejor estructura
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
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            padding: 1rem; 
            margin: 0;
            background: white;
            line-height: 1.6;
        }
        
        /* Estilos para templates y errores */
        .liquid-error {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 1rem;
            border-radius: 0.5rem;
            margin: 1rem 0;
            font-family: 'Courier New', monospace;
        }
        
        .liquid-debug {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            color: #0369a1;
            padding: 0.5rem;
            font-size: 0.875rem;
            border-radius: 0.25rem;
            margin: 0.5rem 0;
            font-family: 'Courier New', monospace;
        }
        
        /* Estilos para contenido de ejemplo */
        .preview-container {
            max-width: 100%;
            overflow-x: auto;
        }
        
        .preview-container img {
            max-width: 100%;
            height: auto;
            border-radius: 0.5rem;
        }
        
        .preview-container pre {
            background: #f3f4f6;
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            font-size: 0.875rem;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        {{CONTENT}}
    </div>
    
    <script>
        // NUEVO: Procesamiento mejorado de templates Liquid en el preview
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚀 Preview initialized');
            
            // Verificar si Liquid.js está disponible
            if (window.Liquid) {
                console.log('✅ Liquid.js is available');
                
                // Configurar Liquid engine si no está configurado
                if (!window.liquidEngine) {
                    window.liquidEngine = new window.Liquid.Liquid({
                        cache: false,
                        strictFilters: false,
                        strictVariables: false,
                        trimTagRight: false,
                        trimTagLeft: false,
                        trimOutputRight: false,
                        trimOutputLeft: false
                    });
                    
                    // Registrar filtros personalizados
                    window.liquidEngine.registerFilter('currency', (value) => {
                        return '
             + parseFloat(value || 0).toFixed(2);
                    });
                    
                    window.liquidEngine.registerFilter('percentage', (value) => {
                        return Math.round(parseFloat(value || 0)) + '%';
                    });
                    
                    window.liquidEngine.registerFilter('truncate', (value, length = 50) => {
                        const str = String(value || '');
                        return str.length > length ? str.substring(0, length) + '...' : str;
                    });
                    
                    console.log('🔧 Liquid filters registered');
                }
            } else {
                console.log('⚠️ Liquid.js not available');
            }
            
            // Función para procesar cualquier contenido Liquid restante
            const processRemainingLiquid = () => {
                const container = document.querySelector('.preview-container');
                if (!container || !window.liquidEngine) return;
                
                const content = container.innerHTML;
                
                // Solo procesar si hay sintaxis Liquid
                if (!/\{%.*?%\}|\{\{.*?\}\}/s.test(content)) {
                    return;
                }
                
                console.log('🔄 Processing remaining Liquid syntax in preview...');
                
                // Variables adicionales para el preview en tiempo real
                const runtimeData = {
                    preview: {
                        mode: 'live',
                        timestamp: new Date().toISOString(),
                        url: window.location.href
                    }
                };
                
                window.liquidEngine.parseAndRender(content, runtimeData)
                    .then(result => {
                        container.innerHTML = result;
                        console.log('✅ Remaining Liquid processed successfully');
                    })
                    .catch(error => {
                        console.error('❌ Error processing remaining Liquid:', error);
                        // No mostrar error si ya se procesó en el servidor
                    });
            };
            
            // Procesar contenido después de que todo esté cargado
            setTimeout(processRemainingLiquid, 100);
        });
    </script>
</body>
</html>
`;

// ACTUALIZADO: Incluir templates en plugins con validación
const getPluginTemplates = () => {
    const templates = [];
    
    if (window.pluginManager) {
        const plugins = window.pluginManager.list();
        
        plugins.forEach(pluginInfo => {
            try {
                const plugin = window.pluginManager.get(pluginInfo.name);
                if (plugin && plugin.getPreviewTemplate) {
                    const template = plugin.getPreviewTemplate();
                    
                    // Validar que el template sea válido
                    if (template && typeof template === 'string') {
                        templates.push({
                            name: pluginInfo.name,
                            priority: plugin.previewPriority || 50,
                            template: cleanPluginTemplate(template, pluginInfo.name),
                            version: plugin.version || '1.0.0'
                        });
                    } else {
                        console.warn(`⚠️ Plugin ${pluginInfo.name} returned invalid template`);
                    }
                }
            } catch (error) {
                console.error(`❌ Error loading plugin template for ${pluginInfo.name}:`, error);
            }
        });
    }
    
    // Ordenar por prioridad (mayor prioridad primero)
    return templates.sort((a, b) => b.priority - a.priority);
};

// NUEVO: Limpiar template de plugin para evitar errores
const cleanPluginTemplate = (template, pluginName) => {
    try {
        let cleaned = template;
        
        // 1. Asegurar que los scripts externos tengan manejo de errores
        cleaned = cleaned.replace(/<script\s+src="([^"]+)"([^>]*)>/gi, (match, src, attrs) => {
            return `<script src="${src}"${attrs} onerror="console.warn('Failed to load script: ${src} for plugin ${pluginName}')">`;
        });
        
        // 2. Envolver scripts inline problemáticos en try-catch
        cleaned = cleaned.replace(/<script([^>]*)>([\s\S]*?)<\/script>/gi, (match, attrs, content) => {
            // Si ya tiene try-catch, no modificar
            if (content.includes('try') && content.includes('catch')) {
                return match;
            }
            
            // Si es muy simple (una línea), no envolver
            const lines = content.trim().split('\n');
            if (lines.length === 1 && lines[0].length < 100) {
                return match;
            }
            
            // Envolver contenido complejo en try-catch
            const wrappedContent = `
                try {
                    ${content}
                } catch (error) {
                    console.warn('Script error in plugin ${pluginName}:', error);
                }
            `;
            
            return `<script${attrs}>${wrappedContent}</script>`;
        });
        
        return cleaned;
        
    } catch (error) {
        console.error(`❌ Error cleaning template for ${pluginName}:`, error);
        return `<!-- Template for ${pluginName} could not be processed -->`;
    }
};

// Generar HTML unificado del preview
const generateUnifiedPreview = (content) => {
    const baseTemplate = getBaseTemplate();
    const pluginTemplates = getPluginTemplates();
    const combinedScripts = combinePluginScripts(pluginTemplates);
    
    return baseTemplate
        .replace('{{PLUGIN_SCRIPTS}}', combinedScripts)
        .replace('{{CONTENT}}', content);
};

// Combinar scripts de plugins con mejor organización y manejo de errores
const combinePluginScripts = (pluginTemplates) => {
    if (pluginTemplates.length === 0) {
        return '<!-- No plugins with preview templates found -->';
    }
    
    const scriptSections = [];
    
    pluginTemplates.forEach(({ name, template, version, priority }) => {
        try {
            // Validar que el template sea válido
            if (!template || typeof template !== 'string') {
                console.warn(`⚠️ Invalid template for plugin ${name}`);
                return;
            }
            
            // Encapsular cada plugin en su propio bloque para evitar conflictos
            const section = `
    <!-- ==========================================
         ${name.toUpperCase()} PLUGIN v${version || '1.0.0'} (Priority: ${priority || 50})
         ========================================== -->
    <script>
        try {
            console.log('🔌 Loading ${name} plugin...');
        } catch(e) {
            console.warn('Debug log failed for ${name}');
        }
    </script>
    ${template}
    <script>
        try {
            console.log('✅ ${name} plugin loaded successfully');
        } catch(e) {
            console.warn('Debug log failed for ${name}');
        }
    </script>
    `;
            scriptSections.push(section);
            
        } catch (error) {
            console.error(`❌ Error processing plugin ${name}:`, error);
            // Incluir un placeholder para el plugin con error
            scriptSections.push(`
    <!-- ❌ ERROR LOADING ${name.toUpperCase()} PLUGIN -->
    <script>
        console.error('Failed to load plugin: ${name}');
    </script>
            `);
        }
    });
    
    return scriptSections.join('\n');
};

// Inicializar sistemas del preview con mejor detección
const initializePreviewSystems = (previewWindow) => {
    if (!previewWindow) return;
    
    try {
        let attempts = 0;
        const maxAttempts = 20;
        
        const waitForSystems = () => {
            attempts++;
            
            const systems = {
                alpine: !!previewWindow?.Alpine,
                tailwind: !!previewWindow?.tailwind,
                liquid: !!previewWindow?.Liquid,
                jquery: !!previewWindow?.jQuery || !!previewWindow?.$
            };
            
            const loadedSystems = Object.entries(systems)
                .filter(([, loaded]) => loaded)
                .map(([name]) => name);
            
            if (loadedSystems.length > 0) {
                console.log(`🎨 Loaded systems (attempt ${attempts}):`, loadedSystems.join(', '));
                
                // Reinicializar Alpine si está disponible
                if (systems.alpine) {
                    try {
                        previewWindow.Alpine.initTree(previewWindow.document.body);
                        console.log('🔄 Alpine reinitializado');
                    } catch (error) {
                        console.warn('⚠️ Error reinitializing Alpine:', error);
                    }
                }
                
                // Configurar Liquid si está disponible pero no configurado
                if (systems.liquid && !previewWindow.liquidEngine) {
                    try {
                        previewWindow.liquidEngine = new previewWindow.Liquid.Liquid({
                            cache: false,
                            strictFilters: false,
                            strictVariables: false
                        });
                        console.log('🔧 Liquid engine configured');
                    } catch (error) {
                        console.warn('⚠️ Error configuring Liquid:', error);
                    }
                }
                
                return; // Salir del bucle de espera
            }
            
            // Continuar esperando si no se han cargado todos los sistemas
            if (attempts < maxAttempts) {
                setTimeout(waitForSystems, 100);
            } else {
                console.log('⚠️ Some systems may not have loaded after', maxAttempts, 'attempts');
            }
        };
        
        waitForSystems();
        
    } catch (error) {
        console.error('❌ Error initializing preview systems:', error);
    }
};

// NUEVO: Helpers para debug y desarrollo
if (process.env.NODE_ENV === 'development') {
    window.debugTemplatePreview = {
        // NUEVO: Debug helpers para templates
        testTemplateRender(liquidCode = '{% if user.name %}Hello {{ user.name | capitalize }}!{% endif %}') {
            const templatesPlugin = window.pluginManager?.get('templates');
            if (templatesPlugin && templatesPlugin.renderTemplate) {
                const testData = { 
                    user: { name: 'test user' },
                    site: { title: 'Test Site' }
                };
                
                templatesPlugin.renderTemplate(liquidCode, testData)
                    .then(result => {
                        console.log('🎨 Template result:', result);
                        return result;
                    })
                    .catch(error => {
                        console.error('❌ Template error:', error);
                        return null;
                    });
            } else {
                console.log('❌ Templates plugin not found or renderTemplate method missing');
            }
        },
        
        // NUEVO: Debug para ver el HTML generado
        debugGeneratedHTML() {
            const testContent = '<h1>{{ site.title }}</h1><p>Test content</p>';
            
            console.log('🔍 Testing HTML generation...');
            console.log('Original content:', testContent);
            
            processContentWithAll(testContent).then(processed => {
                console.log('Processed content:', processed);
                
                const finalHTML = generateUnifiedPreview(processed);
                console.log('Final HTML length:', finalHTML.length);
                console.log('Final HTML preview:', finalHTML.substring(0, 500) + '...');
                
                // Buscar caracteres problemáticos
                const problematicChars = finalHTML.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g);
                if (problematicChars) {
                    console.warn('⚠️ Problematic characters found:', problematicChars);
                } else {
                    console.log('✅ No problematic characters found');
                }
                
                return finalHTML;
            }).catch(error => {
                console.error('❌ Error in processing:', error);
            });
        },
        
        // Mostrar templates disponibles
        async showAvailableTemplates() {
            const templatesPlugin = window.pluginManager?.get('templates');
            if (templatesPlugin && templatesPlugin.listTemplates) {
                try {
                    const templates = await templatesPlugin.listTemplates();
                    console.table(templates);
                } catch (error) {
                    console.error('❌ Error listing templates:', error);
                }
            } else {
                console.log('❌ Templates plugin not found or listTemplates method missing');
            }
        },
        
        // Mostrar plugins con preview templates
        showPreviewPlugins() {
            const pluginTemplates = getPluginTemplates();
            console.log('📄 Plugins with preview templates:', pluginTemplates);
            
            pluginTemplates.forEach(plugin => {
                console.log(`\n🔌 ${plugin.name} (v${plugin.version}, priority: ${plugin.priority})`);
                console.log('Template preview:', plugin.template.substring(0, 200) + '...');
            });
        },
        
        // Test de procesamiento de contenido
        async testContentProcessing(content = '<h1>{{ site.title }}</h1>{% if user.name %}<p>Hello {{ user.name }}!</p>{% endif %}') {
            console.log('🧪 Testing content processing...');
            console.log('Original:', content);
            
            try {
                const processed = await processContentWithAll(content);
                console.log('Processed:', processed);
                return processed;
            } catch (error) {
                console.error('❌ Processing error:', error);
                return content;
            }
        },
        
        // Verificar estado del preview
        checkPreviewState() {
            const iframe = document.querySelector('iframe');
            if (iframe && iframe.contentWindow) {
                const previewWindow = iframe.contentWindow;
                const systems = {
                    alpine: !!previewWindow?.Alpine,
                    tailwind: !!previewWindow?.tailwind,
                    liquid: !!previewWindow?.Liquid,
                    liquidEngine: !!previewWindow?.liquidEngine,
                    jquery: !!previewWindow?.jQuery || !!previewWindow?.$
                };
                
                console.log('🔍 Preview systems state:', systems);
                
                if (systems.liquidEngine) {
                    console.log('🔧 Liquid engine config:', {
                        cache: previewWindow.liquidEngine.options.cache,
                        strictFilters: previewWindow.liquidEngine.options.strictFilters,
                        strictVariables: previewWindow.liquidEngine.options.strictVariables
                    });
                }
                
                return systems;
            } else {
                console.log('❌ Preview iframe not found or not accessible');
                return null;
            }
        }
    };
    
    // Agregar helpers globales
    window.testLiquid = window.debugTemplatePreview.testTemplateRender;
    window.checkPreview = window.debugTemplatePreview.checkPreviewState;
}

export default usePluginPreview;
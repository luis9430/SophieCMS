// ===================================================================
// resources/js/block-builder/plugins/variables/index.js - VERSIÓN COMPLETA
// ===================================================================

import { 
    SystemProvider, 
    UserProvider, 
    SiteProvider, 
    TemplatesProvider,
    createCustomProvider 
} from './providers.js';
import { VariableProcessor, VariableAnalyzer } from './processor.js';
import { 
    getVariableCompletions,
    getVariableContentCompletions,
    validateVariablesInCode,
    analyzeVariableUsage,
    recordRecentVariable 
} from './editor.js';

const variablesPlugin = {
    name: 'variables',
    version: '2.0.0',
    dependencies: [],
    previewPriority: 95,
    
    // ===================================================================
    // INICIALIZACIÓN
    // ===================================================================
    
    async init(context) {
        console.log('🎯 Initializing Variables Plugin v2.0.0...');
        
        try {
            // Inicializar el procesador con providers
            this.processor = new VariableProcessor();
            this.analyzer = new VariableAnalyzer(this.processor);
            
            // Registrar providers por defecto
            this.processor.addProvider('system', SystemProvider);
            this.processor.addProvider('user', UserProvider);
            this.processor.addProvider('site', SiteProvider);
            this.processor.addProvider('templates', TemplatesProvider);
            
            // Iniciar auto-refresh donde sea necesario
            SystemProvider.startAutoRefresh();
            
            // Configurar el procesador global
            window.processVariables = (content) => this.processVariables(content);
            
            // Configurar funciones de CodeMirror
            this._setupEditorIntegration();
            
            console.log('✅ Variables Plugin initialized successfully');
            return this;
            
        } catch (error) {
            console.error('❌ Error initializing Variables Plugin:', error);
            throw error;
        }
    },

    // ===================================================================
    // TEMPLATE PARA PREVIEW
    // ===================================================================
    
    getPreviewTemplate() {
        return `
<script>
    // 🎯 CONFIGURACIÓN INICIAL DE VARIABLES
    document.addEventListener('DOMContentLoaded', () => {
        // Datos iniciales más completos
        window.initialData = {
            user: {
                id: 1,
                name: 'María García',
                email: 'maria.garcia@demo.com',
                role: 'admin',
                avatar: '👩‍💼',
                firstName: 'María',
                lastName: 'García',
                registeredAt: '2024-01-15T10:30:00Z',
                lastLogin: new Date().toISOString(),
                preferences: {
                    theme: 'light',
                    language: 'es',
                    notifications: true
                }
            },
            site: {
                title: 'Page Builder Pro',
                description: 'Crea páginas web increíbles con nuestro editor visual',
                url: window.location.origin,
                author: 'Equipo Development',
                version: '2.0.0',
                theme: 'modern',
                language: 'es',
                lastUpdate: new Date().toISOString(),
                features: ['templates', 'variables', 'plugins', 'responsive']
            },
            app: {
                name: 'Page Builder',
                version: '2.0.0-plugins',
                environment: 'preview',
                buildDate: new Date().toISOString(),
                features: ['alpine', 'tailwind', 'gsap', 'variables']
            },
            templates: [
                { name: 'Landing Hero', category: 'landing', updatedAt: '2024-06-10T14:20:00Z', size: 1024 },
                { name: 'Contact Form', category: 'forms', updatedAt: '2024-06-09T09:15:00Z', size: 512 },
                { name: 'Testimonials', category: 'content', updatedAt: '2024-06-08T16:45:00Z', size: 768 }
            ]
        };

        // 🔄 SISTEMA DE PROCESAMIENTO DE VARIABLES MEJORADO
        window.processVariables = function(content) {
            if (!content) return content;
            
            try {
                // Variables del sistema con más detalle
                const now = new Date();
                const systemVars = {
                    // App variables
                    'app.name': window.initialData.app.name,
                    'app.version': window.initialData.app.version,
                    'app.environment': window.initialData.app.environment,
                    'app.buildDate': new Date(window.initialData.app.buildDate).toLocaleDateString('es-ES'),
                    
                    // User variables  
                    'user.id': window.initialData.user.id,
                    'user.name': window.initialData.user.name,
                    'user.email': window.initialData.user.email,
                    'user.role': window.initialData.user.role,
                    'user.avatar': window.initialData.user.avatar,
                    'user.firstName': window.initialData.user.firstName,
                    'user.lastName': window.initialData.user.lastName,
                    'user.initials': (window.initialData.user.firstName?.[0] || '') + (window.initialData.user.lastName?.[0] || ''),
                    'user.isAdmin': window.initialData.user.role === 'admin',
                    'user.isLoggedIn': !!window.initialData.user.id,
                    'user.registeredAt': new Date(window.initialData.user.registeredAt).toLocaleDateString('es-ES'),
                    'user.lastLogin': new Date(window.initialData.user.lastLogin).toLocaleString('es-ES'),
                    
                    // Site variables
                    'site.title': window.initialData.site.title,
                    'site.description': window.initialData.site.description,
                    'site.url': window.initialData.site.url,
                    'site.domain': window.location.hostname,
                    'site.author': window.initialData.site.author,
                    'site.version': window.initialData.site.version,
                    'site.theme': window.initialData.site.theme,
                    'site.language': window.initialData.site.language,
                    'site.lastUpdate': new Date(window.initialData.site.lastUpdate).toLocaleDateString('es-ES'),
                    
                    // Current time variables (actualizadas en tiempo real)
                    'current.time': now.toLocaleTimeString('es-ES'),
                    'current.date': now.toLocaleDateString('es-ES'),
                    'current.datetime': now.toLocaleString('es-ES'),
                    'current.year': now.getFullYear(),
                    'current.month': now.toLocaleDateString('es-ES', { month: 'long' }),
                    'current.day': now.getDate(),
                    'current.weekday': now.toLocaleDateString('es-ES', { weekday: 'long' }),
                    'current.timestamp': now.getTime(),
                    'current.iso': now.toISOString(),
                    
                    // System variables
                    'system.timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
                    'system.language': navigator.language || 'es-ES',
                    'system.platform': navigator.platform,
                    'system.userAgent': navigator.userAgent.substring(0, 50) + '...',
                    'system.viewport.width': window.innerWidth,
                    'system.viewport.height': window.innerHeight,
                    'system.colorScheme': window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
                    
                    // Templates variables
                    'templates.count': window.initialData.templates.length,
                    'templates.latest': window.initialData.templates[0]?.name || 'Sin templates',
                    'templates.latestDate': window.initialData.templates[0] ? 
                        new Date(window.initialData.templates[0].updatedAt).toLocaleDateString('es-ES') : 'N/A'
                };

                // Procesar el contenido reemplazando variables
                let processed = content;
                Object.entries(systemVars).forEach(([key, value]) => {
                    // Crear regex que maneje espacios opcionales
                    const regex = new RegExp(\`\\\\{\\\\{\\\\s*\${key.replace(/\\./g, '\\\\.')}\\\\s*\\\\}\\\\}\`, 'g');
                    processed = processed.replace(regex, String(value));
                });

                // Log para debugging
                const usedVars = content.match(/\\{\\{[^}]+\\}\\}/g) || [];
                if (usedVars.length > 0) {
                    console.log('🎯 Variables procesadas:', {
                        found: usedVars,
                        available: Object.keys(systemVars).length
                    });
                }

                return processed;
                
            } catch (error) {
                console.error('❌ Error procesando variables:', error);
                return content; // Fallback al contenido original
            }
        };

        // 🔄 AUTO-REFRESH DE VARIABLES DE TIEMPO
        setInterval(() => {
            // Las variables de tiempo se actualizan automáticamente 
            // la próxima vez que se procese el contenido
        }, 1000);

        console.log('🎯 Variables system ready - Available variables:', Object.keys({
            app: ['name', 'version', 'environment', 'buildDate'],
            user: ['name', 'email', 'role', 'avatar', 'firstName', 'lastName', 'initials', 'isAdmin', 'isLoggedIn'],
            site: ['title', 'description', 'url', 'domain', 'author', 'version', 'theme', 'language'],
            current: ['time', 'date', 'datetime', 'year', 'month', 'day', 'weekday', 'timestamp', 'iso'],
            system: ['timezone', 'language', 'platform', 'viewport.width', 'viewport.height', 'colorScheme'],
            templates: ['count', 'latest', 'latestDate']
        }));
    });

    // 🎨 MOSTRAR VARIABLES EN EL DEBUG PANEL (si existe)
    window.showVariablesList = function() {
        const now = new Date();
        const availableVars = {
            'app.name': window.initialData?.app?.name || 'Page Builder',
            'user.name': window.initialData?.user?.name || 'Usuario Demo',
            'current.time': now.toLocaleTimeString('es-ES'),
            'current.date': now.toLocaleDateString('es-ES'),
            'site.title': window.initialData?.site?.title || 'Mi Sitio'
        };
        
        console.table(availableVars);
        return availableVars;
    };
</script>

<!-- 🎯 INDICADOR VISUAL DE VARIABLES ACTIVAS -->
<div id="variables-indicator" style="display: none;">
    <div style="position: fixed; top: 10px; left: 10px; background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; z-index: 1000; font-family: monospace;">
        🎯 Variables: Active
    </div>
</div>

<script>
    // Mostrar indicador si hay variables en el contenido
    document.addEventListener('DOMContentLoaded', () => {
        const checkForVariables = () => {
            const content = document.body.innerHTML;
            const hasVariables = /\\{\\{[^}]+\\}\\}/.test(content);
            const indicator = document.getElementById('variables-indicator');
            if (indicator) {
                indicator.style.display = hasVariables ? 'block' : 'none';
            }
        };
        
        checkForVariables();
        // Verificar cada 2 segundos por cambios
        setInterval(checkForVariables, 2000);
    });
</script>`;
    },

    // ===================================================================
    // API PÚBLICA DEL PLUGIN
    // ===================================================================
    
    /**
     * Procesar variables en contenido HTML
     */
    processVariables(content) {
        return this.processor.processCode(content);
    },

    /**
     * Obtener todas las variables disponibles
     */
    getAvailableVariables() {
        return this.processor.getAllVariables();
    },

    /**
     * Validar una variable específica
     */
    validateVariable(variablePath) {
        return this.processor.validateVariable(variablePath);
    },

    /**
     * Extraer variables de código HTML
     */
    extractVariables(htmlCode) {
        return this.processor.extractVariables(htmlCode);
    },

    /**
     * Encontrar variables inválidas
     */
    findInvalidVariables(htmlCode) {
        return this.processor.findInvalidVariables(htmlCode);
    },

    /**
     * Formatear variable para inserción
     */
    formatVariableForInsertion(variablePath) {
        return `{{ \${variablePath} }}`;
    },

    /**
     * Analizar uso de variables en código
     */
    analyzeCode(htmlCode) {
        return this.analyzer.analyzeCode(htmlCode);
    },

    /**
     * Obtener completions para CodeMirror
     */
    getCompletions(context) {
        try {
            const completions = getVariableCompletions(context, this);
            
            // Registrar variables usadas para estadísticas
            completions.forEach(completion => {
                if (completion.type === 'variable') {
                    const variable = completion.label.replace(/\{\{\s*|\s*\}\}/g, '');
                    recordRecentVariable(variable);
                }
            });
            
            return completions;
        } catch (error) {
            console.error('Error getting variable completions:', error);
            return [];
        }
    },

    /**
     * Validar sintaxis para CodeMirror
     */
    validateSyntax(code) {
        try {
            const errors = validateVariablesInCode(code, this);
            const warnings = [];
            
            // Añadir análisis adicional
            const analysis = this.analyzeCode(code);
            
            if (analysis.invalidVariables > 0) {
                warnings.push({
                    type: 'invalid-variables',
                    message: `\${analysis.invalidVariables} variable(s) inválida(s) encontrada(s)`,
                    severity: 'warning'
                });
            }
            
            return { errors, warnings };
        } catch (error) {
            console.error('Error validating variables:', error);
            return { errors: [], warnings: [] };
        }
    },

    /**
     * Añadir provider personalizado
     */
    addProvider(name, provider) {
        this.processor.addProvider(name, provider);
    },

    /**
     * Remover provider
     */
    removeProvider(name) {
        return this.processor.removeProvider(name);
    },

    /**
     * Obtener estadísticas del plugin
     */
    getStats() {
        return {
            processor: this.processor.getStats(),
            performance: this.analyzer.getPerformanceMetrics(),
            providers: Array.from(this.processor.providers.keys())
        };
    },

    // ===================================================================
    // INTEGRACIÓN CON EDITOR
    // ===================================================================
    
    /**
     * Configurar integración con CodeMirror
     * @private
     */
    _setupEditorIntegration() {
        // Configurar window.editorBridge si existe
        if (window.editorBridge) {
            const originalGetCompletions = window.editorBridge.getCompletions;
            
            window.editorBridge.getCompletions = async (context) => {
                let completions = [];
                
                // Obtener completions originales
                if (originalGetCompletions) {
                    try {
                        completions = await originalGetCompletions.call(window.editorBridge, context);
                    } catch (error) {
                        console.warn('Error getting original completions:', error);
                    }
                }
                
                // Añadir completions de variables
                try {
                    const variableCompletions = this.getCompletions(context);
                    completions.push(...variableCompletions);
                } catch (error) {
                    console.warn('Error getting variable completions:', error);
                }
                
                return completions;
            };
            
            const originalValidateSyntax = window.editorBridge.validateSyntax;
            
            window.editorBridge.validateSyntax = async (code) => {
                let result = { errors: [], warnings: [] };
                
                // Obtener validación original
                if (originalValidateSyntax) {
                    try {
                        result = await originalValidateSyntax.call(window.editorBridge, code);
                    } catch (error) {
                        console.warn('Error in original validation:', error);
                    }
                }
                
                // Añadir validación de variables
                try {
                    const variableValidation = this.validateSyntax(code);
                    result.errors.push(...variableValidation.errors);
                    result.warnings.push(...variableValidation.warnings);
                } catch (error) {
                    console.warn('Error validating variables:', error);
                }
                
                return result;
            };
            
            console.log('✅ Variables plugin integrated with EditorBridge');
        }
        
        // Configurar funciones globales para debugging
        if (process.env.NODE_ENV === 'development') {
            window.debugVariables = {
                showAvailable: () => {
                    console.table(this.getAvailableVariables());
                },
                analyzeCode: (code) => {
                    console.log('Analysis:', this.analyzeCode(code));
                },
                getStats: () => {
                    console.log('Stats:', this.getStats());
                },
                testVariable: (variable) => {
                    console.log(`Variable "${variable}" is ${this.validateVariable(variable) ? 'valid' : 'invalid'}`);
                }
            };
            
            console.log('🔧 Variables debug helpers: window.debugVariables');
        }
    },

    // ===================================================================
    // CLEANUP
    // ===================================================================
    
    /**
     * Limpiar recursos del plugin
     */
    async cleanup() {
        try {
            // Detener auto-refresh de providers
            SystemProvider.stopAutoRefresh();
            
            // Limpiar providers
            for (const [name, provider] of this.processor.providers.entries()) {
                if (provider.cleanup) {
                    await provider.cleanup();
                }
            }
            
            // Limpiar procesador
            this.processor.clearCache();
            
            // Limpiar funciones globales
            delete window.processVariables;
            delete window.debugVariables;
            
            console.log('🧹 Variables plugin cleaned up');
        } catch (error) {
            console.error('Error cleaning up variables plugin:', error);
        }
    }
};

// ===================================================================
// DEBUGGING Y DESARROLLO
// ===================================================================

if (process.env.NODE_ENV === 'development') {
    // Exponer plugin para debugging
    window.variablesPlugin = variablesPlugin;
    
    console.log('🔧 Variables plugin exposed to window for debugging');
}

export default variablesPlugin;
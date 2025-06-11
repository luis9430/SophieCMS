// ===================================================================
// plugins/alpine/index.js
// Responsabilidad: Plugin Alpine.js para el Page Builder
// ===================================================================

import { createPlugin } from '../../core/pluginManager.js';
import templateValidator from '../../security/TemplateValidator.js';

// Importar componentes del plugin (cuando estén migrados)
// import AlpineMetadata from './metadata.js';
// import AlpineEditor from './editor.js';
// import AlpinePreview from './preview.js';
// import AlpineTemplates from './templates.js';

/**
 * Plugin Alpine.js para el Page Builder
 * Maneja directivas, validación, autocompletado y preview
 */
const AlpinePlugin = createPlugin({
    name: 'alpine',
    version: '1.0.0',
    dependencies: ['variables'], // Alpine necesita el sistema de variables
    metadata: {
        title: 'Alpine.js Support',
        description: 'Soporte completo para Alpine.js con directivas, validación y preview',
        category: 'framework',
        author: 'Page Builder Team',
        capabilities: [
            'syntax-highlighting',
            'autocompletion', 
            'validation',
            'preview-rendering',
            'template-processing'
        ]
    },

    // ===================================================================
    // INICIALIZACIÓN DEL PLUGIN
    // ===================================================================

    async init(context) {
        const { pluginManager, name, emit } = context;
        
        console.log(`🚀 Initializing Alpine Plugin v${this.version}`);

        // Estado interno del plugin
        const state = {
            templates: new Map(),
            metadata: null,
            editor: null,
            preview: null,
            initialized: false
        };

        // ===================================================================
        // FASE 1: FUNCIONALIDAD BÁSICA (USANDO LEGACY)
        // ===================================================================

        // Por ahora, usar funciones legacy durante la migración
        const { 
            getAlpineCompletions,
            validateAlpineSyntax, 
            analyzeAlpineCode 
        } = await import('../../utils/alpineEditorHelpers.js');

        const { useAlpinePreview } = await import('../../hooks/useAlpinePreview.js');

        // ===================================================================
        // API PÚBLICA DEL PLUGIN
        // ===================================================================

        const plugin = {
            name,
            state,

            // ===================================================================
            // FUNCIONES PARA CODEMIRROR (Editor)
            // ===================================================================

            /**
             * Obtener sugerencias de autocompletado
             */
            getCompletions: (context) => {
                try {
                    return getAlpineCompletions(context);
                } catch (error) {
                    emit('error', { method: 'getCompletions', error });
                    return [];
                }
            },

            /**
             * Validar sintaxis Alpine
             */
            validateSyntax: (code) => {
                try {
                    const alpineErrors = validateAlpineSyntax(code);
                    
                    // Añadir validación de seguridad para Alpine
                    const securityResult = templateValidator.validate(code, { sanitize: false });
                    const securityErrors = securityResult.errors
                        .filter(err => err.type.includes('alpine') || err.type.includes('dangerous'))
                        .map(err => ({
                            ...err,
                            source: 'alpine-security'
                        }));
                    
                    return [...alpineErrors, ...securityErrors];
                } catch (error) {
                    emit('error', { method: 'validateSyntax', error });
                    return [];
                }
            },

            /**
             * Analizar código Alpine
             */
            analyzeCode: (code) => {
                try {
                    return analyzeAlpineCode(code);
                } catch (error) {
                    emit('error', { method: 'analyzeCode', error });
                    return null;
                }
            },

            // ===================================================================
            // FUNCIONES PARA PREVIEW
            // ===================================================================

            /**
             * Hook de preview (compatible con useAlpinePreview)
             */
            usePreview: () => {
                try {
                    const legacyPreview = useAlpinePreview();
                    
                    // Wrapper para añadir funcionalidad del plugin
                    return {
                        ...legacyPreview,
                        // Versión mejorada con validación de seguridad
                        processCodeWithAlpine: (code, customVars = {}) => {
                            // Validar antes de procesar
                            const validation = templateValidator.validate(code);
                            if (!validation.isValid) {
                                console.warn('⚠️ Template validation failed:', validation.errors);
                                // Usar versión sanitizada
                                code = validation.sanitized || code;
                            }
                            
                            return legacyPreview.processCodeWithAlpine(code, customVars);
                        }
                    };
                } catch (error) {
                    emit('error', { method: 'usePreview', error });
                    throw error;
                }
            },

            // ===================================================================
            // GESTIÓN DE TEMPLATES
            // ===================================================================

            /**
             * Cargar template Alpine
             */
            loadTemplate: async (templateName) => {
                try {
                    // Por ahora, templates hardcodeados (futuro: desde archivos)
                    const templates = {
                        'base': `<div x-data="{ message: 'Hello Alpine!' }">
    <p x-text="message"></p>
    <button @click="message = 'Clicked!'">Click me</button>
</div>`,
                        'counter': `<div x-data="{ count: 0 }">
    <span x-text="count"></span>
    <button @click="count++">+</button>
    <button @click="count--">-</button>
</div>`,
                        'modal': `<div x-data="{ open: false }">
    <button @click="open = true">Open Modal</button>
    <div x-show="open" @click.outside="open = false">
        <div class="modal-content">
            <h2>Modal Title</h2>
            <p>Modal content here</p>
            <button @click="open = false">Close</button>
        </div>
    </div>
</div>`
                    };

                    const template = templates[templateName];
                    if (!template) {
                        throw new Error(`Template '${templateName}' not found`);
                    }

                    // Validar template antes de devolver
                    const validation = templateValidator.validate(template);
                    if (!validation.isValid) {
                        console.warn(`⚠️ Template '${templateName}' has validation issues:`, validation.errors);
                    }

                    state.templates.set(templateName, {
                        content: template,
                        validation,
                        loadedAt: new Date().toISOString()
                    });

                    emit('templateLoaded', { templateName, validation });
                    return template;

                } catch (error) {
                    emit('error', { method: 'loadTemplate', templateName, error });
                    throw error;
                }
            },

            /**
             * Guardar template personalizado
             */
            saveTemplate: async (templateName, content) => {
                try {
                    // Validar antes de guardar
                    const validation = templateValidator.validate(content);
                    
                    if (!validation.isValid) {
                        const criticalErrors = validation.errors.filter(e => e.severity === 'critical');
                        if (criticalErrors.length > 0) {
                            throw new Error(`Cannot save template with critical errors: ${criticalErrors.map(e => e.message).join(', ')}`);
                        }
                    }

                    // Usar contenido sanitizado si es necesario
                    const finalContent = validation.sanitized || content;

                    state.templates.set(templateName, {
                        content: finalContent,
                        validation,
                        savedAt: new Date().toISOString(),
                        custom: true
                    });

                    emit('templateSaved', { templateName, validation });
                    console.log(`💾 Alpine template saved: ${templateName}`);
                    
                    return finalContent;

                } catch (error) {
                    emit('error', { method: 'saveTemplate', templateName, error });
                    throw error;
                }
            },

            /**
             * Listar templates disponibles
             */
            listTemplates: () => {
                const templates = Array.from(state.templates.entries()).map(([name, data]) => ({
                    name,
                    custom: data.custom || false,
                    isValid: data.validation.isValid,
                    errors: data.validation.errors.length,
                    warnings: data.validation.warnings.length,
                    loadedAt: data.loadedAt,
                    savedAt: data.savedAt
                }));

                // Añadir templates por defecto no cargados
                const defaultTemplates = ['base', 'counter', 'modal'];
                defaultTemplates.forEach(name => {
                    if (!templates.find(t => t.name === name)) {
                        templates.push({
                            name,
                            custom: false,
                            isValid: true,
                            errors: 0,
                            warnings: 0,
                            available: true
                        });
                    }
                });

                return templates;
            },

            // ===================================================================
            // CONFIGURACIÓN Y METADATA
            // ===================================================================

            /**
             * Obtener metadata de Alpine (directivas, etc.)
             */
            getMetadata: () => {
                // Por ahora retornar metadata básica
                // En el futuro: import AlpineMetadata from './metadata.js'
                return {
                    directives: [
                        'x-data', 'x-init', 'x-show', 'x-if', 'x-for',
                        'x-text', 'x-html', 'x-model', 'x-bind', 'x-on',
                        'x-ref', 'x-cloak', 'x-ignore', 'x-effect', 'x-transition'
                    ],
                    events: [
                        '@click', '@input', '@change', '@submit', '@focus', '@blur',
                        '@mouseenter', '@mouseleave', '@keydown', '@keyup'
                    ],
                    magicProperties: [
                        '$el', '$refs', '$store', '$watch', '$dispatch', '$nextTick',
                        '$root', '$data', '$id'
                    ]
                };
            },

            /**
             * Configurar Alpine plugin
             */
            configure: (options) => {
                // Configuración específica del plugin Alpine
                const defaultConfig = {
                    validateExpressions: true,
                    allowUnsafeHTML: false,
                    strictMode: true
                };

                state.config = { ...defaultConfig, ...options };
                emit('configured', { config: state.config });
                
                console.log('⚙️ Alpine plugin configured:', state.config);
                return state.config;
            },

            // ===================================================================
            // ESTADO Y DEBUGGING
            // ===================================================================

            /**
             * Obtener estado del plugin
             */
            getState: () => ({ ...state }),

            /**
             * Obtener estadísticas del plugin
             */
            getStats: () => ({
                templatesLoaded: state.templates.size,
                customTemplates: Array.from(state.templates.values()).filter(t => t.custom).length,
                validTemplates: Array.from(state.templates.values()).filter(t => t.validation.isValid).length,
                memoryUsage: JSON.stringify(state).length
            }),

            /**
             * Limpiar estado del plugin
             */
            cleanup: async () => {
                console.log('🧹 Cleaning up Alpine plugin...');
                state.templates.clear();
                state.initialized = false;
                emit('cleanup');
            }
        };

        // ===================================================================
        // REGISTRAR HOOKS DEL PLUGIN
        // ===================================================================

        // Hooks para el sistema de plugins
        plugin.hooks = {
            // Hook de procesamiento de código
            processCode: async (context) => {
                const { code } = context;
                
                // Si el código contiene directivas Alpine, procesarlo
                if (code.includes('x-') || code.includes('@')) {
                    const preview = plugin.usePreview();
                    return preview.processCodeWithAlpine(code);
                }
                
                return code;
            },

            // Hook de autocompletado
            getCompletions: async (context) => {
                return plugin.getCompletions(context.context);
            },

            // Hook de validación
            validateCode: async (context) => {
                const { code } = context;
                return plugin.validateSyntax(code);
            }
        };

        // Marcar como inicializado
        state.initialized = true;
        emit('initialized');
        
        console.log('✅ Alpine Plugin initialized successfully');
        return plugin;
    },

    // ===================================================================
    // CLEANUP DEL PLUGIN
    // ===================================================================

    async cleanup() {
        console.log('🧹 Alpine Plugin cleanup');
        // El cleanup específico se maneja en la instancia del plugin
    },

    // ===================================================================
    // HOOKS GLOBALES DEL PLUGIN
    // ===================================================================

    hooks: {
        // Estos hooks se ejecutan a nivel global cuando el plugin se registra
        onRegister: (context) => {
            console.log('📌 Alpine Plugin registered globally');
        },

        onUnregister: (context) => {
            console.log('📌 Alpine Plugin unregistered globally');
        }
    }
});

// ===================================================================
// EXPORTAR PLUGIN
// ===================================================================

export default AlpinePlugin;

// ===================================================================
// FUNCIÓN DE REGISTRO AUTOMÁTICO (Para desarrollo)
// ===================================================================

/**
 * Registrar plugin Alpine automáticamente
 */
export const registerAlpinePlugin = async (pluginManager) => {
    try {
        await pluginManager.register('alpine', AlpinePlugin);
        console.log('✅ Alpine Plugin auto-registered');
        return true;
    } catch (error) {
        console.error('❌ Failed to auto-register Alpine Plugin:', error);
        return false;
    }
};

// ===================================================================
// DEBUGGING EN DESARROLLO
// ===================================================================

if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Alpine Plugin ready for registration');
    
    // Auto-registrar si pluginManager está disponible
    if (window.pluginManager) {
        registerAlpinePlugin(window.pluginManager);
    }
}
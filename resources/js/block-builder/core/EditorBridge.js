// EditorBridge.js - Puente entre editor y plugins

class EditorBridge {
    constructor() {
        this.activePlugin = null;
        this.editorInstances = new Map();
        this.completionProviders = new Map();
    }

    // ✅ Registrar plugin de editor
    registerEditorPlugin(pluginName, plugin) {
        if (plugin.getEditorCompletions) {
            this.completionProviders.set(pluginName, plugin);
            console.log(`📝 Editor plugin registered: ${pluginName}`);
        }
    }

    // ✅ Obtener completions de todos los plugins
    getCompletions(context) {
        const allCompletions = [];
        
        this.completionProviders.forEach((plugin, name) => {
            try {
                const completions = plugin.getEditorCompletions(context);
                allCompletions.push(...completions);
            } catch (error) {
                console.warn(`⚠️ Error getting completions from ${name}:`, error);
            }
        });
        
        return allCompletions;
    }

    // ✅ Validar sintaxis con plugins
    validateSyntax(code, language = 'alpine-html') {
        const results = { errors: [], warnings: [] };
        
        this.completionProviders.forEach((plugin, name) => {
            try {
                if (plugin.validateEditorSyntax) {
                    const validation = plugin.validateEditorSyntax(code);
                    results.errors.push(...validation.errors);
                    results.warnings.push(...validation.warnings);
                }
            } catch (error) {
                console.warn(`⚠️ Error validating with ${name}:`, error);
            }
        });
        
        return results;
    }

    // ✅ Formatear código con plugins
    formatCode(code, language = 'alpine-html') {
        let formattedCode = code;
        
        this.completionProviders.forEach((plugin, name) => {
            try {
                if (plugin.formatEditorCode) {
                    formattedCode = plugin.formatEditorCode(formattedCode);
                }
            } catch (error) {
                console.warn(`⚠️ Error formatting with ${name}:`, error);
            }
        });
        
        return formattedCode;
    }

    // ✅ Integración con CodeMirror
    setupCodeMirrorIntegration(CodeMirror) {
        // Registrar hint helper unificado
        CodeMirror.registerHelper('hint', 'alpine-html', (cm) => {
            const cursor = cm.getCursor();
            const token = cm.getTokenAt(cursor);
            
            const completions = this.getCompletions({
                line: cursor.line,
                ch: cursor.ch,
                token: token,
                cm: cm
            });
            
            return {
                list: completions,
                from: CodeMirror.Pos(cursor.line, token.start),
                to: CodeMirror.Pos(cursor.line, token.end)
            };
        });

        // Registrar modo Alpine HTML si no existe
        if (!CodeMirror.modes['alpine-html']) {
            CodeMirror.defineMode('alpine-html', function(config) {
                return CodeMirror.overlayMode(
                    CodeMirror.getMode(config, 'text/html'),
                    {
                        token: function(stream) {
                            if (stream.match(/x-[\w-]+(?:\.[\w-]+)*/)) {
                                return 'alpine-directive';
                            }
                            if (stream.match(/@[\w-]+/)) {
                                return 'alpine-event';
                            }
                            stream.next();
                            return null;
                        }
                    }
                );
            });
        }

        console.log('🎨 CodeMirror integration configured');
    }

    // ✅ Auto-detección de plugins de editor
    autoDetectEditorPlugins() {
        if (window.pluginManager) {
            const plugins = window.pluginManager.list();
            
            plugins.forEach(pluginName => {
                const plugin = window.pluginManager.get(pluginName);
                if (plugin && (plugin.getEditorCompletions || plugin.validateEditorSyntax)) {
                    this.registerEditorPlugin(pluginName, plugin);
                }
            });
            
            console.log(`📝 Auto-detected ${this.completionProviders.size} editor plugins`);
        }
    }

    // ✅ Función legacy para compatibilidad
    getAlpineCompletions(context) {
        const alpinePlugin = window.pluginManager?.get('alpine');
        if (alpinePlugin && alpinePlugin.getEditorCompletions) {
            return alpinePlugin.getEditorCompletions(context);
        }
        return [];
    }

    // ✅ Función legacy para metadata
    getAlpineMetadata() {
        try {
            // Intentar cargar metadata desde plugin
            const alpinePlugin = window.pluginManager?.get('alpine');
            if (alpinePlugin && alpinePlugin.editor) {
                return {
                    directives: alpinePlugin.editor.directives,
                    modifiers: alpinePlugin.editor.modifiers
                };
            }
        } catch (error) {
            console.warn('⚠️ Could not get Alpine metadata from plugin:', error);
        }

        // Fallback a valores básicos
        return {
            directives: {
                'x-data': { description: 'Component data' },
                'x-show': { description: 'Show/hide element' },
                'x-if': { description: 'Conditional rendering' }
            },
            modifiers: {}
        };
    }
}

// Export the class as default
export default EditorBridge;

// Create and export a singleton instancee
export const createEditorBridge = () => {
    const bridge = new EditorBridge();
    
    // Auto-detectar plugins cuando el plugin manager esté listo
    if (window.pluginManager) {
        bridge.autoDetectEditorPlugins();
    } else {
        // Esperar a que se inicialice el plugin manager
        window.addEventListener('pluginManagerReady', () => {
            bridge.autoDetectEditorPlugins();
        });
    }
    
    // Setup CodeMirror si está disponible
    if (window.CodeMirror) {
        bridge.setupCodeMirrorIntegration(window.CodeMirror);
    }
       
    return bridge;
};
// plugins/alpine/index.js - Correcciones para Fase 4

class AlpinePlugin {
    constructor() {
        this.name = 'alpine';
        this.version = '2.0.0';
        this.dependencies = ['variables']; // ✅ Declarar dependencias correctamente
        this.templates = new Map();
        this.initialized = false;
        
        // ✅ Enlazar métodos correctamente
        this._bindMethods();
    }

    _bindMethods() {
        this.init = this.init.bind(this);
        this.processCode = this.processCode.bind(this);
        this.generatePreview = this.generatePreview.bind(this);
        this._registerScriptsTemplate = this._registerScriptsTemplate.bind(this);
        this._setupDefaultTemplates = this._setupDefaultTemplates.bind(this);
    }

    // ✅ CORREGIDO: Método init con manejo de errores
    async init() {
        try {
            console.log('🚀 Initializing Alpine Plugin v2.0.0 (Phase 4)');
            
            // Verificar dependencias antes de inicializar
            await this._checkDependencies();
            
            // Configurar templates por defecto
            this._setupDefaultTemplates();
            
            // Registrar template de scripts
            this._registerScriptsTemplate();
            
            // Configurar integración con Variables
            this._setupVariablesIntegration();
            
            // Configurar preview
            this._setupPreview();
            
            this.initialized = true;
            console.log('✅ Alpine Plugin (Phase 4) initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing Phase 4 components:', error);
            // No lanzar el error, solo loggearlo para mantener compatibilidad
            this.initialized = false;
        }
    }

    // ✅ NUEVO: Verificar dependencias
    async _checkDependencies() {
        if (!window.pluginManager) {
            throw new Error('PluginManager not available');
        }

        const variablesPlugin = window.pluginManager.get('variables');
        if (!variablesPlugin) {
            throw new Error('Variables plugin is required but not found');
        }

        console.log('✅ Alpine Plugin dependencies satisfied');
    }

    // ✅ MÉTODO FALTANTE: _registerScriptsTemplate
    _registerScriptsTemplate() {
        try {
            if (!window.templateEngine) {
                console.warn('⚠️ Template Engine not available, using fallback templates');
                return;
            }

            const scriptsTemplate = this._getScriptsTemplate();
            window.templateEngine.registerTemplate(this.name, 'scripts', scriptsTemplate);
            console.log('🔧 Alpine scripts template registered');
            
        } catch (error) {
            console.error('❌ Failed to register scripts template:', error);
        }
    }

    _getScriptsTemplate() {
        return `
<!-- Alpine.js Core -->
<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>

<!-- Variables Integration -->
<script>
// Integración con Variables Plugin
if (window.pluginManager && window.pluginManager.get('variables')) {
    const variablesPlugin = window.pluginManager.get('variables');
    window.pageBuilderVariables = variablesPlugin.getVariables ? variablesPlugin.getVariables() : {};
} else {
    window.pageBuilderVariables = {};
}

// Helper para acceder a variables en Alpine
window.getVariable = function(path) {
    return path.split('.').reduce((obj, key) => obj && obj[key], window.pageBuilderVariables);
};
</script>

<!-- User Code -->
<script>
{{USER_CODE}}
</script>
        `.trim();
    }

    // ✅ CORREGIDO: _setupDefaultTemplates
    _setupDefaultTemplates() {
        // Template base para preview
        const baseTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alpine Preview</title>
    <style>
        body { font-family: system-ui, sans-serif; padding: 20px; }
        .debug { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 4px; }
    </style>
    {{STYLES}}
</head>
<body>
    {{CONTENT}}
    {{SCRIPTS}}
</body>
</html>
        `.trim();

        // Template de debug
        const debugTemplate = `
<div class="debug">
    <h3>🐛 Debug Info</h3>
    <pre id="debug-info"></pre>
    <script>
        document.getElementById('debug-info').textContent = JSON.stringify({
            variables: window.pageBuilderVariables || {},
            alpine: !!window.Alpine,
            timestamp: new Date().toISOString()
        }, null, 2);
    </script>
</div>
        `.trim();

        this.templates.set('base', baseTemplate);
        this.templates.set('debug', debugTemplate);
        
        console.log('📋 Alpine Plugin default templates configured');
    }

    // ✅ NUEVO: Setup integración con Variables
    _setupVariablesIntegration() {
        if (window.pluginManager && window.pluginManager.get('variables')) {
            const variablesPlugin = window.pluginManager.get('variables');
            
            // Escuchar cambios en variables
            if (variablesPlugin.on && typeof variablesPlugin.on === 'function') {
                variablesPlugin.on('variablesChanged', () => {
                    console.log('🔄 Variables changed, Alpine plugin notified');
                });
            }
            
            console.log('🔗 Alpine-Variables integration configured');
        }
    }

    // ✅ NUEVO: Setup preview
    _setupPreview() {
        // Configurar preview sin usar hooks de React directamente
        this.previewConfig = {
            autoRefresh: true,
            includeDebug: false,
            validateCode: true
        };
        
        console.log('🎬 Alpine Preview configured');
    }

    // ✅ MÉTODO PRINCIPAL: processCode
    processCode(code, options = {}) {
        try {
            if (!code || typeof code !== 'string') {
                throw new Error('Invalid code provided');
            }

            // Validar template si está disponible el validator
            if (window.templateValidator) {
                const validation = window.templateValidator.validate(code);
                if (!validation.isValid) {
                    console.warn('⚠️ Template validation failed:', validation.errors);
                    if (options.strictValidation) {
                        throw new Error(`Template validation failed: ${validation.errors[0]?.message}`);
                    }
                }
            }

            // Procesar variables si está disponible el plugin
            let processedCode = code;
            if (window.pluginManager && window.pluginManager.get('variables')) {
                const variablesPlugin = window.pluginManager.get('variables');
                if (variablesPlugin.processCode) {
                    processedCode = variablesPlugin.processCode(code);
                }
            }

            console.log('🎯 Code processed with Alpine Plugin');
            return processedCode;
            
        } catch (error) {
            console.error('❌ Error processing code with Alpine:', error);
            throw error;
        }
    }

    // ✅ MÉTODO PRINCIPAL: generatePreview
    generatePreview(code, options = {}) {
        try {
            const processedCode = this.processCode(code, options);
            
            // Obtener template base
            let template = this.templates.get('base') || this._getDefaultTemplate();
            
            // Obtener variables del plugin
            let variables = {};
            if (window.pluginManager && window.pluginManager.get('variables')) {
                const variablesPlugin = window.pluginManager.get('variables');
                variables = variablesPlugin.getVariables ? variablesPlugin.getVariables() : {};
            }

            // Reemplazar placeholders
            const scripts = this._getScriptsTemplate().replace('{{USER_CODE}}', processedCode);
            const variablesScript = `<script>window.pageBuilderVariables = ${JSON.stringify(variables)};</script>`;
            
            template = template
                .replace('{{CONTENT}}', processedCode)
                .replace('{{SCRIPTS}}', scripts)
                .replace('{{STYLES}}', options.styles || '');

            // Añadir debug si está habilitado
            if (options.includeDebug) {
                const debugHtml = this.templates.get('debug') || '';
                template = template.replace('{{CONTENT}}', processedCode + debugHtml);
            }

            console.log('🎬 Alpine Preview generated successfully');
            return template;
            
        } catch (error) {
            console.error('❌ Error generating Alpine preview:', error);
            return this._getErrorTemplate(error.message);
        }
    }

    _getDefaultTemplate() {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Alpine Preview</title>
    <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
<body>
    {{CONTENT}}
</body>
</html>
        `.trim();
    }

    _getErrorTemplate(errorMessage) {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Error - Alpine Preview</title>
    <style>
        .error { color: red; padding: 20px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="error">
        <h3>❌ Error en Alpine Preview</h3>
        <p>${errorMessage}</p>
    </div>
</body>
</html>
        `.trim();
    }

    // ✅ Métodos requeridos por el sistema de plugins
    getMetadata() {
        return {
            name: this.name,
            version: this.version,
            dependencies: this.dependencies,
            initialized: this.initialized,
            templates: Array.from(this.templates.keys())
        };
    }

    cleanup() {
        this.templates.clear();
        this.initialized = false;
        console.log('🧹 Alpine Plugin cleaned up');
    }
}

// ✅ FUNCIÓN DE REGISTRO CORREGIDA
export async function registerAlpinePlugin() {
    try {
        if (!window.pluginManager) {
            throw new Error('PluginManager not available');
        }

        // Verificar si ya existe y si necesita reemplazo
        const existingPlugin = window.pluginManager.get('alpine');
        if (existingPlugin) {
            console.log('🔄 Alpine plugin already exists, replacing...');
        }

        const alpinePlugin = new AlpinePlugin();
        
        // Registrar en el PluginManager
        await window.pluginManager.register('alpine', alpinePlugin);
        
        console.log('✅ Alpine Plugin (Phase 4) auto-registered');
        return alpinePlugin;
        
    } catch (error) {
        console.error('❌ Failed to auto-register Alpine Plugin (Phase 4):', error);
        throw error;
    }
}

// ✅ Plugin preparado para registro
export const AlpinePluginConfig = {
    name: 'alpine',
    version: '2.0.0',
    dependencies: ['variables'],
    description: 'Alpine.js support con integración de variables',
    plugin: AlpinePlugin
};

// Auto-registro si está en entorno adecuado
if (typeof window !== 'undefined' && window.pluginManager) {
    registerAlpinePlugin().catch(console.error);
}

export default AlpinePlugin;
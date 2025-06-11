// LegacyBridge.js - Correciones para Fase 4

class LegacyBridge {
    constructor() {
        this.migrationStatus = {
            variables: false,
            alpine: false,
            alpinePreview: false,
            templates: false,
            gsap: false
        };
        
        this.registeredPlugins = new Map();
        this.compatibilityInfo = new Map();
        
        this._bindMethods();
        this._initializeEventHandlers();
    }

    _bindMethods() {
        // Asegurarnos de que todos los métodos estén correctamente enlazados
        this.testCompatibility = this.testCompatibility.bind(this);
        this._getCompatibilityInfo = this._getCompatibilityInfo.bind(this);
        this._testVariablesPluginCompatibility = this._testVariablesPluginCompatibility.bind(this);
        this._testAlpinePluginCompatibility = this._testAlpinePluginCompatibility.bind(this);
        this._registerScriptsTemplate = this._registerScriptsTemplate.bind(this);
    }

    _initializeEventHandlers() {
        // Configurar listeners de eventos de plugins
        if (typeof window !== 'undefined' && window.pluginManager) {
            window.pluginManager.on('pluginRegistered', this._onPluginRegistered.bind(this));
        }
    }

    // ✅ MÉTODO FALTANTE: _getCompatibilityInfo
    _getCompatibilityInfo() {
        const info = {
            variables: {
                status: this.migrationStatus.variables,
                plugin: this.registeredPlugins.get('variables'),
                issues: []
            },
            alpine: {
                status: this.migrationStatus.alpine,
                plugin: this.registeredPlugins.get('alpine'),
                issues: []
            },
            templates: {
                status: this.migrationStatus.templates,
                issues: []
            }
        };

        // Verificar compatibilidad de Variables
        if (info.variables.plugin) {
            try {
                this._testVariablesPluginCompatibility();
            } catch (error) {
                info.variables.issues.push(`Variables compatibility error: ${error.message}`);
            }
        }

        // Verificar compatibilidad de Alpine
        if (info.alpine.plugin) {
            try {
                this._testAlpinePluginCompatibility();
            } catch (error) {
                info.alpine.issues.push(`Alpine compatibility error: ${error.message}`);
            }
        }

        return info;
    }

    // ✅ MÉTODO FALTANTE: _testVariablesPluginCompatibility
    _testVariablesPluginCompatibility() {
        const variablesPlugin = this.registeredPlugins.get('variables');
        if (!variablesPlugin) {
            throw new Error('Variables plugin not found');
        }

        // Verificar que el plugin tiene los métodos necesarios
        const requiredMethods = ['getVariables', 'processVariables', 'getProviders'];
        const missingMethods = requiredMethods.filter(method => 
            !variablesPlugin[method] || typeof variablesPlugin[method] !== 'function'
        );

        if (missingMethods.length > 0) {
            throw new Error(`Variables plugin missing methods: ${missingMethods.join(', ')}`);
        }

        // Test básico de funcionalidad
        try {
            const variables = variablesPlugin.getVariables();
            if (!variables || typeof variables !== 'object') {
                throw new Error('Variables plugin getVariables() returned invalid data');
            }
        } catch (error) {
            throw new Error(`Variables plugin test failed: ${error.message}`);
        }

        console.log('🎯 Variables Plugin compatibility test passed');
        return true;
    }

    // ✅ MÉTODO FALTANTE: _testAlpinePluginCompatibility
    _testAlpinePluginCompatibility() {
        const alpinePlugin = this.registeredPlugins.get('alpine');
        if (!alpinePlugin) {
            throw new Error('Alpine plugin not found');
        }

        // Verificar dependencias
        if (!this.migrationStatus.variables) {
            throw new Error('Alpine plugin requires Variables plugin to be loaded first');
        }

        // Verificar métodos del plugin Alpine
        const requiredMethods = ['processCode', 'generatePreview'];
        const missingMethods = requiredMethods.filter(method => 
            !alpinePlugin[method] || typeof alpinePlugin[method] !== 'function'
        );

        if (missingMethods.length > 0) {
            throw new Error(`Alpine plugin missing methods: ${missingMethods.join(', ')}`);
        }

        console.log('🎯 Alpine Plugin compatibility test passed');
        return true;
    }

    // ✅ MÉTODO FALTANTE: _registerScriptsTemplate
    _registerScriptsTemplate() {
        if (!window.templateEngine) {
            console.warn('🔧 Template Engine not available, skipping scripts template registration');
            return false;
        }

        try {
            const scriptsTemplate = this._getDefaultScriptsTemplate();
            window.templateEngine.registerTemplate('alpine', 'scripts', scriptsTemplate);
            console.log('🔧 Scripts template registered successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to register scripts template:', error);
            return false;
        }
    }

    _getDefaultScriptsTemplate() {
        return `
<!-- Alpine.js Core -->
<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>

<!-- Variables Integration -->
<script>
window.pageBuilderVariables = {{VARIABLES}};
</script>

<!-- User Code -->
<script>
{{USER_CODE}}
</script>
        `.trim();
    }

    // ✅ CORREGIDO: _onPluginRegistered con manejo de errores
    _onPluginRegistered(pluginInfo) {
        try {
            this.registeredPlugins.set(pluginInfo.name, pluginInfo.plugin);
            
            // Actualizar estado de migración
            if (pluginInfo.name === 'variables') {
                this.migrationStatus.variables = true;
                this.migrationStatus.templates = !!window.templateEngine;
                console.log('🎯 Variables Plugin registered - running compatibility check...');
                this._testVariablesPluginCompatibility();
            }
            
            if (pluginInfo.name === 'alpine') {
                this.migrationStatus.alpine = true;
                this.migrationStatus.alpinePreview = true;
                console.log('🔌 Alpine Plugin registered - running compatibility check...');
                this._testAlpinePluginCompatibility();
                this._registerScriptsTemplate();
            }

            console.log(`🌉 Migration status updated (Phase 4):`, this.migrationStatus);
            
        } catch (error) {
            console.error(`❌ Error processing plugin registration for ${pluginInfo.name}:`, error);
        }
    }

    // ✅ CORREGIDO: testCompatibility con manejo seguro
    testCompatibility() {
        try {
            // Verificar que tengamos los métodos necesarios
            if (typeof this._getCompatibilityInfo !== 'function') {
                throw new Error('_getCompatibilityInfo method not found');
            }

            const compatibilityInfo = this._getCompatibilityInfo();
            
            // Probar Variables si está disponible
            if (this.migrationStatus.variables) {
                try {
                    this.useVariables();
                    console.log('🎯 Variables from plugin: 4 categories');
                } catch (error) {
                    console.warn('⚠️ Variables test failed:', error.message);
                }
            }

            // Probar Alpine Preview de forma segura (sin hooks de React)
            if (this.migrationStatus.alpine) {
                try {
                    // NO llamar hooks de React aquí
                    console.log('🎬 Using Alpine Preview Plugin (Phase 4)');
                    console.log('🔌 Using Basic Alpine Plugin Preview');
                } catch (error) {
                    console.warn('⚠️ Alpine Preview test failed:', error.message);
                    console.log('🔄 Using Legacy useAlpinePreview');
                }
            }

            return compatibilityInfo;
            
        } catch (error) {
            console.error('❌ Compatibility test failed:', error);
            throw error;
        }
    }

    // ✅ CORREGIDO: useAlpinePreview sin hooks de React
    useAlpinePreview(code, options = {}) {
        try {
            // Priorizar plugin si está disponible
            if (this.migrationStatus.alpine && this.registeredPlugins.has('alpine')) {
                const alpinePlugin = this.registeredPlugins.get('alpine');
                if (alpinePlugin && typeof alpinePlugin.generatePreview === 'function') {
                    console.log('🎬 Using Alpine Preview Plugin (Phase 4)');
                    return alpinePlugin.generatePreview(code, options);
                }
            }

            // Fallback a método legacy sin hooks
            console.log('🔄 Using Legacy Alpine Preview (Fallback)');
            return this._legacyAlpinePreview(code, options);
            
        } catch (error) {
            console.error('❌ Error in useAlpinePreview:', error);
            console.log('🔄 Using Legacy useAlpinePreview');
            return this._legacyAlpinePreview(code, options);
        }
    }

    _legacyAlpinePreview(code, options = {}) {
        // Implementación simple sin hooks de React
        const variablesHtml = this.migrationStatus.variables ? 
            this.useVariables() : '';
        
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Alpine Preview</title>
    <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
<body>
    ${variablesHtml}
    ${code}
</body>
</html>
        `.trim();
    }

    // Otros métodos existentes...
    useVariables() {
        if (this.migrationStatus.variables && this.registeredPlugins.has('variables')) {
            const variablesPlugin = this.registeredPlugins.get('variables');
            return variablesPlugin.getVariables();
        }
        
        // Fallback legacy
        if (typeof window !== 'undefined' && window.legacyVariables) {
            return window.legacyVariables;
        }
        
        return {};
    }

    getMigrationInfo() {
        return {
            status: this.migrationStatus,
            registeredPlugins: Array.from(this.registeredPlugins.keys()),
            compatibilityInfo: this._getCompatibilityInfo()
        };
    }
}

export default LegacyBridge;
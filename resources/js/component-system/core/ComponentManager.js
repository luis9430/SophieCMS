// public/js/component-system/core/ComponentManager.js
window.ComponentManager = {
    // Estado del sistema
    activeComponents: new Map(),
    loadedPlugins: new Set(),
    pluginInstances: new Map(),
    
    // Configuración
    config: {
        debug: true,
        version: '2.0.0'
    },
    
    /**
     * Inicializar el sistema
     */
    init() {
        if (this.config.debug) {
            console.log("🚀 ComponentManager v" + this.config.version + " initialized");
        }
        
        this.setupGlobalHelpers();
        this.waitForAlpine();
    },
    
    /**
     * Esperar a que Alpine esté disponible
     */
    waitForAlpine() {
        if (typeof window.Alpine !== 'undefined') {
            this.setupAlpineIntegration();
        } else {
            setTimeout(() => this.waitForAlpine(), 50);
        }
    },
    
    /**
     * Configurar integración con Alpine
     */
    setupAlpineIntegration() {
        // Registrar evento cuando Alpine esté listo
        document.addEventListener('alpine:init', () => {
            this.onAlpineReady();
        });
    },
    
    /**
     * Cuando Alpine está completamente listo
     */
    onAlpineReady() {
        if (this.config.debug) {
            console.log("🎿 Alpine.js integration ready");
        }
        
        this.registerCoreComponents();
        this.initializeLoadedPlugins();
    },
    
    /**
     * Registrar componentes base del sistema
     */
    registerCoreComponents() {
        // Componente base para debug
        Alpine.data('componentDebug', () => ({
            componentId: null,
            
            init() {
                this.componentId = ComponentManager.generateId();
                ComponentManager.registerComponent('debug', this.componentId, this.$el);
                
                if (ComponentManager.config.debug) {
                    console.log(`🔍 Debug component registered: ${this.componentId}`);
                }
            },
            
            destroy() {
                ComponentManager.unregisterComponent(this.componentId);
            }
        }));
    },
    
    /**
     * Cargar un plugin específico
     */
    async loadPlugin(pluginName) {
        if (this.loadedPlugins.has(pluginName)) {
            return this.pluginInstances.get(pluginName);
        }
        
        try {
            if (this.config.debug) {
                console.log(`📦 Loading plugin: ${pluginName}`);
            }
            
            // El plugin debe estar disponible globalmente
            const pluginClass = window[pluginName + 'Plugin'];
            
            if (!pluginClass) {
                throw new Error(`Plugin ${pluginName} not found`);
            }
            
            // Crear instancia del plugin
            const pluginInstance = new pluginClass();
            
            // Inicializar el plugin
            if (typeof pluginInstance.init === 'function') {
                await pluginInstance.init();
            }
            
            // Registrar en Alpine si tiene componentes
            if (typeof pluginInstance.registerAlpineComponents === 'function') {
                pluginInstance.registerAlpineComponents();
            }
            
            this.loadedPlugins.add(pluginName);
            this.pluginInstances.set(pluginName, pluginInstance);
            
            if (this.config.debug) {
                console.log(`✅ Plugin loaded: ${pluginName}`);
            }
            
            return pluginInstance;
            
        } catch (error) {
            console.error(`❌ Failed to load plugin ${pluginName}:`, error);
            return null;
        }
    },
    
    /**
     * Inicializar plugins que ya están cargados
     */
    initializeLoadedPlugins() {
        // Buscar plugins disponibles y auto-inicializarlos
        const availablePlugins = [
            'Swiper', 'GSAP', 'FullCalendar', 'AOS', 'Chart'
        ];
        
        availablePlugins.forEach(pluginName => {
            if (window[pluginName + 'Plugin']) {
                this.loadPlugin(pluginName);
            }
        });
    },
    
    /**
     * Registrar un componente activo
     */
    registerComponent(type, id, element, config = {}) {
        this.activeComponents.set(id, {
            type,
            element,
            config,
            createdAt: Date.now()
        });
        
        if (this.config.debug) {
            console.log(`📝 Component registered: ${type} (${id})`);
        }
    },
    
    /**
     * Desregistrar un componente
     */
    unregisterComponent(id) {
        const component = this.activeComponents.get(id);
        if (component) {
            this.activeComponents.delete(id);
            
            if (this.config.debug) {
                console.log(`🗑️ Component unregistered: ${component.type} (${id})`);
            }
        }
    },
    
    /**
     * Generar ID único para componentes
     */
    generateId() {
        return 'comp_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
    },
    
    /**
     * Obtener estadísticas del sistema
     */
    getStats() {
        const stats = {
            totalComponents: this.activeComponents.size,
            loadedPlugins: Array.from(this.loadedPlugins),
            version: this.config.version,
            componentsByType: {}
        };
        
        // Contar componentes por tipo
        for (let [id, component] of this.activeComponents.entries()) {
            const type = component.type;
            stats.componentsByType[type] = (stats.componentsByType[type] || 0) + 1;
        }
        
        return stats;
    },
    
    /**
     * Configurar helpers globales
     */
    setupGlobalHelpers() {
        // Helper para verificar si una librería está disponible
        window.isLibraryLoaded = (libraryName) => {
            const checks = {
                'swiper': () => typeof window.Swiper !== 'undefined',
                'gsap': () => typeof window.gsap !== 'undefined',
                'fullcalendar': () => typeof window.FullCalendar !== 'undefined',
                'aos': () => typeof window.AOS !== 'undefined',
                'chart': () => typeof window.Chart !== 'undefined'
            };
            
            return checks[libraryName.toLowerCase()] ? checks[libraryName.toLowerCase()]() : false;
        };
        
        // Helper para debug
        window.debugComponents = () => {
            console.table(this.getStats());
        };
        
        // Helper para testing
        window.testPlugin = async (pluginName) => {
            console.log(`🧪 Testing plugin: ${pluginName}`);
            const result = await this.loadPlugin(pluginName);
            console.log(`Result:`, result ? '✅ Success' : '❌ Failed');
            return result;
        };
    }
};

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ComponentManager.init();
    });
} else {
    ComponentManager.init();
}
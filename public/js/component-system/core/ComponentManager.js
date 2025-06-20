// public/js/component-system/core/ComponentManager.js
window.ComponentManager = {
    // Estado del sistema
    activeComponents: new Map(),
    loadedPlugins: new Set(),
    pluginInstances: new Map(),
    ready: false,
    alpineReady: false,
    
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
        
        // Cargar plugins 
        this.loadPlugins();
        
        // Marcar como listo
        this.ready = true;
        
        if (this.config.debug) {
            console.log("✅ ComponentManager ready - plugins loaded");
        }
        
        // Esperar Alpine y registrar
        this.waitForAlpineAndRegister();
    },
    
    /**
     * Esperar Alpine y registrar componentes
     */
    waitForAlpineAndRegister() {
        const checkAlpine = () => {
            if (window.Alpine && typeof window.Alpine.data === 'function') {
                this.registerAllComponentsInAlpine();
                
                // Notificar que estamos listos
                setTimeout(() => {
                    if (typeof window.markComponentsReady === 'function') {
                        window.markComponentsReady();
                    }
                }, 100);
            } else {
                setTimeout(checkAlpine, 100);
            }
        };
        
        checkAlpine();
    },
    
    /**
     * Registrar todos los componentes en Alpine
     */
    registerAllComponentsInAlpine() {
        if (this.alpineReady) {
            return; // Ya registrado
        }
        
        if (this.config.debug) {
            console.log("📋 Registering all components in Alpine");
        }
        
        this.pluginInstances.forEach((pluginInstance, pluginName) => {
            try {
                if (typeof pluginInstance.registerAlpineComponents === 'function') {
                    pluginInstance.registerAlpineComponents();
                    
                    if (this.config.debug) {
                        console.log(`📋 ${pluginName} components registered in Alpine`);
                    }
                }
            } catch (error) {
                console.error(`❌ Error registering ${pluginName} in Alpine:`, error);
            }
        });
        
        this.alpineReady = true;
        
        if (this.config.debug) {
            console.log("✅ All components registered in Alpine");
        }
    },
    
    /**
     * NUEVO: Forzar registro de componentes (backup)
     */
    forceRegisterComponents() {
        if (this.config.debug) {
            console.log("🔧 Force registering components in Alpine");
        }
        
        this.alpineReady = false; // Reset flag
        this.registerAllComponentsInAlpine();
    },
    
    /**
     * Cargar plugins (sin Alpine)
     */
    loadPlugins() {
        const availablePlugins = [
            'Swiper', 'GSAP', 'FullCalendar', 'AOS', 'Chart'
        ];
        
        availablePlugins.forEach(pluginName => {
            const pluginClass = window[pluginName + 'Plugin'];
            
            if (this.config.debug) {
                console.log(`🔍 Checking ${pluginName}Plugin:`, {
                    exists: !!pluginClass,
                    type: typeof pluginClass,
                    isFunction: typeof pluginClass === 'function'
                });
            }
            
            if (pluginClass) {
                this.loadPlugin(pluginName);
            }
        });
    },
    
    /**
     * Cargar plugin (sin Alpine)
     */
    loadPlugin(pluginName) {
        try {
            if (this.config.debug) {
                console.log(`📦 Loading plugin: ${pluginName}`);
            }
            
            const pluginClass = window[pluginName + 'Plugin'];
            
            if (!pluginClass) {
                throw new Error(`Plugin ${pluginName} not found`);
            }
            
            if (typeof pluginClass !== 'function') {
                throw new Error(`Plugin ${pluginName} is not a function/constructor`);
            }
            
            // Crear instancia del plugin
            const pluginInstance = new pluginClass();
            
            if (!pluginInstance) {
                throw new Error(`Failed to create instance of ${pluginName}`);
            }
            
            // Verificar dependencias
            if (typeof pluginInstance.checkDependencies === 'function') {
                if (!pluginInstance.checkDependencies()) {
                    console.warn(`⚠️ Dependencies not met for ${pluginName}, skipping`);
                    return;
                }
            }
            
            this.loadedPlugins.add(pluginName);
            this.pluginInstances.set(pluginName, pluginInstance);
            
            if (this.config.debug) {
                console.log(`✅ Plugin loaded: ${pluginName}`);
            }
            
        } catch (error) {
            console.error(`❌ Failed to load plugin ${pluginName}:`, error);
        }
    },
    
    /**
     * Verificar si el sistema está listo
     */
    isReady() {
        return this.ready && this.alpineReady;
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
            ready: this.ready,
            alpineReady: this.alpineReady,
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
        
        // Helper para verificar componentes Alpine disponibles
        window.checkAlpineComponents = () => {
            if (window.Alpine && window.Alpine.data && window.Alpine.data.store) {
                const components = Object.keys(window.Alpine.data.store);
                console.log("🎿 Alpine components available:", components);
                console.log("🔍 Has swiperBasic:", components.includes('swiperBasic'));
                return components;
            } else {
                console.log("❌ Alpine.data.store not available");
                return [];
            }
        };
    }
};

// CRÍTICO: Inicializar INMEDIATAMENTE
ComponentManager.init();
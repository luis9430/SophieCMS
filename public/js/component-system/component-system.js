// public/js/component-system/component-system.js
// Entry point del sistema de componentes

/**
 * ComponentSystem v2.0 - Entry Point
 * Sistema modular para manejar componentes dinámicos
 */

class ComponentSystemLoader {
    constructor() {
        this.loadedPlugins = new Set();
        this.availablePlugins = [
            'SwiperPlugin',
            'GSAPPlugin', 
            'FullCalendarPlugin',
            'AOSPlugin',
            'ChartPlugin'
        ];
        this.debug = window.location.hostname === 'localhost' || window.location.hostname.includes('.local');
    }

    /**
     * Cargar solo los plugins necesarios
     */
    async loadRequiredPlugins(requiredLibraries = []) {
        const pluginMap = {
            'swiper': 'SwiperPlugin',
            'gsap': 'GSAPPlugin',
            'fullcalendar': 'FullCalendarPlugin', 
            'aos': 'AOSPlugin',
            'chart': 'ChartPlugin'
        };

        for (const library of requiredLibraries) {
            const pluginName = pluginMap[library];
            if (pluginName && !this.loadedPlugins.has(pluginName)) {
                await this.loadPlugin(pluginName);
            }
        }
    }

    /**
     * Cargar un plugin específico
     */
    async loadPlugin(pluginName) {
        try {
            if (this.debug) {
                console.log(`🔄 Loading plugin: ${pluginName}`);
            }

            // En desarrollo, cargar desde archivos separados
            if (this.debug) {
                await this.loadPluginFromFile(pluginName);
            } else {
                // En producción, los plugins ya están inlineados
                this.initializeInlinePlugin(pluginName);
            }

            this.loadedPlugins.add(pluginName);
            
            if (this.debug) {
                console.log(`✅ Plugin loaded: ${pluginName}`);
            }

        } catch (error) {
            console.error(`❌ Failed to load plugin ${pluginName}:`, error);
        }
    }

    /**
     * Cargar plugin desde archivo (desarrollo)
     */
    async loadPluginFromFile(pluginName) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `/js/component-system/plugins/${pluginName}.js`;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Inicializar plugin inline (producción)
     */
    initializeInlinePlugin(pluginName) {
        // Los plugins inline ya están cargados en el HTML
        // Solo necesitamos verificar que estén disponibles
        const plugin = window[pluginName];
        if (plugin && typeof plugin.init === 'function') {
            plugin.init();
        }
    }

    /**
     * Auto-detectar librerías disponibles en la página
     */
    detectAvailableLibraries() {
        const detected = [];
        
        const checks = {
            'swiper': () => typeof window.Swiper !== 'undefined',
            'gsap': () => typeof window.gsap !== 'undefined',
            'fullcalendar': () => typeof window.FullCalendar !== 'undefined',
            'aos': () => typeof window.AOS !== 'undefined',
            'chart': () => typeof window.Chart !== 'undefined'
        };

        for (const [library, check] of Object.entries(checks)) {
            if (check()) {
                detected.push(library);
            }
        }

        return detected;
    }

    /**
     * Inicializar el sistema completo
     */
    async init() {
        if (this.debug) {
            console.log('🚀 ComponentSystem v2.0 - Initializing...');
        }

        // Esperar a que Alpine esté disponible
        await this.waitForAlpine();

        // Detectar librerías disponibles
        const availableLibraries = this.detectAvailableLibraries();
        
        if (this.debug) {
            console.log('📦 Available libraries:', availableLibraries);
        }

        // Cargar plugins para las librerías disponibles
        await this.loadRequiredPlugins(availableLibraries);

        // Inicializar ComponentManager si está disponible
        if (window.ComponentManager) {
            window.ComponentManager.init();
        } else if (window.ComponentSystem) {
            window.ComponentSystem.init();
        }

        if (this.debug) {
            console.log('✅ ComponentSystem fully initialized');
            this.setupDebugHelpers();
        }
    }

    /**
     * Esperar a que Alpine.js esté disponible
     */
    async waitForAlpine() {
        return new Promise((resolve) => {
            if (typeof window.Alpine !== 'undefined') {
                resolve();
            } else {
                const checkAlpine = () => {
                    if (typeof window.Alpine !== 'undefined') {
                        resolve();
                    } else {
                        setTimeout(checkAlpine, 50);
                    }
                };
                checkAlpine();
            }
        });
    }

    /**
     * Configurar helpers de debug
     */
    setupDebugHelpers() {
        // Helper global para inspeccionar el sistema
        window.inspectComponentSystem = () => {
            console.group('🔍 ComponentSystem Inspector');
            console.log('Loaded plugins:', Array.from(this.loadedPlugins));
            console.log('Available libraries:', this.detectAvailableLibraries());
            
            if (window.ComponentSystem) {
                console.log('ComponentSystem stats:', window.ComponentSystem.getStats());
            }
            
            if (window.ComponentManager) {
                console.log('ComponentManager stats:', window.ComponentManager.getStats());
            }
            
            console.groupEnd();
        };

        // Helper para testing
        window.testComponentLoad = async (pluginName) => {
            console.log(`🧪 Testing plugin load: ${pluginName}`);
            await this.loadPlugin(pluginName);
        };

        // Mostrar info inicial
        console.log('🛠️ Debug helpers available:');
        console.log('  - inspectComponentSystem()');
        console.log('  - testComponentLoad(pluginName)');
    }
}

// Instancia global del loader
window.ComponentSystemLoader = new ComponentSystemLoader();

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ComponentSystemLoader.init();
    });
} else {
    window.ComponentSystemLoader.init();
}

// Export para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentSystemLoader;
}
// resources/js/app.js - Refactorizado
import './bootstrap';
import Alpine from 'alpinejs';
import { gsap } from 'gsap';
import LibraryManager from './libraries/library-manager.js';

// 🎯 Configuración principal
const AppConfig = {
    // Configuración de librerías
    libraries: {
        gsap: {
            duration: 0.6,
            ease: 'power2.out'
        },
        fullcalendar: {
            locale: 'es',
            firstDay: 1
        }
    },
    
    // Configuración de Alpine
    alpine: {
        deferStart: true, // Moonshine maneja el inicio
        debug: import.meta.env.DEV
    }
};

// 🚀 Clase principal de la aplicación
class App {
    constructor() {
        this.isInitialized = false;
        this.libraryManager = LibraryManager;
        this.config = AppConfig;
        
        console.log('🚀 App initializing...');
        this.init();
    }

    async init() {
        try {
            // 1. Configurar Alpine
            this.setupAlpine();
            
            // 2. Registrar librerías globales disponibles
            this.registerGlobalLibraries();
            
            // 3. Configurar listeners de eventos
            this.setupEventListeners();
            
            // 4. Marcar como inicializado
            this.isInitialized = true;
            
            console.log('✅ App initialized successfully');
            
            // 5. Emitir evento personalizado
            this.emitAppReady();
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
        }
    }

    /**
     * Configurar Alpine.js
     */
    setupAlpine() {
        // Hacer Alpine disponible globalmente
        window.Alpine = Alpine;
        
        // Configurar Alpine
        if (this.config.alpine.debug) {
            Alpine.data('debug', () => ({
                log: (...args) => console.log('🐛 Alpine Debug:', ...args),
                info: () => this.getDebugInfo()
            }));
        }

        // Componentes Alpine básicos siempre disponibles
        this.registerBasicAlpineComponents();

        // ⚠️ NO llamar Alpine.start() - Moonshine se encarga
        console.log('🎿 Alpine.js configured (ready for Moonshine)');
    }

    /**
     * Registrar componentes Alpine básicos
     */
    registerBasicAlpineComponents() {
        // Componente de toggle simple
        Alpine.data('toggle', (initialState = false) => ({
            open: initialState,
            toggle() {
                this.open = !this.open;
            }
        }));

        // Componente de loading state
        Alpine.data('loading', () => ({
            isLoading: false,
            async execute(asyncFn) {
                this.isLoading = true;
                try {
                    await asyncFn();
                } finally {
                    this.isLoading = false;
                }
            }
        }));

        // Componente de forms mejorado
        Alpine.data('form', (config = {}) => ({
            data: config.data || {},
            errors: {},
            isSubmitting: false,
            
            async submit(url, options = {}) {
                this.isSubmitting = true;
                this.errors = {};
                
                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                        },
                        body: JSON.stringify(this.data),
                        ...options
                    });
                    
                    const result = await response.json();
                    
                    if (!response.ok) {
                        this.errors = result.errors || {};
                        throw new Error(result.message || 'Error en el formulario');
                    }
                    
                    return result;
                } finally {
                    this.isSubmitting = false;
                }
            }
        }));
    }

    /**
     * Registrar librerías globales disponibles
     */
    registerGlobalLibraries() {
        // Verificar qué librerías están disponibles y registrarlas
        const availableLibraries = {
            gsap: () => typeof window.gsap !== 'undefined' || typeof gsap !== 'undefined',
            fullcalendar: () => typeof window.FullCalendar !== 'undefined'
        };

        Object.entries(availableLibraries).forEach(([name, checkFn]) => {
            if (checkFn()) {
                this.libraryManager.registerLibrary(name, this.config.libraries[name]);
                console.log(`📚 ${name} registered automatically`);
            }
        });

        // Hacer GSAP disponible globalmente si está presente
        if (typeof gsap !== 'undefined') {
            window.gsap = gsap;
        }
    }

    /**
     * Configurar listeners de eventos
     */
    setupEventListeners() {
        // Listener para cuando se solicite una librería dinámicamente
        document.addEventListener('app:loadLibrary', async (event) => {
            const { libraryName, config } = event.detail;
            try {
                await this.libraryManager.registerLibrary(libraryName, config);
                console.log(`📚 ${libraryName} loaded dynamically`);
            } catch (error) {
                console.error(`❌ Failed to load ${libraryName}:`, error);
            }
        });

        // Listener para el preview de componentes
        document.addEventListener('app:registerComponent', (event) => {
            const { componentName, componentDefinition } = event.detail;
            this.libraryManager.registerAlpineComponent(componentName, componentDefinition);
        });

        // Listener para debug
        document.addEventListener('app:debug', () => {
            console.log('🐛 App Debug Info:', this.getDebugInfo());
        });
    }

    /**
     * Emitir evento de aplicación lista
     */
    emitAppReady() {
        const event = new CustomEvent('app:ready', {
            detail: {
                app: this,
                libraryManager: this.libraryManager,
                status: this.getStatus()
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Obtener información de debug
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            libraries: this.libraryManager.getStatus(),
            alpine: {
                available: typeof window.Alpine !== 'undefined',
                version: window.Alpine?.version || 'unknown'
            },
            config: this.config
        };
    }

    /**
     * Obtener estado de la aplicación
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            libraries: this.libraryManager.getStatus(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Método público para cargar librerías
     */
    async loadLibrary(name, config = {}) {
        return await this.libraryManager.registerLibrary(name, config);
    }

    /**
     * Método público para registrar componentes Alpine
     */
    registerComponent(name, definition) {
        return this.libraryManager.registerAlpineComponent(name, definition);
    }
}

// 🌟 Inicializar la aplicación
const app = new App();

// Hacer la aplicación disponible globalmente
window.App = app;
window.LibraryManager = LibraryManager;

// Compatibilidad con código existente
window.Alpine = Alpine;

// Export para módulos
export default app;
export { LibraryManager };

console.log('📦 App module loaded successfully');
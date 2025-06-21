// resources/js/app.js - Optimizado y compatible con Moonshine
import './bootstrap';
import Alpine from 'alpinejs';
import { gsap } from 'gsap';

// 🚀 NUEVO: Sistema de librerías centralizado
import LibraryManager from './libraries/library-manager.js';

// 🎯 Configuración principal
const AppConfig = {
    // Detección automática de entorno
    environment: {
        isMoonshine: window.location.pathname.includes('/admin'),
        isPreview: window.location.pathname.includes('/preview'),
        isDev: import.meta.env.DEV
    },
    
    // Configuración de librerías
    libraries: {
        gsap: {
            duration: 0.6,
            ease: 'power2.out'
        }
    }
};

// 🚀 Clase principal de la aplicación  
class App {
    constructor() {
        this.config = AppConfig;
        this.libraryManager = null;
        this.isInitialized = false;
        
        console.log('🚀 App initializing...', this.config.environment);
        this.init();
    }

    async init() {
        try {
            // 1. Configurar Alpine (para Moonshine)
            this.setupAlpine();
            
            // 2. Inicializar sistema de librerías
            await this.initializeLibrarySystem();
            
            // 3. Registrar componentes Alpine básicos
            this.registerBasicComponents();
            
            // 4. Configurar listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ App initialized successfully');
            
            // 5. Emitir evento de app lista
            this.emitAppReady();
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
        }
    }

    /**
     * Configurar Alpine.js (compatible con Moonshine)
     */
    setupAlpine() {
        // Hacer Alpine disponible globalmente (Moonshine lo necesita)
        window.Alpine = Alpine;
        
        // 🚨 IMPORTANTE: Diferir el start de Alpine hasta que todo esté listo
        Alpine.plugin(() => {
            console.log('🎿 Alpine plugin loaded, but start is deferred');
        });
        
        // Debug en desarrollo
        if (this.config.environment.isDev) {
            Alpine.data('appDebug', () => ({
                getInfo: () => this.getDebugInfo(),
                logLibraries: () => console.log('📚 Libraries:', this.libraryManager?.getStatus())
            }));
        }

        console.log('🎿 Alpine.js configured (Moonshine compatible) - start deferred');
    }

    /**
     * Inicializar sistema de librerías
     */
    async initializeLibrarySystem() {
        try {
            this.libraryManager = new LibraryManager(this.config);
            
            // Hacer disponible globalmente
            window.LibraryManager = this.libraryManager;
            window.App = this;
            
            // Registrar librerías básicas disponibles
            await this.registerAvailableLibraries();
            
            console.log('📚 Library system initialized');
            
        } catch (error) {
            console.error('❌ Library system failed:', error);
            // Fallback sin romper la app
            this.libraryManager = null;
        }
    }

    /**
     * Registrar librerías que ya están disponibles
     */
    async registerAvailableLibraries() {
        try {
            // Verificar qué librerías están disponibles
            const availableLibraries = {
                'alpine': () => typeof window.Alpine !== 'undefined',
                'gsap': () => typeof window.gsap !== 'undefined' || typeof gsap !== 'undefined'
            };

            // Registrar Alpine primero (orden importante)
            if (availableLibraries.alpine()) {
                await this.libraryManager.registerLibrary('alpine', {});
                console.log(`✅ alpine registered automatically`);
            }

            // Luego registrar GSAP
            if (availableLibraries.gsap()) {
                // Asegurar que GSAP esté disponible globalmente
                if (typeof window.gsap === 'undefined' && typeof gsap !== 'undefined') {
                    window.gsap = gsap;
                }
                
                await this.libraryManager.registerLibrary('gsap', this.config.libraries.gsap || {});
                console.log(`✅ gsap registered automatically`);
            } else {
                console.warn('⚠️ GSAP not found, skipping GSAP components');
            }

        } catch (error) {
            console.error('❌ Error registering available libraries:', error);
        }
    }

    /**
     * Registrar componentes Alpine básicos
     */
    registerBasicComponents() {
        // Componente de toggle
        Alpine.data('toggle', (initialState = false) => ({
            open: initialState,
            toggle() { this.open = !this.open; }
        }));

        // Componente de loading
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

        // Componente específico para GSAP (si está disponible)
        if (this.libraryManager && this.libraryManager.isLibraryLoaded('gsap')) {
            console.log('🎬 Registering GSAP Alpine components...');
            
            // Capturar referencia al libraryManager para el closure
            const libraryManager = this.libraryManager;
            
            Alpine.data('gsapFade', (config = {}) => ({
                init() {
                    this.$nextTick(() => {
                        const gsapInstance = libraryManager.getLibraryInstance('gsap');
                        if (gsapInstance) {
                            gsapInstance.fadeIn(this.$el, config);
                        } else {
                            console.warn('⚠️ GSAP instance not available for gsapFade');
                        }
                    });
                }
            }));

            Alpine.data('gsapSlideUp', (config = {}) => ({
                init() {
                    this.$nextTick(() => {
                        const gsapInstance = libraryManager.getLibraryInstance('gsap');
                        if (gsapInstance) {
                            gsapInstance.slideUp(this.$el, config);
                        } else {
                            console.warn('⚠️ GSAP instance not available for gsapSlideUp');
                        }
                    });
                }
            }));

            Alpine.data('gsapScale', (config = {}) => ({
                init() {
                    this.$nextTick(() => {
                        const gsapInstance = libraryManager.getLibraryInstance('gsap');
                        if (gsapInstance) {
                            gsapInstance.scale(this.$el, config);
                        } else {
                            console.warn('⚠️ GSAP instance not available for gsapScale');
                        }
                    });
                }
            }));

            console.log('✅ GSAP Alpine components registered');
        } else {
            console.warn('⚠️ GSAP not loaded, skipping GSAP Alpine components');
        }

        console.log('🧩 Basic Alpine components registered');
    }

    /**
     * Configurar listeners de eventos
     */
    setupEventListeners() {
        // Listener para cargar librerías dinámicamente
        document.addEventListener('app:loadLibrary', async (event) => {
            const { libraryName, config } = event.detail;
            try {
                if (this.libraryManager) {
                    await this.libraryManager.registerLibrary(libraryName, config);
                    console.log(`📚 ${libraryName} loaded dynamically`);
                }
            } catch (error) {
                console.error(`❌ Failed to load ${libraryName}:`, error);
            }
        });

        // Listener para debug
        document.addEventListener('app:debug', () => {
            console.log('🐛 App Debug Info:', this.getDebugInfo());
        });

        console.log('👂 Event listeners configured');
    }

    /**
     * Emitir evento de aplicación lista y iniciar Alpine
     */
    emitAppReady() {
        const event = new CustomEvent('app:ready', {
            detail: {
                app: this,
                libraryManager: this.libraryManager,
                environment: this.config.environment,
                timestamp: new Date().toISOString()
            }
        });
        
        document.dispatchEvent(event);
        console.log('📡 App ready event emitted');
        
        // 🚨 AHORA SÍ iniciar Alpine (después de que todo esté registrado)
        this.startAlpine();
    }

    /**
     * Iniciar Alpine de forma segura
     */
    startAlpine() {
        try {
            // Solo iniciar si no está ya iniciado
            if (!window.Alpine._isStarted) {
                console.log('🎿 Starting Alpine.js now (all components registered)');
                Alpine.start();
                window.Alpine._isStarted = true;
            } else {
                console.log('🎿 Alpine.js already started');
            }
        } catch (error) {
            console.error('❌ Error starting Alpine:', error);
            // Fallback para compatibilidad con Moonshine
            console.log('🌙 Falling back to default Alpine start for Moonshine compatibility');
        }
    }

    /**
     * Obtener información de debug
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            environment: this.config.environment,
            libraries: this.libraryManager?.getStatus() || 'Not available',
            alpine: {
                available: typeof window.Alpine !== 'undefined',
                version: window.Alpine?.version || 'unknown'
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * API pública para cargar librerías
     */
    async loadLibrary(name, config = {}) {
        if (!this.libraryManager) {
            console.warn('⚠️ Library system not available');
            return null;
        }
        return await this.libraryManager.registerLibrary(name, config);
    }
}

// 🌟 Inicializar la aplicación
const app = new App();

// 🎿 Alpine.start() - REMOVIDO de aquí
// Ahora se ejecuta desde app.startAlpine() después de que todo esté listo

// Exports para compatibilidad
export default app;
export { LibraryManager };
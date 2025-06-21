// resources/js/libraries/library-manager.js - Versión mejorada
import SingletonManager from './core/singleton-manager.js';
import InitializationQueue from './core/initialization-queue.js';

class LibraryManager {
    constructor(appConfig = {}) {
        this.appConfig = appConfig;
        this.singletonManager = new SingletonManager();
        this.initQueue = new InitializationQueue();
        this.loadedLibraries = new Set();
        this.libraryInstances = new Map();
        this.isProcessingQueue = false;
        
        console.log('📚 LibraryManager initialized with config:', appConfig.environment || {});
        
        // Auto-detectar entorno
        this.environment = appConfig.environment || {
            isMoonshine: false,
            isPreview: false,
            isDev: false
        };
    }

    /**
     * Registrar una librería (método principal)
     */
    async registerLibrary(name, config = {}) {
        try {
            console.log(`📚 Registering library: ${name}`);
            
            // Verificar si ya está cargada
            if (this.loadedLibraries.has(name)) {
                console.log(`📚 ${name} already loaded, returning existing instance`);
                return this.libraryInstances.get(name);
            }

            // Registrar en el singleton manager
            const instance = await this.singletonManager.getInstance(name, () => 
                this.initializeLibrary(name, config)
            );

            // Marcar como cargada
            this.loadedLibraries.add(name);
            this.libraryInstances.set(name, instance);

            console.log(`✅ ${name} registered successfully`);
            return instance;

        } catch (error) {
            console.error(`❌ Error registering ${name}:`, error);
            throw error;
        }
    }

    /**
     * Inicializar una librería específica
     */
    async initializeLibrary(name, config = {}) {
        switch (name) {
            case 'gsap':
                return await this.initGSAP(config);
            case 'alpine':
                return await this.initAlpine(config);
            case 'swiper':
                return await this.initSwiper(config);
            default:
                console.warn(`⚠️ Unknown library: ${name}`);
                return null;
        }
    }

    /**
     * Inicializar GSAP (una sola vez)
     */
    async initGSAP(config = {}) {
        console.log('🎬 Initializing GSAP...');
        
        // Esperar a que GSAP esté disponible
        await this.waitForGlobal('gsap', 5000);
        
        if (!window.gsap) {
            throw new Error('GSAP not available globally');
        }

        const gsapConfig = {
            duration: 0.6,
            ease: 'power2.out',
            ...config
        };

        const gsapInstance = {
            // Core GSAP
            core: window.gsap,
            config: gsapConfig,
            
            // Helper methods (sin crear múltiples instancias)
            fadeIn: (el, options = {}) => {
                return window.gsap.fromTo(el, 
                    { opacity: 0 },
                    { opacity: 1, duration: gsapConfig.duration, ...options }
                );
            },
            
            fadeOut: (el, options = {}) => {
                return window.gsap.fromTo(el,
                    { opacity: 1 },
                    { opacity: 0, duration: gsapConfig.duration, ...options }
                );
            },
            
            slideUp: (el, options = {}) => {
                return window.gsap.fromTo(el,
                    { y: 50, opacity: 0 },
                    { y: 0, opacity: 1, duration: gsapConfig.duration, ...options }
                );
            },
            
            slideDown: (el, options = {}) => {
                return window.gsap.fromTo(el,
                    { y: -50, opacity: 0 },
                    { y: 0, opacity: 1, duration: gsapConfig.duration, ...options }
                );
            },
            
            scale: (el, options = {}) => {
                return window.gsap.fromTo(el,
                    { scale: 0.8, opacity: 0 },
                    { scale: 1, opacity: 1, duration: gsapConfig.duration, ...options }
                );
            },

            // Timeline factory
            timeline: (options = {}) => {
                return window.gsap.timeline(options);
            }
        };

        console.log('✨ GSAP initialized with helpers');
        return gsapInstance;
    }

    /**
     * Inicializar Alpine (compatible con Moonshine)
     */
    async initAlpine(config = {}) {
        console.log('🎿 Initializing Alpine...');
        
        // Alpine ya está configurado en app.js, solo devolver referencia
        if (!window.Alpine) {
            throw new Error('Alpine not available globally');
        }

        const alpineInstance = {
            core: window.Alpine,
            config: config,
            
            // Helper para registrar componentes de forma segura
            safeData: (name, definition) => {
                if (!window.Alpine.data) {
                    console.warn('⚠️ Alpine.data not available');
                    return;
                }
                
                try {
                    window.Alpine.data(name, definition);
                    console.log(`🧩 Alpine component '${name}' registered`);
                } catch (error) {
                    console.error(`❌ Failed to register Alpine component '${name}':`, error);
                }
            }
        };

        console.log('✅ Alpine instance ready');
        return alpineInstance;
    }

    /**
     * Inicializar Swiper (para futuro)
     */
    async initSwiper(config = {}) {
        console.log('🌊 Initializing Swiper...');
        
        // Verificar si Swiper está disponible
        if (typeof window.Swiper === 'undefined') {
            // Intentar cargar dinámicamente si no está disponible
            await this.loadSwiperDynamically();
        }

        if (!window.Swiper) {
            throw new Error('Swiper not available');
        }

        const swiperInstance = {
            core: window.Swiper,
            config: {
                slidesPerView: 1,
                spaceBetween: 10,
                ...config
            },
            
            // Pool de instancias para evitar memory leaks
            instances: new Map(),
            
            // Factory method
            create: (element, customConfig = {}) => {
                const finalConfig = { ...swiperInstance.config, ...customConfig };
                
                // Verificar si ya existe una instancia para este elemento
                if (swiperInstance.instances.has(element)) {
                    const existing = swiperInstance.instances.get(element);
                    existing.destroy();
                }
                
                const swiper = new window.Swiper(element, finalConfig);
                swiperInstance.instances.set(element, swiper);
                
                return swiper;
            },
            
            // Cleanup method
            destroy: (element) => {
                if (swiperInstance.instances.has(element)) {
                    const swiper = swiperInstance.instances.get(element);
                    swiper.destroy();
                    swiperInstance.instances.delete(element);
                }
            }
        };

        console.log('🌊 Swiper initialized with instance pool');
        return swiperInstance;
    }

    /**
     * Cargar Swiper dinámicamente
     */
    async loadSwiperDynamically() {
        try {
            console.log('📦 Loading Swiper dynamically...');
            
            // Cargar CSS
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = 'https://unpkg.com/swiper/swiper-bundle.min.css';
            document.head.appendChild(cssLink);
            
            // Cargar JS
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/swiper/swiper-bundle.min.js';
            script.onload = () => console.log('✅ Swiper loaded dynamically');
            script.onerror = () => console.error('❌ Failed to load Swiper');
            
            document.head.appendChild(script);
            
            // Esperar a que esté disponible
            await this.waitForGlobal('Swiper', 5000);
            
        } catch (error) {
            console.error('❌ Failed to load Swiper dynamically:', error);
            throw error;
        }
    }

    /**
     * Verificar si una librería está cargada
     */
    isLibraryLoaded(name) {
        return this.loadedLibraries.has(name);
    }

    /**
     * Obtener instancia de librería
     */
    getLibraryInstance(name) {
        return this.libraryInstances.get(name);
    }

    /**
     * Obtener estado del gestor
     */
    getStatus() {
        return {
            environment: this.environment,
            loadedLibraries: Array.from(this.loadedLibraries),
            libraryCount: this.loadedLibraries.size,
            instances: Object.fromEntries(
                Array.from(this.libraryInstances.keys()).map(key => [
                    key, 
                    this.libraryInstances.get(key) ? 'loaded' : 'failed'
                ])
            )
        };
    }

    /**
     * Esperar a que una variable global esté disponible
     */
    async waitForGlobal(globalName, timeout = 3000) {
        return new Promise((resolve, reject) => {
            if (window[globalName]) {
                resolve(window[globalName]);
                return;
            }

            const checkInterval = 100;
            let elapsed = 0;

            const interval = setInterval(() => {
                if (window[globalName]) {
                    clearInterval(interval);
                    resolve(window[globalName]);
                } else if (elapsed >= timeout) {
                    clearInterval(interval);
                    reject(new Error(`Timeout waiting for global '${globalName}'`));
                }
                elapsed += checkInterval;
            }, checkInterval);
        });
    }

    /**
     * Cleanup method
     */
    destroy() {
        // Limpiar instancias de Swiper si existen
        const swiperInstance = this.libraryInstances.get('swiper');
        if (swiperInstance && swiperInstance.instances) {
            for (const [element, swiper] of swiperInstance.instances) {
                swiper.destroy();
            }
        }

        // Limpiar referencias
        this.loadedLibraries.clear();
        this.libraryInstances.clear();
        
        console.log('🧹 LibraryManager cleaned up');
    }
}

export default LibraryManager;
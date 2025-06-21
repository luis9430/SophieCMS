// resources/js/libraries/library-manager.js
class LibraryManager {
    constructor() {
        this.loadedLibraries = new Set();
        this.libraryInstances = new Map();
        this.alpineComponents = new Map();
        this.initPromises = new Map();
        
        console.log('📚 LibraryManager initialized');
    }

    /**
     * Registrar una librería
     */
    registerLibrary(name, config) {
        if (this.loadedLibraries.has(name)) {
            console.log(`📚 ${name} already registered`);
            return Promise.resolve(this.libraryInstances.get(name));
        }

        console.log(`📚 Registering library: ${name}`);
        
        const initPromise = this.initializeLibrary(name, config);
        this.initPromises.set(name, initPromise);
        
        return initPromise;
    }

    /**
     * Inicializar una librería específica
     */
    async initializeLibrary(name, config) {
        try {
            switch (name) {
                case 'gsap':
                    return await this.initGSAP(config);
                case 'fullcalendar':
                    return await this.initFullCalendar(config);
                default:
                    console.warn(`⚠️ Unknown library: ${name}`);
                    return null;
            }
        } catch (error) {
            console.error(`❌ Error initializing ${name}:`, error);
            throw error;
        }
    }

    /**
     * Inicializar GSAP una sola vez
     */
    async initGSAP(config = {}) {
        if (this.loadedLibraries.has('gsap')) {
            return this.libraryInstances.get('gsap');
        }

        // Esperar a que GSAP esté disponible
        await this.waitForGlobal('gsap');
        
        const gsapInstance = {
            core: window.gsap,
            config: {
                duration: 0.6,
                ease: 'power2.out',
                ...config
            },
            // Métodos helper comunes
            fadeIn: (el, options = {}) => {
                return window.gsap.fromTo(el, 
                    { opacity: 0 },
                    { opacity: 1, duration: gsapInstance.config.duration, ...options }
                );
            },
            slideUp: (el, options = {}) => {
                return window.gsap.fromTo(el,
                    { y: 50, opacity: 0 },
                    { y: 0, opacity: 1, duration: gsapInstance.config.duration, ...options }
                );
            },
            scale: (el, options = {}) => {
                return window.gsap.fromTo(el,
                    { scale: 0.8, opacity: 0 },
                    { scale: 1, opacity: 1, duration: gsapInstance.config.duration, ...options }
                );
            }
        };

        this.loadedLibraries.add('gsap');
        this.libraryInstances.set('gsap', gsapInstance);
        
        // Registrar componentes Alpine para GSAP
        this.registerGSAPComponents(gsapInstance);
        
        console.log('✨ GSAP initialized globally');
        return gsapInstance;
    }

    /**
     * Registrar componentes Alpine para GSAP
     */
    registerGSAPComponents(gsapInstance) {
        // Componente básico de fade
        this.registerAlpineComponent('gsapFade', (config = {}) => ({
            config: {
                direction: 'in',
                trigger: 'init', // 'init' | 'scroll' | 'manual'
                ...config
            },
            
            init() {
                if (this.config.trigger === 'init') {
                    this.$nextTick(() => this.animate());
                } else if (this.config.trigger === 'scroll') {
                    this.setupIntersectionObserver();
                }
            },
            
            animate() {
                if (this.config.direction === 'in') {
                    gsapInstance.fadeIn(this.$el, this.config);
                } else {
                    gsapInstance.core.to(this.$el, { 
                        opacity: 0, 
                        duration: gsapInstance.config.duration,
                        ...this.config 
                    });
                }
            },
            
            setupIntersectionObserver() {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            this.animate();
                            observer.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.1 });
                
                observer.observe(this.$el);
            }
        }));

        // Componente de animación de revelado
        this.registerAlpineComponent('gsapReveal', (config = {}) => ({
            config: {
                animation: 'slideUp',
                stagger: 0.1,
                delay: 0,
                trigger: 'scroll',
                ...config
            },
            
            init() {
                if (this.config.trigger === 'init') {
                    this.$nextTick(() => this.animate());
                } else if (this.config.trigger === 'scroll') {
                    this.setupIntersectionObserver();
                }
            },
            
            animate() {
                const elements = this.config.stagger > 0 
                    ? Array.from(this.$el.children) 
                    : [this.$el];
                
                switch (this.config.animation) {
                    case 'slideUp':
                        elements.forEach(el => gsapInstance.core.set(el, { y: 50, opacity: 0 }));
                        gsapInstance.core.to(elements, {
                            y: 0,
                            opacity: 1,
                            duration: gsapInstance.config.duration,
                            stagger: this.config.stagger,
                            delay: this.config.delay,
                            ease: gsapInstance.config.ease
                        });
                        break;
                    case 'scale':
                        elements.forEach(el => gsapInstance.core.set(el, { scale: 0.8, opacity: 0 }));
                        gsapInstance.core.to(elements, {
                            scale: 1,
                            opacity: 1,
                            duration: gsapInstance.config.duration,
                            stagger: this.config.stagger,
                            delay: this.config.delay,
                            ease: gsapInstance.config.ease
                        });
                        break;
                    case 'fadeIn':
                        elements.forEach(el => gsapInstance.core.set(el, { opacity: 0 }));
                        gsapInstance.core.to(elements, {
                            opacity: 1,
                            duration: gsapInstance.config.duration,
                            stagger: this.config.stagger,
                            delay: this.config.delay
                        });
                        break;
                }
            },
            
            setupIntersectionObserver() {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            this.animate();
                            observer.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.1 });
                
                observer.observe(this.$el);
            }
        }));
    }

    /**
     * Inicializar FullCalendar
     */
    async initFullCalendar(config = {}) {
        if (this.loadedLibraries.has('fullcalendar')) {
            return this.libraryInstances.get('fullcalendar');
        }

        await this.waitForGlobal('FullCalendar');
        
        const calendarInstance = {
            core: window.FullCalendar,
            config: {
                locale: 'es',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                },
                ...config
            }
        };

        this.loadedLibraries.add('fullcalendar');
        this.libraryInstances.set('fullcalendar', calendarInstance);
        
        // Registrar componente Alpine para FullCalendar
        this.registerFullCalendarComponents(calendarInstance);
        
        console.log('📅 FullCalendar initialized globally');
        return calendarInstance;
    }

    /**
     * Registrar componentes Alpine para FullCalendar
     */
    registerFullCalendarComponents(calendarInstance) {
        this.registerAlpineComponent('fullCalendar', (config = {}) => ({
            calendar: null,
            events: config.events || [],
            config: {
                ...calendarInstance.config,
                ...config
            },
            
            init() {
                this.$nextTick(() => {
                    this.initCalendar();
                });
            },
            
            initCalendar() {
                this.calendar = new calendarInstance.core.Calendar(this.$el, {
                    ...this.config,
                    events: this.events
                });
                
                this.calendar.render();
                console.log('📅 FullCalendar instance created');
            },
            
            addEvent(event) {
                if (this.calendar) {
                    this.calendar.addEvent(event);
                }
            },
            
            removeEvent(eventId) {
                if (this.calendar) {
                    const event = this.calendar.getEventById(eventId);
                    if (event) event.remove();
                }
            },
            
            destroy() {
                if (this.calendar) {
                    this.calendar.destroy();
                    this.calendar = null;
                }
            }
        }));
    }

    /**
     * Registrar un componente Alpine
     */
    registerAlpineComponent(name, component) {
        if (this.alpineComponents.has(name)) {
            console.log(`🎿 Alpine component '${name}' already registered`);
            return;
        }

        this.alpineComponents.set(name, component);
        
        // Si Alpine ya está disponible, registrar inmediatamente
        if (window.Alpine && typeof window.Alpine.data === 'function') {
            window.Alpine.data(name, component);
            console.log(`🎿 Alpine component '${name}' registered`);
        } else {
            // Esperar a que Alpine esté listo
            document.addEventListener('alpine:init', () => {
                if (window.Alpine && typeof window.Alpine.data === 'function') {
                    window.Alpine.data(name, component);
                    console.log(`🎿 Alpine component '${name}' registered (deferred)`);
                }
            });
        }
    }

    /**
     * Esperar a que una variable global esté disponible
     */
    waitForGlobal(globalName, timeout = 10000) {
        return new Promise((resolve, reject) => {
            if (window[globalName]) {
                resolve(window[globalName]);
                return;
            }

            let attempts = 0;
            const maxAttempts = timeout / 100;
            
            const checkInterval = setInterval(() => {
                attempts++;
                
                if (window[globalName]) {
                    clearInterval(checkInterval);
                    resolve(window[globalName]);
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    reject(new Error(`Timeout waiting for ${globalName}`));
                }
            }, 100);
        });
    }

    /**
     * Obtener una librería inicializada
     */
    async getLibrary(name) {
        if (this.initPromises.has(name)) {
            return await this.initPromises.get(name);
        }
        
        if (this.libraryInstances.has(name)) {
            return this.libraryInstances.get(name);
        }
        
        throw new Error(`Library '${name}' not registered`);
    }

    /**
     * Verificar si una librería está cargada
     */
    isLoaded(name) {
        return this.loadedLibraries.has(name);
    }

    /**
     * Obtener estado del manager
     */
    getStatus() {
        return {
            loadedLibraries: Array.from(this.loadedLibraries),
            alpineComponents: Array.from(this.alpineComponents.keys()),
            libraryInstances: Array.from(this.libraryInstances.keys())
        };
    }
}

// Exportar como singleton
export default new LibraryManager();
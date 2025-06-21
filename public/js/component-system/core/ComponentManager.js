// public/js/component-system/core/ComponentManager.js
// Versión 2.1.0 - Sistema unificado y robusto

(function() {
    'use strict';
    
    // Prevenir doble inicialización
    if (window.ComponentManager) {
        console.log('⚠️ ComponentManager already exists, skipping initialization');
        return;
    }

    class ComponentManager {
        constructor() {
            this.version = '2.1.0';
            this.activeComponents = new Map();
            this.loadedPlugins = new Set();
            this.isInitialized = false;
            this.pluginQueue = [];
            this.alpineReady = false;
            
            console.log(`🚀 ComponentManager v${this.version} initialized`);
        }

        // Inicialización principal
        init() {
            if (this.isInitialized) {
                console.log('⚠️ ComponentManager already initialized');
                return Promise.resolve();
            }

            return new Promise((resolve) => {
                this.waitForAlpine().then(() => {
                    this.setupAlpineIntegration();
                    this.loadAvailablePlugins();
                    this.isInitialized = true;
                    console.log('✅ ComponentManager ready - plugins loaded');
                    resolve();
                });
            });
        }

        // Esperar a que Alpine esté disponible
        waitForAlpine() {
            return new Promise((resolve) => {
                const checkAlpine = () => {
                    if (typeof window.Alpine !== 'undefined') {
                        this.alpineReady = true;
                        resolve();
                    } else {
                        setTimeout(checkAlpine, 50);
                    }
                };
                checkAlpine();
            });
        }

        // Configurar integración con Alpine
        setupAlpineIntegration() {
            if (!this.alpineReady) return;

            // Registrar componentes base antes de que Alpine inicie
            document.addEventListener('alpine:init', () => {
                console.log('📋 Registering all components in Alpine');
                this.registerAllPlugins();
                console.log('✅ All components registered in Alpine');
            });
        }

        // Cargar plugins disponibles automáticamente
        loadAvailablePlugins() {
            const pluginChecks = [
                { name: 'SwiperPlugin', library: 'Swiper' },
                { name: 'GSAPPlugin', library: 'gsap' },
                { name: 'FullCalendarPlugin', library: 'FullCalendar' },
                { name: 'AOSPlugin', library: 'AOS' },
                { name: 'ChartPlugin', library: 'Chart' }
            ];

            pluginChecks.forEach(({ name, library }) => {
                const exists = typeof window[name] === 'function';
                const libExists = typeof window[library] !== 'undefined';
                const isFunction = typeof window[name] === 'function';
                
                console.log(`🔍 Checking ${name}:`, { exists, type: typeof window[name], isFunction });
                
                if (exists && isFunction) {
                    this.loadPlugin(name);
                }
            });
        }

        // Cargar plugin específico
        loadPlugin(pluginName) {
            if (this.loadedPlugins.has(pluginName)) {
                console.log(`⚠️ Plugin ${pluginName} already loaded`);
                return;
            }

            try {
                console.log(`📦 Loading plugin: ${pluginName}`);
                
                if (typeof window[pluginName] === 'function') {
                    const plugin = new window[pluginName]();
                    
                    if (typeof plugin.init === 'function') {
                        plugin.init();
                    }
                    
                    if (typeof plugin.registerAlpineComponents === 'function') {
                        plugin.registerAlpineComponents();
                    }
                    
                    this.loadedPlugins.add(pluginName);
                    console.log(`✅ Plugin loaded: ${pluginName}`);
                } else {
                    console.warn(`❌ Plugin ${pluginName} not found or not a function`);
                }
            } catch (error) {
                console.error(`❌ Error loading plugin ${pluginName}:`, error);
            }
        }

        // Registrar todos los plugins en Alpine
        registerAllPlugins() {
            // Swiper - SIEMPRE registrar componente base
            this.registerSwiperComponents();
            
            // GSAP - SIEMPRE registrar componente base
            this.registerGSAPComponents();
            
            // CSP-Safe components
            this.registerCSPSafeComponents();
            
            // Otros plugins si están disponibles
            this.loadedPlugins.forEach(pluginName => {
                console.log(`📋 ${pluginName} components registered in Alpine`);
            });
        }

        // Registrar componentes Swiper (siempre disponible)
        registerSwiperComponents() {
            if (typeof window.Alpine === 'undefined') return;

            // Componente básico que funciona con o sin Swiper library
            window.Alpine.data('swiperBasic', (config = {}) => ({
                swiper: null,
                config: {
                    navigation: true,
                    pagination: true,
                    slidesPerView: 1,
                    spaceBetween: 30,
                    ...config
                },
                
                init() {
                    this.$nextTick(() => {
                        this.initSwiper();
                    });
                },
                
                initSwiper() {
                    try {
                        if (typeof window.Swiper === 'undefined') {
                            console.warn('⚠️ Swiper library not loaded, using fallback');
                            this.createFallback();
                            return;
                        }

                        const swiperContainer = this.$el.querySelector('.swiper') || this.$el;
                        
                        this.swiper = new window.Swiper(swiperContainer, {
                            navigation: this.config.navigation ? {
                                nextEl: '.swiper-button-next',
                                prevEl: '.swiper-button-prev',
                            } : false,
                            pagination: this.config.pagination ? {
                                el: '.swiper-pagination',
                                clickable: true,
                            } : false,
                            slidesPerView: this.config.slidesPerView,
                            spaceBetween: this.config.spaceBetween,
                            autoplay: this.config.autoplay || false,
                            loop: this.config.loop || false,
                            ...this.config
                        });

                        console.log('🎠 Swiper initialized successfully');
                        
                    } catch (error) {
                        console.error('❌ Swiper initialization error:', error);
                        this.createFallback();
                    }
                },
                
                createFallback() {
                    this.$el.innerHTML = `
                        <div class="bg-gray-100 p-8 text-center rounded-lg">
                            <p class="text-gray-600">Slider Preview</p>
                            <p class="text-sm text-gray-500">Swiper library not loaded</p>
                        </div>
                    `;
                },
                
                destroy() {
                    if (this.swiper && typeof this.swiper.destroy === 'function') {
                        this.swiper.destroy(true, true);
                    }
                }
            }));

            console.log('🎠 Swiper Alpine components registered');
        }

        // Registrar componentes GSAP (siempre disponible)
        registerGSAPComponents() {
            if (typeof window.Alpine === 'undefined') return;

            window.Alpine.data('gsapFade', (config = {}) => ({
                config: {
                    duration: 1,
                    direction: 'in',
                    ...config
                },
                
                init() {
                    this.$nextTick(() => {
                        this.animate();
                    });
                },
                
                animate() {
                    try {
                        if (typeof window.gsap === 'undefined') {
                            console.warn('⚠️ GSAP library not loaded, using CSS fallback');
                            this.cssFallback();
                            return;
                        }

                        if (this.config.direction === 'in') {
                            window.gsap.set(this.$el, { opacity: 0 });
                            window.gsap.to(this.$el, { 
                                opacity: 1, 
                                duration: this.config.duration 
                            });
                        }

                        console.log('✨ GSAP animation applied');
                        
                    } catch (error) {
                        console.error('❌ GSAP animation error:', error);
                        this.cssFallback();
                    }
                },
                
                cssFallback() {
                    this.$el.style.opacity = '1';
                    this.$el.style.transition = `opacity ${this.config.duration}s ease`;
                }
            }));

            console.log('✨ GSAP Alpine components registered');
        }

        // 🛡️ Registrar componentes CSP-Safe
        registerCSPSafeComponents() {
            if (typeof window.Alpine === 'undefined') return;

            // Swiper CSP-safe usando solo data attributes
            window.Alpine.data('swiperCSP', function() {
                return {
                    swiper: null,
                    slides: this.$el.dataset.slides ? JSON.parse(this.$el.dataset.slides) : [
                        { title: 'Slide 1', content: 'Contenido del slide 1' },
                        { title: 'Slide 2', content: 'Contenido del slide 2' },
                        { title: 'Slide 3', content: 'Contenido del slide 3' }
                    ],
                    
                    init() {
                        // Configuración desde data attributes
                        const config = {
                            navigation: this.$el.dataset.navigation !== 'false',
                            pagination: this.$el.dataset.pagination !== 'false',
                            slidesPerView: parseInt(this.$el.dataset.slidesPerView) || 1,
                            spaceBetween: parseInt(this.$el.dataset.spaceBetween) || 30,
                            autoplay: this.$el.dataset.autoplay ? {
                                delay: parseInt(this.$el.dataset.autoplayDelay) || 3000
                            } : false,
                            loop: this.$el.dataset.loop === 'true'
                        };
                        
                        this.$nextTick(() => {
                            this.initSwiper(config);
                        });
                    },
                    
                    initSwiper(config) {
                        try {
                            if (typeof window.Swiper === 'undefined') {
                                this.createFallback();
                                return;
                            }

                            const container = this.$el.querySelector('.swiper') || this.$el;
                            
                            // Crear estructura si no existe
                            if (!container.querySelector('.swiper-wrapper')) {
                                this.createSwiperStructure(container);
                            }
                            
                            this.swiper = new window.Swiper(container, {
                                navigation: config.navigation ? {
                                    nextEl: '.swiper-button-next',
                                    prevEl: '.swiper-button-prev',
                                } : false,
                                pagination: config.pagination ? {
                                    el: '.swiper-pagination',
                                    clickable: true,
                                } : false,
                                slidesPerView: config.slidesPerView,
                                spaceBetween: config.spaceBetween,
                                autoplay: config.autoplay,
                                loop: config.loop
                            });

                            console.log('🎠 Swiper CSP initialized successfully');
                            
                        } catch (error) {
                            console.error('❌ Swiper CSP initialization failed:', error);
                            this.createFallback();
                        }
                    },
                    
                    createSwiperStructure(container) {
                        const wrapper = document.createElement('div');
                        wrapper.className = 'swiper-wrapper';
                        
                        this.slides.forEach((slide, index) => {
                            const slideEl = document.createElement('div');
                            slideEl.className = 'swiper-slide';
                            slideEl.innerHTML = `
                                <div class="p-8 text-center">
                                    <h3 class="text-xl font-bold mb-4">${slide.title || 'Slide ' + (index + 1)}</h3>
                                    <p class="text-gray-600">${slide.content || 'Contenido del slide'}</p>
                                </div>
                            `;
                            wrapper.appendChild(slideEl);
                        });
                        
                        container.appendChild(wrapper);
                        
                        // Agregar controles si están habilitados
                        if (this.$el.dataset.navigation !== 'false') {
                            container.innerHTML += `
                                <div class="swiper-button-next"></div>
                                <div class="swiper-button-prev"></div>
                            `;
                        }
                        
                        if (this.$el.dataset.pagination !== 'false') {
                            container.innerHTML += '<div class="swiper-pagination"></div>';
                        }
                    },
                    
                    createFallback() {
                        this.$el.innerHTML = `
                            <div class="swiper-fallback bg-gradient-to-r from-blue-100 to-purple-100 p-8 text-center rounded-lg border-2 border-dashed border-blue-300">
                                <div class="mb-4">
                                    <svg class="w-16 h-16 mx-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                                <h3 class="text-lg font-semibold text-blue-800">Swiper Slider Preview</h3>
                                <p class="text-blue-600 mt-2">CSP-Safe Mode - Library will load in production</p>
                                <div class="mt-4 text-sm text-blue-500">
                                    Slides: ${this.slides.length} | 
                                    Navigation: ${this.$el.dataset.navigation !== 'false' ? 'On' : 'Off'} |
                                    Autoplay: ${this.$el.dataset.autoplay ? 'On' : 'Off'}
                                </div>
                            </div>
                        `;
                    },
                    
                    destroy() {
                        if (this.swiper && typeof this.swiper.destroy === 'function') {
                            this.swiper.destroy(true, true);
                        }
                    }
                };
            });

            // GSAP CSP-safe
            window.Alpine.data('gsapCSP', function() {
                return {
                    init() {
                        const animation = this.$el.dataset.animation || 'fadeIn';
                        const duration = parseFloat(this.$el.dataset.duration) || 1;
                        const delay = parseFloat(this.$el.dataset.delay) || 0;
                        
                        this.$nextTick(() => {
                            this.animate(animation, duration, delay);
                        });
                    },
                    
                    animate(type, duration, delay) {
                        try {
                            if (typeof window.gsap === 'undefined') {
                                this.cssFallback(type, duration, delay);
                                return;
                            }

                            switch (type) {
                                case 'fadeIn':
                                    window.gsap.set(this.$el, { opacity: 0 });
                                    window.gsap.to(this.$el, { opacity: 1, duration, delay });
                                    break;
                                case 'slideUp':
                                    window.gsap.set(this.$el, { y: 50, opacity: 0 });
                                    window.gsap.to(this.$el, { y: 0, opacity: 1, duration, delay });
                                    break;
                                case 'slideLeft':
                                    window.gsap.set(this.$el, { x: 50, opacity: 0 });
                                    window.gsap.to(this.$el, { x: 0, opacity: 1, duration, delay });
                                    break;
                                default:
                                    window.gsap.set(this.$el, { opacity: 0 });
                                    window.gsap.to(this.$el, { opacity: 1, duration, delay });
                            }

                            console.log(`✨ GSAP CSP animation applied: ${type}`);
                            
                        } catch (error) {
                            console.error('❌ GSAP CSP animation failed:', error);
                            this.cssFallback(type, duration, delay);
                        }
                    },
                    
                    cssFallback(type, duration, delay) {
                        this.$el.style.opacity = '0';
                        this.$el.style.transition = `all ${duration}s ease`;
                        
                        setTimeout(() => {
                            this.$el.style.opacity = '1';
                            this.$el.style.transform = 'translateX(0) translateY(0)';
                        }, delay * 1000);
                    }
                };
            });

            console.log('🛡️ CSP-safe Alpine components registered');
        }

        // Registro de componentes activos
        register(type, instance, element) {
            const id = this.generateId();
            this.activeComponents.set(id, {
                type,
                instance,
                element,
                createdAt: Date.now()
            });
            console.log(`📝 Component registered: ${type} (${id})`);
            return id;
        }

        // Desregistro de componentes
        unregister(type, element) {
            for (const [id, component] of this.activeComponents.entries()) {
                if (component.element === element) {
                    this.activeComponents.delete(id);
                    console.log(`🗑️ Component unregistered: ${type} (${id})`);
                    break;
                }
            }
        }

        // Generar ID único
        generateId() {
            return 'comp_' + Math.random().toString(36).substr(2, 9);
        }

        // Estadísticas del sistema
        getStats() {
            return {
                version: this.version,
                totalComponents: this.activeComponents.size,
                loadedPlugins: Array.from(this.loadedPlugins),
                alpineReady: this.alpineReady,
                isInitialized: this.isInitialized,
                availableLibraries: {
                    Swiper: typeof window.Swiper !== 'undefined',
                    GSAP: typeof window.gsap !== 'undefined',
                    AOS: typeof window.AOS !== 'undefined',
                    Chart: typeof window.Chart !== 'undefined',
                    Alpine: typeof window.Alpine !== 'undefined'
                }
            };
        }

        // Cleanup al descargar página
        cleanup() {
            this.activeComponents.forEach((component) => {
                if (component.instance && typeof component.instance.destroy === 'function') {
                    component.instance.destroy();
                }
            });
            this.activeComponents.clear();
            console.log('🧹 ComponentManager cleanup completed');
        }
    }

    // Crear instancia global
    window.ComponentManager = new ComponentManager();

    // Auto-inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.ComponentManager.init();
        });
    } else {
        window.ComponentManager.init();
    }

    // Cleanup al descargar
    window.addEventListener('beforeunload', () => {
        window.ComponentManager.cleanup();
    });

})();
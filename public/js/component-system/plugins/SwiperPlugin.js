// public/js/component-system/plugins/SwiperPlugin.js
// Plugin Swiper v1.1.0 - Integración robusta con Alpine

(function() {
    'use strict';

    class SwiperPlugin {
        constructor() {
            this.name = 'SwiperPlugin';
            this.version = '1.1.0';
            this.isLoaded = false;
        }

        // Inicialización del plugin
        init() {
            if (this.isLoaded) {
                console.log('⚠️ SwiperPlugin already initialized');
                return Promise.resolve();
            }

            console.log(`🎠 SwiperPlugin v${this.version} initializing...`);
            
            // Verificar dependencias
            this.checkDependencies();
            
            this.isLoaded = true;
            console.log('✅ SwiperPlugin initialized');
            
            return Promise.resolve();
        }

        // Verificar si Swiper está disponible
        checkDependencies() {
            const swiperAvailable = typeof window.Swiper !== 'undefined';
            console.log(`🔍 Swiper library: ${swiperAvailable ? '✅ Available' : '❌ Not found'}`);
            
            if (!swiperAvailable) {
                console.warn('⚠️ Swiper library not loaded. Components will use fallback mode.');
            }
        }

        // Registrar componentes Alpine
        registerAlpineComponents() {
            if (typeof window.Alpine === 'undefined') {
                console.error('❌ Alpine.js not available for SwiperPlugin');
                return;
            }

            // Componente básico mejorado
            window.Alpine.data('swiperBasic', (config = {}) => ({
                swiper: null,
                isReady: false,
                error: null,
                config: this.sanitizeConfig({
                    navigation: true,
                    pagination: true,
                    slidesPerView: 1,
                    spaceBetween: 30,
                    autoplay: false,
                    loop: false,
                    ...config
                }),
                
                init() {
                    console.log('🎠 SwiperBasic component initializing...');
                    this.$nextTick(() => {
                        this.initSwiper();
                    });
                },
                
                initSwiper() {
                    try {
                        if (typeof window.Swiper === 'undefined') {
                            this.handleMissingLibrary();
                            return;
                        }

                        // Buscar el contenedor Swiper
                        const swiperContainer = this.findSwiperContainer();
                        if (!swiperContainer) {
                            throw new Error('Swiper container not found');
                        }

                        // Configuración del Swiper
                        const swiperConfig = this.buildSwiperConfig();
                        
                        // Inicializar Swiper
                        this.swiper = new window.Swiper(swiperContainer, swiperConfig);
                        
                        // Registrar en ComponentManager si existe
                        if (window.ComponentManager) {
                            window.ComponentManager.register('swiper', this.swiper, this.$el);
                        }
                        
                        this.isReady = true;
                        console.log('🎠 Swiper initialized successfully');
                        
                    } catch (error) {
                        this.error = error.message;
                        console.error('❌ Swiper initialization failed:', error);
                        this.createErrorFallback(error.message);
                    }
                },
                
                findSwiperContainer() {
                    // Buscar contenedor .swiper o usar el elemento raíz
                    let container = this.$el.querySelector('.swiper');
                    
                    if (!container) {
                        // Si no hay .swiper, verificar si el elemento raíz tiene las clases necesarias
                        if (this.$el.classList.contains('swiper')) {
                            container = this.$el;
                        } else {
                            // Crear estructura básica si no existe
                            this.createSwiperStructure();
                            container = this.$el.querySelector('.swiper');
                        }
                    }
                    
                    return container;
                },
                
                createSwiperStructure() {
                    const content = this.$el.innerHTML;
                    this.$el.innerHTML = `
                        <div class="swiper">
                            <div class="swiper-wrapper">
                                <div class="swiper-slide">${content}</div>
                            </div>
                            ${this.config.pagination ? '<div class="swiper-pagination"></div>' : ''}
                            ${this.config.navigation ? `
                                <div class="swiper-button-next"></div>
                                <div class="swiper-button-prev"></div>
                            ` : ''}
                        </div>
                    `;
                },
                
                buildSwiperConfig() {
                    const config = {
                        slidesPerView: this.config.slidesPerView,
                        spaceBetween: this.config.spaceBetween,
                        loop: this.config.loop
                    };
                    
                    // Navegación
                    if (this.config.navigation) {
                        config.navigation = {
                            nextEl: '.swiper-button-next',
                            prevEl: '.swiper-button-prev',
                        };
                    }
                    
                    // Paginación
                    if (this.config.pagination) {
                        config.pagination = {
                            el: '.swiper-pagination',
                            clickable: true,
                        };
                    }
                    
                    // Autoplay
                    if (this.config.autoplay) {
                        config.autoplay = typeof this.config.autoplay === 'object' 
                            ? this.config.autoplay 
                            : { delay: 3000 };
                    }
                    
                    return config;
                },
                
                handleMissingLibrary() {
                    console.warn('⚠️ Swiper library not loaded, creating preview');
                    this.$el.innerHTML = `
                        <div class="bg-gradient-to-r from-blue-100 to-purple-100 p-8 text-center rounded-lg border-2 border-dashed border-blue-300">
                            <div class="text-blue-600 mb-2">
                                <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                            </div>
                            <h3 class="text-lg font-semibold text-blue-800">Swiper Slider Preview</h3>
                            <p class="text-blue-600 mt-1">Library will load in production</p>
                            <div class="mt-4 text-sm text-blue-500">
                                Slides: ${this.config.slidesPerView} | 
                                Spacing: ${this.config.spaceBetween}px |
                                ${this.config.autoplay ? 'Autoplay: On' : 'Autoplay: Off'}
                            </div>
                        </div>
                    `;
                },
                
                createErrorFallback(errorMessage) {
                    this.$el.innerHTML = `
                        <div class="bg-red-50 border border-red-200 p-4 rounded-lg">
                            <div class="flex items-center text-red-600 mb-2">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <span class="font-medium">Swiper Error</span>
                            </div>
                            <p class="text-red-700 text-sm">${errorMessage}</p>
                        </div>
                    `;
                },
                
                destroy() {
                    if (this.swiper && typeof this.swiper.destroy === 'function') {
                        this.swiper.destroy(true, true);
                        
                        if (window.ComponentManager) {
                            window.ComponentManager.unregister('swiper', this.$el);
                        }
                        
                        console.log('🗑️ Swiper destroyed');
                    }
                }
            }));

            // Componente avanzado con más opciones
            window.Alpine.data('swiperAdvanced', (config = {}) => ({
                swiper: null,
                config: this.sanitizeConfig({
                    slidesPerView: 'auto',
                    spaceBetween: 20,
                    centeredSlides: true,
                    loop: true,
                    autoplay: {
                        delay: 5000,
                        disableOnInteraction: false
                    },
                    pagination: {
                        dynamicBullets: true
                    },
                    navigation: true,
                    effect: 'slide', // slide, fade, cube, coverflow, flip
                    breakpoints: {
                        640: { slidesPerView: 1 },
                        768: { slidesPerView: 2 },
                        1024: { slidesPerView: 3 }
                    },
                    ...config
                }),
                
                init() {
                    this.$nextTick(() => {
                        this.initAdvancedSwiper();
                    });
                },
                
                initAdvancedSwiper() {
                    // Similar a swiperBasic pero con configuración avanzada
                    // ... implementación similar
                }
            }));

            console.log('🎠 Swiper Alpine components registered');
        }

        // Sanitizar configuración de entrada
        sanitizeConfig(config) {
            const sanitized = {};
            
            // Lista de propiedades permitidas y sus tipos
            const allowedProps = {
                navigation: 'boolean',
                pagination: ['boolean', 'object'],
                autoplay: ['boolean', 'object'],
                loop: 'boolean',
                slidesPerView: ['number', 'string'],
                spaceBetween: 'number',
                centeredSlides: 'boolean',
                effect: 'string',
                breakpoints: 'object'
            };
            
            Object.entries(config).forEach(([key, value]) => {
                if (allowedProps[key]) {
                    const allowedType = allowedProps[key];
                    const valueType = typeof value;
                    
                    if (Array.isArray(allowedType)) {
                        if (allowedType.includes(valueType)) {
                            sanitized[key] = value;
                        }
                    } else if (valueType === allowedType) {
                        sanitized[key] = value;
                    }
                }
            });
            
            return sanitized;
        }

        // Obtener estadísticas
        getStats() {
            return {
                name: this.name,
                version: this.version,
                isLoaded: this.isLoaded,
                swiperAvailable: typeof window.Swiper !== 'undefined'
            };
        }
    }

    // Registrar plugin globalmente
    window.SwiperPlugin = SwiperPlugin;
    
    console.log('📦 SwiperPlugin class registered');

})();
// public/js/component-system/plugins/SwiperPlugin.js
class SwiperPlugin {
    constructor() {
        this.name = 'Swiper';
        this.version = '1.0.0';
        this.required = ['Swiper'];
        this.instances = new Map();
    }
    
    /**
     * Inicializar el plugin
     */
    async init() {
        if (!this.checkDependencies()) {
            throw new Error('Swiper library not found');
        }
        
        console.log(`🎠 SwiperPlugin v${this.version} initialized`);
        return true;
    }
    
    /**
     * Verificar dependencias
     */
    checkDependencies() {
        return typeof window.Swiper !== 'undefined';
    }
    
    /**
     * Registrar componentes Alpine
     */
    registerAlpineComponents() {
        // Swiper básico
        Alpine.data('swiperBasic', (config = {}) => this.createBasicSwiper(config));
        
        // Swiper avanzado
        Alpine.data('swiperAdvanced', (config = {}) => this.createAdvancedSwiper(config));
        
        // Swiper para productos/e-commerce
        Alpine.data('swiperEcommerce', (config = {}) => this.createEcommerceSwiper(config));
        
        // Swiper para testimonios
        Alpine.data('swiperTestimonials', (config = {}) => this.createTestimonialsSwiper(config));
        
        // Swiper para hero/banner
        Alpine.data('swiperHero', (config = {}) => this.createHeroSwiper(config));
        
        console.log('🎠 Swiper Alpine components registered');
    }
    
    /**
     * Swiper básico (tu implementación actual mejorada)
     */
    createBasicSwiper(config = {}) {
        return {
            swiper: null,
            config: {
                navigation: true,
                pagination: true,
                slidesPerView: 1,
                spaceBetween: 30,
                loop: false,
                autoplay: false,
                // Sobrescribir con config del usuario
                ...config
            },
            componentId: null,
            
            init() {
                this.componentId = ComponentManager.generateId();
                ComponentManager.registerComponent('swiperBasic', this.componentId, this.$el);
                
                this.waitForSwiper();
            },
            
            waitForSwiper() {
                if (typeof window.Swiper !== 'undefined') {
                    this.$nextTick(() => {
                        this.initSwiper();
                    });
                } else {
                    setTimeout(() => this.waitForSwiper(), 100);
                }
            },
            
            initSwiper() {
                try {
                    const swiperEl = this.$el.querySelector('.swiper');
                    if (!swiperEl) {
                        console.error('Swiper container not found');
                        return;
                    }
                    
                    this.swiper = new Swiper(swiperEl, this.config);
                    
                    // Registrar instancia
                    window.SwiperPlugin.instances.set(this.componentId, this.swiper);
                    
                    console.log(`🎠 Basic Swiper initialized: ${this.componentId}`);
                } catch (error) {
                    console.error('Swiper initialization error:', error);
                }
            },
            
            destroy() {
                if (this.swiper) {
                    this.swiper.destroy(true, true);
                    window.SwiperPlugin.instances.delete(this.componentId);
                }
                ComponentManager.unregisterComponent(this.componentId);
            }
        };
    }
    
    /**
     * Swiper avanzado con más opciones
     */
    createAdvancedSwiper(config = {}) {
        return {
            swiper: null,
            config: {
                // Navegación avanzada
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                    dynamicBullets: true,
                },
                
                // Responsive breakpoints
                breakpoints: {
                    640: {
                        slidesPerView: 1,
                        spaceBetween: 20,
                    },
                    768: {
                        slidesPerView: 2,
                        spaceBetween: 30,
                    },
                    1024: {
                        slidesPerView: 3,
                        spaceBetween: 40,
                    },
                },
                
                // Efectos
                effect: 'slide', // slide, fade, cube, coverflow, flip
                
                // Autoplay avanzado
                autoplay: config.autoplay ? {
                    delay: config.autoplay.delay || 3000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                } : false,
                
                // Lazy Loading
                lazy: {
                    loadPrevNext: true,
                },
                
                // Zoom
                zoom: config.zoom || false,
                
                // Thumbs
                thumbs: config.thumbs || null,
                
                // Sobrescribir con config del usuario
                ...config
            },
            componentId: null,
            
            init() {
                this.componentId = ComponentManager.generateId();
                ComponentManager.registerComponent('swiperAdvanced', this.componentId, this.$el);
                
                this.waitForSwiper();
            },
            
            waitForSwiper() {
                if (typeof window.Swiper !== 'undefined') {
                    this.$nextTick(() => {
                        this.initSwiper();
                    });
                } else {
                    setTimeout(() => this.waitForSwiper(), 100);
                }
            },
            
            initSwiper() {
                try {
                    const swiperEl = this.$el.querySelector('.swiper');
                    if (!swiperEl) {
                        console.error('Swiper container not found');
                        return;
                    }
                    
                    this.swiper = new Swiper(swiperEl, this.config);
                    
                    // Eventos personalizados
                    this.setupEvents();
                    
                    // Registrar instancia
                    window.SwiperPlugin.instances.set(this.componentId, this.swiper);
                    
                    console.log(`🎠 Advanced Swiper initialized: ${this.componentId}`);
                } catch (error) {
                    console.error('Advanced Swiper initialization error:', error);
                }
            },
            
            setupEvents() {
                if (!this.swiper) return;
                
                // Eventos útiles
                this.swiper.on('slideChange', () => {
                    this.$dispatch('swiper-change', {
                        activeIndex: this.swiper.activeIndex,
                        componentId: this.componentId
                    });
                });
                
                this.swiper.on('reachEnd', () => {
                    this.$dispatch('swiper-end', { componentId: this.componentId });
                });
                
                this.swiper.on('reachBeginning', () => {
                    this.$dispatch('swiper-beginning', { componentId: this.componentId });
                });
            },
            
            // Métodos públicos
            nextSlide() {
                if (this.swiper) this.swiper.slideNext();
            },
            
            prevSlide() {
                if (this.swiper) this.swiper.slidePrev();
            },
            
            goToSlide(index) {
                if (this.swiper) this.swiper.slideTo(index);
            },
            
            destroy() {
                if (this.swiper) {
                    this.swiper.destroy(true, true);
                    window.SwiperPlugin.instances.delete(this.componentId);
                }
                ComponentManager.unregisterComponent(this.componentId);
            }
        };
    }
    
    /**
     * Swiper para e-commerce/productos
     */
    createEcommerceSwiper(config = {}) {
        return {
            swiper: null,
            config: {
                slidesPerView: 1,
                spaceBetween: 10,
                navigation: true,
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
                breakpoints: {
                    640: {
                        slidesPerView: 2,
                        spaceBetween: 20,
                    },
                    768: {
                        slidesPerView: 3,
                        spaceBetween: 30,
                    },
                    1024: {
                        slidesPerView: 4,
                        spaceBetween: 30,
                    },
                },
                // Configuración específica para productos
                watchSlidesProgress: true,
                watchSlidesVisibility: true,
                ...config
            },
            componentId: null,
            
            init() {
                this.componentId = ComponentManager.generateId();
                ComponentManager.registerComponent('swiperEcommerce', this.componentId, this.$el);
                this.waitForSwiper();
            },
            
            waitForSwiper() {
                if (typeof window.Swiper !== 'undefined') {
                    this.$nextTick(() => {
                        this.initSwiper();
                    });
                } else {
                    setTimeout(() => this.waitForSwiper(), 100);
                }
            },
            
            initSwiper() {
                try {
                    const swiperEl = this.$el.querySelector('.swiper');
                    if (!swiperEl) return;
                    
                    this.swiper = new Swiper(swiperEl, this.config);
                    
                    // Eventos específicos para e-commerce
                    this.swiper.on('slideChange', () => {
                        this.$dispatch('product-change', {
                            activeIndex: this.swiper.activeIndex,
                            componentId: this.componentId
                        });
                    });
                    
                    window.SwiperPlugin.instances.set(this.componentId, this.swiper);
                    console.log(`🛒 E-commerce Swiper initialized: ${this.componentId}`);
                } catch (error) {
                    console.error('E-commerce Swiper error:', error);
                }
            },
            
            destroy() {
                if (this.swiper) {
                    this.swiper.destroy(true, true);
                    window.SwiperPlugin.instances.delete(this.componentId);
                }
                ComponentManager.unregisterComponent(this.componentId);
            }
        };
    }
    
    /**
     * Swiper para testimonios
     */
    createTestimonialsSwiper(config = {}) {
        return {
            swiper: null,
            config: {
                slidesPerView: 1,
                spaceBetween: 30,
                centeredSlides: true,
                autoplay: {
                    delay: 5000,
                    disableOnInteraction: false,
                },
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
                breakpoints: {
                    768: {
                        slidesPerView: 2,
                    },
                    1024: {
                        slidesPerView: 3,
                    },
                },
                ...config
            },
            componentId: null,
            
            init() {
                this.componentId = ComponentManager.generateId();
                ComponentManager.registerComponent('swiperTestimonials', this.componentId, this.$el);
                this.waitForSwiper();
            },
            
            waitForSwiper() {
                if (typeof window.Swiper !== 'undefined') {
                    this.$nextTick(() => {
                        this.initSwiper();
                    });
                } else {
                    setTimeout(() => this.waitForSwiper(), 100);
                }
            },
            
            initSwiper() {
                try {
                    const swiperEl = this.$el.querySelector('.swiper');
                    if (!swiperEl) return;
                    
                    this.swiper = new Swiper(swiperEl, this.config);
                    window.SwiperPlugin.instances.set(this.componentId, this.swiper);
                    
                    console.log(`💬 Testimonials Swiper initialized: ${this.componentId}`);
                } catch (error) {
                    console.error('Testimonials Swiper error:', error);
                }
            },
            
            destroy() {
                if (this.swiper) {
                    this.swiper.destroy(true, true);
                    window.SwiperPlugin.instances.delete(this.componentId);
                }
                ComponentManager.unregisterComponent(this.componentId);
            }
        };
    }
    
    /**
     * Swiper para hero/banner
     */
    createHeroSwiper(config = {}) {
        return {
            swiper: null,
            config: {
                slidesPerView: 1,
                effect: 'fade',
                autoplay: {
                    delay: 4000,
                    disableOnInteraction: false,
                },
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                loop: true,
                ...config
            },
            componentId: null,
            
            init() {
                this.componentId = ComponentManager.generateId();
                ComponentManager.registerComponent('swiperHero', this.componentId, this.$el);
                this.waitForSwiper();
            },
            
            waitForSwiper() {
                if (typeof window.Swiper !== 'undefined') {
                    this.$nextTick(() => {
                        this.initSwiper();
                    });
                } else {
                    setTimeout(() => this.waitForSwiper(), 100);
                }
            },
            
            initSwiper() {
                try {
                    const swiperEl = this.$el.querySelector('.swiper');
                    if (!swiperEl) return;
                    
                    this.swiper = new Swiper(swiperEl, this.config);
                    window.SwiperPlugin.instances.set(this.componentId, this.swiper);
                    
                    console.log(`🦸 Hero Swiper initialized: ${this.componentId}`);
                } catch (error) {
                    console.error('Hero Swiper error:', error);
                }
            },
            
            destroy() {
                if (this.swiper) {
                    this.swiper.destroy(true, true);
                    window.SwiperPlugin.instances.delete(this.componentId);
                }
                ComponentManager.unregisterComponent(this.componentId);
            }
        };
    }
    
    /**
     * Obtener presets de configuración
     */
    getPresets() {
        return {
            basic: {
                navigation: true,
                pagination: true,
                slidesPerView: 1,
                spaceBetween: 30
            },
            hero: {
                effect: 'fade',
                autoplay: { delay: 4000 },
                loop: true
            },
            products: {
                slidesPerView: 4,
                spaceBetween: 20,
                navigation: true,
                breakpoints: {
                    640: { slidesPerView: 2 },
                    768: { slidesPerView: 3 },
                    1024: { slidesPerView: 4 }
                }
            },
            testimonials: {
                slidesPerView: 1,
                centeredSlides: true,
                autoplay: { delay: 5000 },
                breakpoints: {
                    768: { slidesPerView: 2 },
                    1024: { slidesPerView: 3 }
                }
            }
        };
    }
    
    /**
     * Generar HTML para diferentes tipos
     */
    generateHTML(type, slides = []) {
        const templates = {
            basic: () => `
                <div class="swiper">
                    <div class="swiper-wrapper">
                        ${slides.map(slide => `
                            <div class="swiper-slide">
                                <div class="bg-blue-500 text-white p-8 rounded-lg text-center">
                                    <h3 class="text-2xl font-bold">${slide}</h3>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="swiper-button-next"></div>
                    <div class="swiper-button-prev"></div>
                    <div class="swiper-pagination"></div>
                </div>
            `,
            
            hero: () => `
                <div class="swiper h-96">
                    <div class="swiper-wrapper">
                        ${slides.map(slide => `
                            <div class="swiper-slide">
                                <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-16 text-center h-full flex items-center justify-center">
                                    <div>
                                        <h2 class="text-4xl font-bold mb-4">${slide.title || slide}</h2>
                                        <p class="text-xl">${slide.description || ''}</p>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="swiper-button-next"></div>
                    <div class="swiper-button-prev"></div>
                    <div class="swiper-pagination"></div>
                </div>
            `
        };
        
        return templates[type] ? templates[type]() : templates.basic();
    }
}

// Instanciar plugin globalmente
window.SwiperPlugin = new SwiperPlugin();
// public/js/component-system/plugins/GSAPPlugin.js
class GSAPPlugin {
    constructor() {
        this.name = 'GSAP';
        this.version = '1.0.0';
        this.required = ['gsap'];
        this.timelines = new Map();
    }
    
    /**
     * Inicializar el plugin
     */
    async init() {
        if (!this.checkDependencies()) {
            throw new Error('GSAP library not found');
        }
        
        console.log(`✨ GSAPPlugin v${this.version} initialized`);
        return true;
    }
    
    /**
     * Verificar dependencias
     */
    checkDependencies() {
        return typeof window.gsap !== 'undefined';
    }
    
    /**
     * Registrar componentes Alpine
     */
    registerAlpineComponents() {
        // Animación fade in/out
        Alpine.data('gsapFade', (config = {}) => this.createFadeAnimation(config));
        
        // Animación slide
        Alpine.data('gsapSlide', (config = {}) => this.createSlideAnimation(config));
        
        // Animación scale/zoom
        Alpine.data('gsapScale', (config = {}) => this.createScaleAnimation(config));
        
        // Animación de texto (typing effect)
        Alpine.data('gsapText', (config = {}) => this.createTextAnimation(config));
        
        // Timeline de animaciones múltiples
        Alpine.data('gsapTimeline', (config = {}) => this.createTimelineAnimation(config));
        
        // Animación de contador
        Alpine.data('gsapCounter', (config = {}) => this.createCounterAnimation(config));
        
        // Animaciones on scroll
        Alpine.data('gsapScroll', (config = {}) => this.createScrollAnimation(config));
        
        console.log('✨ GSAP Alpine components registered');
    }
    
    /**
     * Animación Fade In/Out
     */
    createFadeAnimation(config = {}) {
        return {
            config: {
                duration: 1,
                delay: 0,
                autoplay: true,
                trigger: 'init', // init, hover, click, scroll
                direction: 'in', // in, out, toggle
                ease: 'power2.out',
                ...config
            },
            componentId: null,
            animation: null,
            
            init() {
                this.componentId = ComponentManager.generateId();
                ComponentManager.registerComponent('gsapFade', this.componentId, this.$el);
                
                this.waitForGSAP();
            },
            
            waitForGSAP() {
                if (typeof window.gsap !== 'undefined') {
                    this.$nextTick(() => {
                        this.setupAnimation();
                    });
                } else {
                    setTimeout(() => this.waitForGSAP(), 100);
                }
            },
            
            setupAnimation() {
                const element = this.$el;
                
                // Configurar estado inicial
                if (this.config.direction === 'in') {
                    gsap.set(element, { opacity: 0 });
                }
                
                this.createAnimation();
                
                // Ejecutar según el trigger
                if (this.config.autoplay && this.config.trigger === 'init') {
                    this.play();
                }
                
                this.setupTriggers();
            },
            
            createAnimation() {
                const element = this.$el;
                
                if (this.config.direction === 'in') {
                    this.animation = gsap.to(element, {
                        opacity: 1,
                        duration: this.config.duration,
                        delay: this.config.delay,
                        ease: this.config.ease,
                        paused: true
                    });
                } else if (this.config.direction === 'out') {
                    this.animation = gsap.to(element, {
                        opacity: 0,
                        duration: this.config.duration,
                        delay: this.config.delay,
                        ease: this.config.ease,
                        paused: true
                    });
                }
            },
            
            setupTriggers() {
                const element = this.$el;
                
                if (this.config.trigger === 'hover') {
                    element.addEventListener('mouseenter', () => this.play());
                    element.addEventListener('mouseleave', () => this.reverse());
                } else if (this.config.trigger === 'click') {
                    element.addEventListener('click', () => this.toggle());
                } else if (this.config.trigger === 'scroll') {
                    this.setupScrollTrigger();
                }
            },
            
            setupScrollTrigger() {
                // Implementar Intersection Observer para scroll trigger
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            this.play();
                        }
                    });
                }, { threshold: 0.1 });
                
                observer.observe(this.$el);
            },
            
            play() {
                if (this.animation) {
                    this.animation.play();
                }
            },
            
            reverse() {
                if (this.animation) {
                    this.animation.reverse();
                }
            },
            
            toggle() {
                if (this.animation) {
                    this.animation.reversed() ? this.animation.play() : this.animation.reverse();
                }
            },
            
            destroy() {
                if (this.animation) {
                    this.animation.kill();
                }
                ComponentManager.unregisterComponent(this.componentId);
            }
        };
    }
    
    /**
     * Animación Slide
     */
    createSlideAnimation(config = {}) {
        return {
            config: {
                duration: 1,
                delay: 0,
                direction: 'left', // left, right, up, down
                distance: 100,
                autoplay: true,
                trigger: 'init',
                ease: 'power2.out',
                ...config
            },
            componentId: null,
            animation: null,
            
            init() {
                this.componentId = ComponentManager.generateId();
                ComponentManager.registerComponent('gsapSlide', this.componentId, this.$el);
                
                this.waitForGSAP();
            },
            
            waitForGSAP() {
                if (typeof window.gsap !== 'undefined') {
                    this.$nextTick(() => {
                        this.setupAnimation();
                    });
                } else {
                    setTimeout(() => this.waitForGSAP(), 100);
                }
            },
            
            setupAnimation() {
                const element = this.$el;
                
                // Determinar posición inicial según dirección
                const initialProps = {};
                const finalProps = {};
                
                switch (this.config.direction) {
                    case 'left':
                        initialProps.x = -this.config.distance;
                        finalProps.x = 0;
                        break;
                    case 'right':
                        initialProps.x = this.config.distance;
                        finalProps.x = 0;
                        break;
                    case 'up':
                        initialProps.y = -this.config.distance;
                        finalProps.y = 0;
                        break;
                    case 'down':
                        initialProps.y = this.config.distance;
                        finalProps.y = 0;
                        break;
                }
                
                // Estado inicial
                gsap.set(element, { ...initialProps, opacity: 0 });
                
                // Crear animación
                this.animation = gsap.to(element, {
                    ...finalProps,
                    opacity: 1,
                    duration: this.config.duration,
                    delay: this.config.delay,
                    ease: this.config.ease,
                    paused: true
                });
                
                // Ejecutar según trigger
                if (this.config.autoplay && this.config.trigger === 'init') {
                    this.play();
                }
                
                this.setupTriggers();
            },
            
            setupTriggers() {
                if (this.config.trigger === 'hover') {
                    this.$el.addEventListener('mouseenter', () => this.play());
                    this.$el.addEventListener('mouseleave', () => this.reverse());
                } else if (this.config.trigger === 'click') {
                    this.$el.addEventListener('click', () => this.toggle());
                } else if (this.config.trigger === 'scroll') {
                    this.setupScrollTrigger();
                }
            },
            
            setupScrollTrigger() {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            this.play();
                        }
                    });
                }, { threshold: 0.1 });
                
                observer.observe(this.$el);
            },
            
            play() {
                if (this.animation) this.animation.play();
            },
            
            reverse() {
                if (this.animation) this.animation.reverse();
            },
            
            toggle() {
                if (this.animation) {
                    this.animation.reversed() ? this.animation.play() : this.animation.reverse();
                }
            },
            
            destroy() {
                if (this.animation) this.animation.kill();
                ComponentManager.unregisterComponent(this.componentId);
            }
        };
    }
    
    /**
     * Animación Scale/Zoom
     */
    createScaleAnimation(config = {}) {
        return {
            config: {
                duration: 0.8,
                delay: 0,
                scale: 1.1,
                autoplay: true,
                trigger: 'hover',
                ease: 'power2.out',
                ...config
            },
            componentId: null,
            animation: null,
            
            init() {
                this.componentId = ComponentManager.generateId();
                ComponentManager.registerComponent('gsapScale', this.componentId, this.$el);
                
                this.waitForGSAP();
            },
            
            waitForGSAP() {
                if (typeof window.gsap !== 'undefined') {
                    this.$nextTick(() => {
                        this.setupAnimation();
                    });
                } else {
                    setTimeout(() => this.waitForGSAP(), 100);
                }
            },
            
            setupAnimation() {
                this.animation = gsap.to(this.$el, {
                    scale: this.config.scale,
                    duration: this.config.duration,
                    delay: this.config.delay,
                    ease: this.config.ease,
                    paused: true
                });
                
                this.setupTriggers();
            },
            
            setupTriggers() {
                if (this.config.trigger === 'hover') {
                    this.$el.addEventListener('mouseenter', () => this.play());
                    this.$el.addEventListener('mouseleave', () => this.reverse());
                } else if (this.config.trigger === 'click') {
                    this.$el.addEventListener('click', () => this.toggle());
                }
            },
            
            play() {
                if (this.animation) this.animation.play();
            },
            
            reverse() {
                if (this.animation) this.animation.reverse();
            },
            
            toggle() {
                if (this.animation) {
                    this.animation.reversed() ? this.animation.play() : this.animation.reverse();
                }
            },
            
            destroy() {
                if (this.animation) this.animation.kill();
                ComponentManager.unregisterComponent(this.componentId);
            }
        };
    }
    
    /**
     * Animación de contador
     */
    createCounterAnimation(config = {}) {
        return {
            config: {
                duration: 2,
                startValue: 0,
                endValue: 100,
                autoplay: true,
                trigger: 'scroll',
                ease: 'power2.out',
                ...config
            },
            componentId: null,
            animation: null,
            currentValue: 0,
            
            init() {
                this.componentId = ComponentManager.generateId();
                ComponentManager.registerComponent('gsapCounter', this.componentId, this.$el);
                
                this.currentValue = this.config.startValue;
                this.$el.textContent = this.currentValue;
                
                this.waitForGSAP();
            },
            
            waitForGSAP() {
                if (typeof window.gsap !== 'undefined') {
                    this.$nextTick(() => {
                        this.setupAnimation();
                    });
                } else {
                    setTimeout(() => this.waitForGSAP(), 100);
                }
            },
            
            setupAnimation() {
                this.animation = gsap.to(this, {
                    currentValue: this.config.endValue,
                    duration: this.config.duration,
                    ease: this.config.ease,
                    paused: true,
                    onUpdate: () => {
                        this.$el.textContent = Math.round(this.currentValue);
                    }
                });
                
                if (this.config.trigger === 'scroll') {
                    this.setupScrollTrigger();
                } else if (this.config.autoplay) {
                    this.play();
                }
            },
            
            setupScrollTrigger() {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            this.play();
                            observer.unobserve(this.$el); // Solo una vez
                        }
                    });
                }, { threshold: 0.5 });
                
                observer.observe(this.$el);
            },
            
            play() {
                if (this.animation) this.animation.play();
            },
            
            reset() {
                this.currentValue = this.config.startValue;
                this.$el.textContent = this.currentValue;
                if (this.animation) this.animation.restart();
            },
            
            destroy() {
                if (this.animation) this.animation.kill();
                ComponentManager.unregisterComponent(this.componentId);
            }
        };
    }
    
    /**
     * Timeline de múltiples animaciones
     */
    createTimelineAnimation(config = {}) {
        return {
            config: {
                autoplay: true,
                repeat: 0,
                repeatDelay: 1,
                animations: [],
                ...config
            },
            componentId: null,
            timeline: null,
            
            init() {
                this.componentId = ComponentManager.generateId();
                ComponentManager.registerComponent('gsapTimeline', this.componentId, this.$el);
                
                this.waitForGSAP();
            },
            
            waitForGSAP() {
                if (typeof window.gsap !== 'undefined') {
                    this.$nextTick(() => {
                        this.setupTimeline();
                    });
                } else {
                    setTimeout(() => this.waitForGSAP(), 100);
                }
            },
            
            setupTimeline() {
                this.timeline = gsap.timeline({
                    paused: true,
                    repeat: this.config.repeat,
                    repeatDelay: this.config.repeatDelay
                });
                
                // Agregar animaciones al timeline
                this.config.animations.forEach((anim, index) => {
                    const target = anim.selector ? this.$el.querySelector(anim.selector) : this.$el;
                    
                    if (target) {
                        this.timeline.to(target, {
                            ...anim.properties,
                            duration: anim.duration || 1,
                            ease: anim.ease || 'power2.out'
                        }, anim.position || index);
                    }
                });
                
                // Registrar timeline
                window.GSAPPlugin.timelines.set(this.componentId, this.timeline);
                
                if (this.config.autoplay) {
                    this.play();
                }
            },
            
            play() {
                if (this.timeline) this.timeline.play();
            },
            
            pause() {
                if (this.timeline) this.timeline.pause();
            },
            
            restart() {
                if (this.timeline) this.timeline.restart();
            },
            
            reverse() {
                if (this.timeline) this.timeline.reverse();
            },
            
            destroy() {
                if (this.timeline) {
                    this.timeline.kill();
                    window.GSAPPlugin.timelines.delete(this.componentId);
                }
                ComponentManager.unregisterComponent(this.componentId);
            }
        };
    }
    
    /**
     * Obtener presets de animaciones
     */
    getPresets() {
        return {
            fadeIn: {
                duration: 1,
                direction: 'in',
                trigger: 'scroll'
            },
            slideInLeft: {
                duration: 1,
                direction: 'left',
                distance: 100,
                trigger: 'scroll'
            },
            scaleOnHover: {
                duration: 0.3,
                scale: 1.05,
                trigger: 'hover'
            },
            counter: {
                duration: 2,
                startValue: 0,
                endValue: 100,
                trigger: 'scroll'
            },
            heroTimeline: {
                animations: [
                    {
                        selector: '.hero-title',
                        properties: { opacity: 1, y: 0 },
                        duration: 1,
                        position: 0
                    },
                    {
                        selector: '.hero-subtitle',
                        properties: { opacity: 1, y: 0 },
                        duration: 1,
                        position: 0.5
                    },
                    {
                        selector: '.hero-button',
                        properties: { opacity: 1, scale: 1 },
                        duration: 0.8,
                        position: 1
                    }
                ]
            }
        };
    }
    
    /**
     * Generar HTML para diferentes tipos de animación
     */
    generateHTML(type, content = {}) {
        const templates = {
            fadeIn: () => `
                <div x-data="gsapFade({ direction: 'in', trigger: 'scroll' })" 
                     class="p-8 bg-blue-500 text-white rounded-lg">
                    <h3 class="text-2xl font-bold">${content.title || 'Fade In Animation'}</h3>
                    <p>${content.description || 'This element fades in when scrolled into view.'}</p>
                </div>
            `,
            
            slideIn: () => `
                <div x-data="gsapSlide({ direction: 'left', trigger: 'scroll' })" 
                     class="p-8 bg-green-500 text-white rounded-lg">
                    <h3 class="text-2xl font-bold">${content.title || 'Slide In Animation'}</h3>
                    <p>${content.description || 'This element slides in from the left.'}</p>
                </div>
            `,
            
            counter: () => `
                <div class="text-center p-8">
                    <div x-data="gsapCounter({ endValue: ${content.value || 100}, trigger: 'scroll' })" 
                         class="text-6xl font-bold text-blue-600">
                        0
                    </div>
                    <p class="text-gray-600 mt-2">${content.label || 'Counter Animation'}</p>
                </div>
            `,
            
            scaleHover: () => `
                <div x-data="gsapScale({ scale: 1.1, trigger: 'hover' })" 
                     class="p-8 bg-purple-500 text-white rounded-lg cursor-pointer">
                    <h3 class="text-2xl font-bold">${content.title || 'Hover to Scale'}</h3>
                    <p>${content.description || 'This element scales on hover.'}</p>
                </div>
            `
        };
        
        return templates[type] ? templates[type]() : templates.fadeIn();
    }
}

// Instanciar plugin globalmente
window.GSAPPlugin = GSAPPlugin;  

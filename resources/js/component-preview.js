// resources/js/component-preview.js
import Alpine from 'alpinejs'
import { gsap } from 'gsap'

// 🎯 Componente GSAP básico para animaciones
Alpine.data('gsapFade', (config = {}) => ({
    config: {
        duration: 1,
        delay: 0,
        direction: 'in', // 'in' | 'out'
        ease: 'power2.out',
        ...config
    },
    
    init() {
        this.$nextTick(() => {
            this.animate();
        });
    },
    
    animate() {
        if (this.config.direction === 'in') {
            gsap.set(this.$el, { opacity: 0 });
            gsap.to(this.$el, {
                opacity: 1,
                duration: this.config.duration,
                delay: this.config.delay,
                ease: this.config.ease
            });
        }
        
        console.log('✨ GSAP fade animation applied');
    }
}));

// 🎠 Slider personalizado con GSAP (mejor que Swiper!)
Alpine.data('gsapSlider', (config = {}) => ({
    currentSlide: 0,
    totalSlides: 0,
    isAnimating: false,
    config: {
        autoplay: false,
        autoplayDelay: 3000,
        duration: 0.8,
        ease: 'power2.inOut',
        showNavigation: true,
        showPagination: true,
        ...config
    },
    autoplayTimer: null,
    
    init() {
        this.$nextTick(() => {
            this.initSlider();
        });
    },
    
    initSlider() {
        const slides = this.$el.querySelectorAll('.slide');
        this.totalSlides = slides.length;
        
        if (this.totalSlides === 0) {
            this.createSampleSlides();
            return;
        }
        
        // Inicializar posiciones
        slides.forEach((slide, index) => {
            gsap.set(slide, {
                x: index === 0 ? 0 : '100%',
                opacity: index === 0 ? 1 : 0
            });
        });
        
        // Crear controles si están habilitados
        if (this.config.showNavigation) {
            this.createNavigation();
        }
        
        if (this.config.showPagination) {
            this.createPagination();
        }
        
        // Iniciar autoplay si está habilitado
        if (this.config.autoplay) {
            this.startAutoplay();
        }
        
        console.log('🎠 GSAP Slider initialized with', this.totalSlides, 'slides');
    },
    
    createSampleSlides() {
        const sampleSlides = [
            { title: 'Slide 1', content: 'Contenido del primer slide', bg: 'bg-gradient-to-r from-blue-500 to-purple-600' },
            { title: 'Slide 2', content: 'Contenido del segundo slide', bg: 'bg-gradient-to-r from-green-500 to-blue-500' },
            { title: 'Slide 3', content: 'Contenido del tercer slide', bg: 'bg-gradient-to-r from-purple-500 to-pink-500' }
        ];
        
        const slidesContainer = document.createElement('div');
        slidesContainer.className = 'slides-container relative overflow-hidden h-64 rounded-lg';
        
        sampleSlides.forEach((slideData, index) => {
            const slide = document.createElement('div');
            slide.className = `slide absolute inset-0 flex items-center justify-center text-white ${slideData.bg}`;
            slide.innerHTML = `
                <div class="text-center">
                    <h3 class="text-2xl font-bold mb-4">${slideData.title}</h3>
                    <p class="text-lg">${slideData.content}</p>
                </div>
            `;
            slidesContainer.appendChild(slide);
        });
        
        this.$el.appendChild(slidesContainer);
        this.initSlider(); // Re-inicializar con slides creados
    },
    
    createNavigation() {
        const navContainer = document.createElement('div');
        navContainer.className = 'slider-navigation absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 pointer-events-none';
        
        // Crear botones por separado para poder agregar event listeners
        const prevBtn = document.createElement('button');
        prevBtn.className = 'nav-btn nav-prev bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all pointer-events-auto';
        prevBtn.innerHTML = `
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
        `;
        prevBtn.addEventListener('click', () => this.prevSlide());

        const nextBtn = document.createElement('button');
        nextBtn.className = 'nav-btn nav-next bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all pointer-events-auto';
        nextBtn.innerHTML = `
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
        `;
        nextBtn.addEventListener('click', () => this.nextSlide());
        
        navContainer.appendChild(prevBtn);
        navContainer.appendChild(nextBtn);
        
        this.$el.appendChild(navContainer);
    },
    
    createPagination() {
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'slider-pagination absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2';
        
        for (let i = 0; i < this.totalSlides; i++) {
            const dot = document.createElement('button');
            dot.className = `pagination-dot w-3 h-3 rounded-full transition-all ${i === 0 ? 'bg-white' : 'bg-white bg-opacity-50'}`;
            
            // ✅ Event listener correcto en lugar de @click
            dot.addEventListener('click', () => this.goToSlide(i));
            
            paginationContainer.appendChild(dot);
        }
        
        this.$el.appendChild(paginationContainer);
    },
    
    goToSlide(index) {
        if (this.isAnimating || index === this.currentSlide) return;
        
        const slides = this.$el.querySelectorAll('.slide');
        const currentSlideEl = slides[this.currentSlide];
        const nextSlideEl = slides[index];
        
        this.isAnimating = true;
        
        // Animación de salida
        gsap.to(currentSlideEl, {
            x: index > this.currentSlide ? '-100%' : '100%',
            opacity: 0,
            duration: this.config.duration,
            ease: this.config.ease
        });
        
        // Preparar slide entrante
        gsap.set(nextSlideEl, {
            x: index > this.currentSlide ? '100%' : '-100%',
            opacity: 0
        });
        
        // Animación de entrada
        gsap.to(nextSlideEl, {
            x: 0,
            opacity: 1,
            duration: this.config.duration,
            ease: this.config.ease,
            onComplete: () => {
                this.isAnimating = false;
            }
        });
        
        // Actualizar estado
        this.currentSlide = index;
        this.updatePagination();
        
        console.log('🎠 Moved to slide', index + 1);
    },
    
    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.totalSlides;
        this.goToSlide(nextIndex);
    },
    
    prevSlide() {
        const prevIndex = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        this.goToSlide(prevIndex);
    },
    
    updatePagination() {
        const dots = this.$el.querySelectorAll('.pagination-dot');
        dots.forEach((dot, index) => {
            if (index === this.currentSlide) {
                dot.className = 'pagination-dot w-3 h-3 rounded-full transition-all bg-white';
            } else {
                dot.className = 'pagination-dot w-3 h-3 rounded-full transition-all bg-white bg-opacity-50';
            }
        });
    },
    
    startAutoplay() {
        this.autoplayTimer = setInterval(() => {
            if (!this.isAnimating) {
                this.nextSlide();
            }
        }, this.config.autoplayDelay);
    },
    
    stopAutoplay() {
        if (this.autoplayTimer) {
            clearInterval(this.autoplayTimer);
            this.autoplayTimer = null;
        }
    },
    
    destroy() {
        this.stopAutoplay();
    }
}));

// 🎭 Componente para animaciones de entrada
Alpine.data('gsapReveal', (config = {}) => ({
    config: {
        trigger: 'scroll', // 'scroll' | 'click' | 'auto'
        animation: 'slideUp', // 'slideUp' | 'slideLeft' | 'slideRight' | 'scale' | 'fade'
        duration: 1,
        delay: 0,
        stagger: 0.1, // Para múltiples elementos
        ...config
    },
    
    init() {
        this.$nextTick(() => {
            if (this.config.trigger === 'auto') {
                this.animate();
            } else if (this.config.trigger === 'scroll') {
                this.setupScrollTrigger();
            }
        });
    },
    
    animate() {
        const elements = this.$el.children.length > 1 ? Array.from(this.$el.children) : [this.$el];
        
        // Configurar estado inicial
        elements.forEach(el => {
            switch (this.config.animation) {
                case 'slideUp':
                    gsap.set(el, { y: 50, opacity: 0 });
                    break;
                case 'slideLeft':
                    gsap.set(el, { x: 50, opacity: 0 });
                    break;
                case 'slideRight':
                    gsap.set(el, { x: -50, opacity: 0 });
                    break;
                case 'scale':
                    gsap.set(el, { scale: 0.8, opacity: 0 });
                    break;
                default:
                    gsap.set(el, { opacity: 0 });
            }
        });
        
        // Animar entrada
        gsap.to(elements, {
            y: 0,
            x: 0,
            scale: 1,
            opacity: 1,
            duration: this.config.duration,
            delay: this.config.delay,
            stagger: this.config.stagger,
            ease: 'power2.out'
        });
        
        console.log('✨ GSAP reveal animation applied:', this.config.animation);
    },
    
    setupScrollTrigger() {
        // Versión simple sin ScrollTrigger plugin
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

// 🚀 Iniciar Alpine
Alpine.start();

// Hacer disponibles globalmente para debug
window.Alpine = Alpine;
window.gsap = gsap;

console.log('✅ Component Preview System Loaded (GSAP + Alpine)');
console.log('📦 Alpine version:', Alpine.version);
console.log('✨ GSAP available:', typeof gsap !== 'undefined');     
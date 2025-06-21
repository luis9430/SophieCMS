// resources/js/components/AlpineComponents.js
export default class AlpineComponents {
    
    // === ANIMACIONES ===
    
    /**
     * Box hover effect (tu ejemplo original)
     */
    static box() {
        return {
            init() {
                this.animation = gsap.to(this.$refs.box, {
                    paused: true,
                    opacity: 0.5,
                    borderRadius: "50%",
                    duration: 0.3
                });
            }
        }
    }

    /**
     * Fade in animation
     */
    static fadeIn(options = {}) {
        return {
            init() {
                const config = {
                    duration: 0.6,
                    delay: 0,
                    ...options
                };
                
                gsap.fromTo(this.$el, 
                    { opacity: 0 }, 
                    { opacity: 1, ...config }
                );
            }
        }
    }

    /**
     * Slide up animation
     */
    static slideUp(options = {}) {
        return {
            init() {
                const config = {
                    duration: 0.6,
                    delay: 0,
                    y: 50,
                    ...options
                };
                
                gsap.fromTo(this.$el,
                    { y: config.y, opacity: 0 },
                    { y: 0, opacity: 1, duration: config.duration, delay: config.delay }
                );
            }
        }
    }

    /**
     * Slide down animation
     */
    static slideDown(options = {}) {
        return {
            init() {
                const config = {
                    duration: 0.6,
                    delay: 0,
                    y: -50,
                    ...options
                };
                
                gsap.fromTo(this.$el,
                    { y: config.y, opacity: 0 },
                    { y: 0, opacity: 1, duration: config.duration, delay: config.delay }
                );
            }
        }
    }

    /**
     * Scale animation
     */
    static scale(options = {}) {
        return {
            init() {
                const config = {
                    duration: 0.6,
                    delay: 0,
                    from: 0.8,
                    to: 1,
                    ...options
                };
                
                gsap.fromTo(this.$el,
                    { scale: config.from, opacity: 0 },
                    { scale: config.to, opacity: 1, duration: config.duration, delay: config.delay }
                );
            }
        }
    }

    /**
     * Stagger animation para múltiples elementos
     */
    static stagger(options = {}) {
        return {
            init() {
                const config = {
                    duration: 0.6,
                    stagger: 0.1,
                    y: 30,
                    ...options
                };
                
                const children = this.$el.children;
                if (children.length > 0) {
                    gsap.fromTo(children,
                        { y: config.y, opacity: 0 },
                        { 
                            y: 0, 
                            opacity: 1,
                            duration: config.duration,
                            stagger: config.stagger
                        }
                    );
                }
            }
        }
    }

    /**
     * TypeWriter effect
     */
    static typeWriter(options = {}) {
        return {
            text: '',
            originalText: '',
            speed: options.speed || 80,
            cursor: options.cursor || false,
            
            init() {
                this.originalText = this.$el.textContent;
                this.$el.textContent = '';
                
                if (this.cursor) {
                    this.$el.style.borderRight = '2px solid currentColor';
                }
                
                this.type();
            },
            
            async type() {
                for (let i = 0; i <= this.originalText.length; i++) {
                    this.text = this.originalText.slice(0, i);
                    this.$el.textContent = this.text;
                    await new Promise(resolve => setTimeout(resolve, this.speed));
                }
                
                if (this.cursor) {
                    setTimeout(() => {
                        this.$el.style.borderRight = 'none';
                    }, 500);
                }
            }
        }
    }

    /**
     * Card hover effect avanzado
     */
    static cardHover(options = {}) {
        return {
            init() {
                const config = {
                    y: -10,
                    scale: 1.02,
                    duration: 0.3,
                    shadow: '0 20px 40px rgba(0,0,0,0.1)',
                    shadowDefault: '0 5px 15px rgba(0,0,0,0.05)',
                    ...options
                };
                
                // Crear animaciones pausadas
                this.hoverIn = gsap.to(this.$el, {
                    paused: true,
                    y: config.y,
                    scale: config.scale,
                    boxShadow: config.shadow,
                    duration: config.duration,
                    ease: 'power2.out'
                });
                
                this.hoverOut = gsap.to(this.$el, {
                    paused: true,
                    y: 0,
                    scale: 1,
                    boxShadow: config.shadowDefault,
                    duration: config.duration,
                    ease: 'power2.out'
                });
            },
            
            mouseEnter() {
                this.hoverOut.pause();
                this.hoverIn.restart();
            },
            
            mouseLeave() {
                this.hoverIn.pause();
                this.hoverOut.restart();
            }
        }
    }

    // === COMPONENTES UI ===

    /**
     * Modal con animaciones GSAP
     */
    static modal(options = {}) {
        return {
            show: false,
            
            init() {
                this.backdrop = this.$refs.backdrop;
                this.content = this.$refs.content;
            },
            
            open() {
                this.show = true;
                this.$nextTick(() => {
                    gsap.fromTo(this.backdrop, 
                        { opacity: 0 }, 
                        { opacity: 1, duration: 0.3 }
                    );
                    gsap.fromTo(this.content,
                        { scale: 0.8, opacity: 0 },
                        { scale: 1, opacity: 1, duration: 0.3, delay: 0.1, ease: 'back.out(1.7)' }
                    );
                });
            },
            
            close() {
                gsap.to(this.content, { 
                    scale: 0.8, 
                    opacity: 0, 
                    duration: 0.2 
                });
                gsap.to(this.backdrop, { 
                    opacity: 0, 
                    duration: 0.3,
                    delay: 0.1,
                    onComplete: () => this.show = false
                });
            }
        }
    }

    /**
     * Dropdown animado
     */
    static dropdown(options = {}) {
        return {
            open: false,
            
            init() {
                this.menu = this.$refs.menu;
                gsap.set(this.menu, { height: 0, opacity: 0 });
            },
            
            toggle() {
                this.open = !this.open;
                
                if (this.open) {
                    gsap.to(this.menu, {
                        height: 'auto',
                        opacity: 1,
                        duration: 0.3,
                        ease: 'power2.out'
                    });
                } else {
                    gsap.to(this.menu, {
                        height: 0,
                        opacity: 0,
                        duration: 0.2,
                        ease: 'power2.in'
                    });
                }
            }
        }
    }

    /**
     * Form con validación y animaciones
     */
    static form(options = {}) {
        return {
            data: options.data || {},
            errors: {},
            loading: false,
            success: false,
            
            async submit() {
                this.loading = true;
                this.errors = {};
                this.success = false;
                
                // Animación de loading en botón
                if (this.$refs.submitBtn) {
                    gsap.to(this.$refs.submitBtn, {
                        scale: 0.95,
                        duration: 0.1,
                        yoyo: true,
                        repeat: 1
                    });
                }
                
                try {
                    const response = await fetch(options.action || '#', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content
                        },
                        body: JSON.stringify(this.data)
                    });
                    
                    const result = await response.json();
                    
                    if (response.ok) {
                        this.success = true;
                        this.showSuccess();
                    } else {
                        this.errors = result.errors || {};
                        this.showErrors();
                    }
                    
                } catch (error) {
                    console.error('Form error:', error);
                    this.errors = { general: 'Error de conexión' };
                    this.showErrors();
                } finally {
                    this.loading = false;
                }
            },
            
            showSuccess() {
                if (this.$refs.successMessage) {
                    gsap.fromTo(this.$refs.successMessage, 
                        { opacity: 0, y: -10 },
                        { opacity: 1, y: 0, duration: 0.3 }
                    );
                }
            },
            
            showErrors() {
                const errorElements = this.$el.querySelectorAll('.error-message');
                if (errorElements.length > 0) {
                    gsap.fromTo(errorElements,
                        { opacity: 0, x: -10 },
                        { opacity: 1, x: 0, duration: 0.3, stagger: 0.1 }
                    );
                }
            }
        }
    }

    // === UTILIDADES ===

    /**
     * Toggle simple
     */
    static toggle(initialState = false) {
        return {
            open: initialState,
            
            toggle() {
                this.open = !this.open;
            },
            
            show() {
                this.open = true;
            },
            
            hide() {
                this.open = false;
            }
        }
    }

    /**
     * Loading state
     */
    static loading() {
        return {
            isLoading: false,
            
            async execute(asyncFunction) {
                this.isLoading = true;
                try {
                    const result = await asyncFunction();
                    return result;
                } catch (error) {
                    console.error('Loading error:', error);
                    throw error;
                } finally {
                    this.isLoading = false;
                }
            },
            
            start() {
                this.isLoading = true;
            },
            
            stop() {
                this.isLoading = false;
            }
        }
    }

    // === MÉTODO ESTÁTICO PARA REGISTRAR TODOS LOS COMPONENTES ===
    
    /**
     * Registrar todos los componentes en Alpine
     */
    static registerAll() {
        // Animaciones
        Alpine.data('box', this.box);
        Alpine.data('fadeIn', this.fadeIn);
        Alpine.data('slideUp', this.slideUp);
        Alpine.data('slideDown', this.slideDown);
        Alpine.data('scale', this.scale);
        Alpine.data('stagger', this.stagger);
        Alpine.data('typeWriter', this.typeWriter);
        Alpine.data('cardHover', this.cardHover);
        
        // UI Components
        Alpine.data('modal', this.modal);
        Alpine.data('dropdown', this.dropdown);
        Alpine.data('form', this.form);
        
        // Utilidades
        Alpine.data('toggle', this.toggle);
        Alpine.data('loading', this.loading);
        
        console.log('✅ All Alpine components registered');
    }

    /**
     * Obtener lista de componentes disponibles
     */
    static getAvailableComponents() {
        return [
            // Animaciones
            'box', 'fadeIn', 'slideUp', 'slideDown', 'scale', 'stagger', 'typeWriter', 'cardHover',
            // UI
            'modal', 'dropdown', 'form',
            // Utilidades
            'toggle', 'loading'
        ];
    }
}
// resources/js/libraries/adapters/gsap-adapter.js
export default class GSAPAdapter {
    static instance = null;
    static isInitialized = false;

    /**
     * Obtener instancia singleton de GSAP
     */
    static async getInstance(config = {}) {
        if (GSAPAdapter.instance && GSAPAdapter.isInitialized) {
            console.log('🎬 GSAP - Returning existing instance');
            return GSAPAdapter.instance;
        }

        console.log('🎬 GSAP - Creating new instance');
        return await GSAPAdapter.initialize(config);
    }

    /**
     * Inicializar GSAP una sola vez
     */
    static async initialize(config = {}) {
        try {
            // Verificar que GSAP esté disponible globalmente
            if (typeof window.gsap === 'undefined') {
                throw new Error('GSAP not available globally. Make sure it\'s imported in app.js');
            }

            const defaultConfig = {
                duration: 0.6,
                ease: 'power2.out',
                autoKill: true,
                clearProps: 'all'
            };

            const finalConfig = { ...defaultConfig, ...config };

            // Crear instancia optimizada
            GSAPAdapter.instance = {
                // Core GSAP (referencia global)
                core: window.gsap,
                config: finalConfig,

                // === MÉTODOS HELPER OPTIMIZADOS ===
                
                /**
                 * Fade In con configuración optimizada
                 */
                fadeIn: (elements, options = {}) => {
                    const targets = GSAPAdapter.normalizeTargets(elements);
                    return window.gsap.fromTo(targets, 
                        { opacity: 0 },
                        { 
                            opacity: 1, 
                            duration: finalConfig.duration,
                            ease: finalConfig.ease,
                            ...options
                        }
                    );
                },

                /**
                 * Fade Out con cleanup automático
                 */
                fadeOut: (elements, options = {}) => {
                    const targets = GSAPAdapter.normalizeTargets(elements);
                    return window.gsap.to(targets, {
                        opacity: 0,
                        duration: finalConfig.duration,
                        ease: finalConfig.ease,
                        ...options
                    });
                },

                /**
                 * Slide Up (desde abajo)
                 */
                slideUp: (elements, options = {}) => {
                    const targets = GSAPAdapter.normalizeTargets(elements);
                    return window.gsap.fromTo(targets,
                        { y: 50, opacity: 0 },
                        { 
                            y: 0, 
                            opacity: 1, 
                            duration: finalConfig.duration,
                            ease: finalConfig.ease,
                            ...options
                        }
                    );
                },

                /**
                 * Slide Down (desde arriba)
                 */
                slideDown: (elements, options = {}) => {
                    const targets = GSAPAdapter.normalizeTargets(elements);
                    return window.gsap.fromTo(targets,
                        { y: -50, opacity: 0 },
                        { 
                            y: 0, 
                            opacity: 1, 
                            duration: finalConfig.duration,
                            ease: finalConfig.ease,
                            ...options
                        }
                    );
                },

                /**
                 * Scale animation
                 */
                scale: (elements, options = {}) => {
                    const targets = GSAPAdapter.normalizeTargets(elements);
                    return window.gsap.fromTo(targets,
                        { scale: 0.8, opacity: 0 },
                        { 
                            scale: 1, 
                            opacity: 1, 
                            duration: finalConfig.duration,
                            ease: finalConfig.ease,
                            ...options
                        }
                    );
                },

                /**
                 * Stagger animations (múltiples elementos)
                 */
                staggerIn: (elements, options = {}) => {
                    const targets = GSAPAdapter.normalizeTargets(elements);
                    return window.gsap.fromTo(targets,
                        { y: 30, opacity: 0 },
                        { 
                            y: 0, 
                            opacity: 1, 
                            duration: finalConfig.duration,
                            ease: finalConfig.ease,
                            stagger: 0.1,
                            ...options
                        }
                    );
                },

                // === TIMELINE FACTORIES ===

                /**
                 * Crear timeline optimizado
                 */
                timeline: (options = {}) => {
                    return window.gsap.timeline({
                        defaults: {
                            duration: finalConfig.duration,
                            ease: finalConfig.ease
                        },
                        ...options
                    });
                },

                /**
                 * Timeline para secuencias complejas
                 */
                sequence: () => {
                    return window.gsap.timeline({
                        defaults: {
                            duration: finalConfig.duration,
                            ease: finalConfig.ease
                        }
                    });
                },

                // === UTILIDADES DE PERFORMANCE ===

                /**
                 * Batch de animaciones para performance
                 */
                batch: (elements, animation, options = {}) => {
                    const targets = GSAPAdapter.normalizeTargets(elements);
                    return window.gsap.set(targets, { 
                        ...animation,
                        ...options
                    });
                },

                /**
                 * Cleanup de animaciones para evitar memory leaks
                 */
                killAll: (targets = null) => {
                    if (targets) {
                        window.gsap.killTweensOf(GSAPAdapter.normalizeTargets(targets));
                    } else {
                        window.gsap.globalTimeline.clear();
                    }
                },

                /**
                 * Reset de propiedades CSS
                 */
                reset: (elements) => {
                    const targets = GSAPAdapter.normalizeTargets(elements);
                    window.gsap.set(targets, { clearProps: 'all' });
                },

                // === ANIMACIONES PRESET AVANZADAS ===

                /**
                 * Animación de loading
                 */
                loading: (element, options = {}) => {
                    const target = GSAPAdapter.normalizeTargets(element)[0];
                    return window.gsap.to(target, {
                        rotation: 360,
                        duration: 1,
                        ease: 'none',
                        repeat: -1,
                        ...options
                    });
                },

                /**
                 * Animación de pulso
                 */
                pulse: (element, options = {}) => {
                    const target = GSAPAdapter.normalizeTargets(element)[0];
                    return window.gsap.to(target, {
                        scale: 1.1,
                        duration: 0.5,
                        ease: 'power2.inOut',
                        yoyo: true,
                        repeat: -1,
                        ...options
                    });
                },

                /**
                 * Animación de shake
                 */
                shake: (element, options = {}) => {
                    const target = GSAPAdapter.normalizeTargets(element)[0];
                    return window.gsap.to(target, {
                        x: '+=10',
                        duration: 0.1,
                        ease: 'power2.inOut',
                        yoyo: true,
                        repeat: 5,
                        ...options
                    });
                }
            };

            // Registrar componentes Alpine automáticamente
            GSAPAdapter.registerAlpineComponents();

            GSAPAdapter.isInitialized = true;
            console.log('✅ GSAP Adapter initialized successfully');

            return GSAPAdapter.instance;

        } catch (error) {
            console.error('❌ GSAP Adapter initialization failed:', error);
            throw error;
        }
    }

    /**
     * Normalizar targets (string, element, array, NodeList)
     */
    static normalizeTargets(targets) {
        if (typeof targets === 'string') {
            return targets; // GSAP maneja selectores CSS
        }
        
        if (targets instanceof Element) {
            return targets;
        }
        
        if (targets instanceof NodeList || Array.isArray(targets)) {
            return Array.from(targets);
        }
        
        return targets;
    }

    /**
     * Registrar componentes Alpine para GSAP
     */
    static registerAlpineComponents() {
        // No registrar aquí - lo hace app.js después de que todo esté listo
        console.log('🎬 GSAP Adapter - Alpine components will be registered by app.js');
    }

    /**
     * Cleanup method
     */
    static destroy() {
        if (GSAPAdapter.instance) {
            GSAPAdapter.instance.killAll();
            GSAPAdapter.instance = null;
            GSAPAdapter.isInitialized = false;
            console.log('🧹 GSAP Adapter destroyed');
        }
    }

    /**
     * Obtener información de debug
     */
    static getDebugInfo() {
        return {
            isInitialized: GSAPAdapter.isInitialized,
            hasInstance: !!GSAPAdapter.instance,
            gsapVersion: window.gsap?.version || 'unknown',
            config: GSAPAdapter.instance?.config || null
        };
    }
}
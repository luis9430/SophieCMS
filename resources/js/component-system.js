// resources/js/component-system.js
// Sistema Global de Componentes - Seguro y Performante

window.ComponentSystem = {
    // Registry de componentes activos
    activeComponents: new Map(),
    
    // Configuraciones permitidas por tipo
    allowedConfigs: {
        swiper: {
            navigation: 'boolean',
            pagination: 'boolean',
            autoplay: 'object',
            loop: 'boolean',
            slidesPerView: 'number',
            spaceBetween: 'number',
            breakpoints: 'object'
        },
        aos: {
            duration: 'number',
            delay: 'number',
            easing: 'string',
            once: 'boolean',
            offset: 'number'
        },
        gsap: {
            duration: 'number',
            delay: 'number',
            ease: 'string',
            repeat: 'number',
            yoyo: 'boolean'
        }
    },

    // Inicializar sistema
    init() {
        console.log('🚀 ComponentSystem initialized');
        this.setupGlobalComponents();
        this.setupSafetyMonitoring();
    },

    // Registrar Alpine components globales seguros
    setupGlobalComponents() {
        // Swiper Component Seguro
        Alpine.data('safeSwiper', (config = {}) => ({
            swiper: null,
            config: this.sanitizeConfig('swiper', config),
            
            init() {
                this.$nextTick(() => {
                    this.initSwiper();
                });
            },
            
            initSwiper() {
                try {
                    if (!window.Swiper) {
                        console.warn('Swiper library not loaded');
                        return;
                    }
                    
                    this.swiper = new Swiper(this.$el, {
                        // Configuración base segura
                        navigation: {
                            nextEl: '.swiper-button-next',
                            prevEl: '.swiper-button-prev',
                        },
                        pagination: {
                            el: '.swiper-pagination',
                            clickable: true
                        },
                        // Merge configuración sanitizada
                        ...this.config
                    });
                    
                    // Registrar en el sistema
                    ComponentSystem.register('swiper', this.swiper, this.$el);
                    
                } catch (error) {
                    console.error('Swiper init error:', error);
                    this.$el.innerHTML = '<div class="error">Error initializing slider</div>';
                }
            },
            
            destroy() {
                if (this.swiper) {
                    this.swiper.destroy(true, true);
                    ComponentSystem.unregister('swiper', this.$el);
                }
            }
        }));

        // AOS Component Seguro
        Alpine.data('safeAOS', (config = {}) => ({
            config: this.sanitizeConfig('aos', config),
            
            init() {
                this.$nextTick(() => {
                    this.initAOS();
                });
            },
            
            initAOS() {
                try {
                    if (!window.AOS) {
                        console.warn('AOS library not loaded');
                        return;
                    }
                    
                    // Aplicar configuración al elemento
                    Object.entries(this.config).forEach(([key, value]) => {
                        this.$el.setAttribute(`data-aos-${key}`, value);
                    });
                    
                    // Refresh AOS para nuevos elementos
                    AOS.refresh();
                    
                } catch (error) {
                    console.error('AOS init error:', error);
                }
            }
        }));

        // GSAP Component Seguro
        Alpine.data('safeGSAP', (config = {}) => ({
            config: this.sanitizeConfig('gsap', config),
            animation: null,
            
            init() {
                this.$nextTick(() => {
                    this.initGSAP();
                });
            },
            
            initGSAP() {
                try {
                    if (!window.gsap) {
                        console.warn('GSAP library not loaded');
                        return;
                    }
                    
                    // Animación segura por defecto
                    this.animation = gsap.from(this.$el, {
                        opacity: 0,
                        y: 30,
                        duration: 1,
                        ...this.config
                    });
                    
                    ComponentSystem.register('gsap', this.animation, this.$el);
                    
                } catch (error) {
                    console.error('GSAP init error:', error);
                }
            },
            
            destroy() {
                if (this.animation) {
                    this.animation.kill();
                    ComponentSystem.unregister('gsap', this.$el);
                }
            }
        }));
    },

    // Sanitizar configuraciones
    sanitizeConfig(type, config) {
        const allowed = this.allowedConfigs[type] || {};
        const sanitized = {};
        
        Object.entries(config).forEach(([key, value]) => {
            if (allowed[key]) {
                const expectedType = allowed[key];
                
                // Validar tipo
                if (typeof value === expectedType || 
                    (expectedType === 'object' && typeof value === 'object')) {
                    sanitized[key] = value;
                }
            }
        });
        
        return sanitized;
    },

    // Registrar componente activo
    register(type, instance, element) {
        const id = element.dataset.componentId || this.generateId();
        element.dataset.componentId = id;
        
        this.activeComponents.set(id, {
            type,
            instance,
            element,
            createdAt: Date.now()
        });
        
        console.log(`✅ Component registered: ${type} (${id})`);
    },

    // Desregistrar componente
    unregister(type, element) {
        const id = element.dataset.componentId;
        if (id && this.activeComponents.has(id)) {
            this.activeComponents.delete(id);
            console.log(`❌ Component unregistered: ${type} (${id})`);
        }
    },

    // Generar ID único
    generateId() {
        return 'comp_' + Math.random().toString(36).substr(2, 9);
    },

    // Monitoreo de seguridad
    setupSafetyMonitoring() {
        // Detectar intentos de XSS
        this.monitorDOMChanges();
        
        // Limpiar componentes huérfanos cada 30 segundos
        setInterval(() => {
            this.cleanupOrphanedComponents();
        }, 30000);
    },

    // Monitor de cambios DOM sospechosos
    monitorDOMChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        this.scanForSuspiciousContent(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    },

    // Escanear contenido sospechoso
    scanForSuspiciousContent(element) {
        const suspiciousPatterns = [
            /javascript:/gi,
            /on\w+\s*=/gi,
            /eval\s*\(/gi,
            /document\.cookie/gi,
            /localStorage\./gi
        ];

        const html = element.outerHTML || '';
        suspiciousPatterns.forEach((pattern) => {
            if (pattern.test(html)) {
                console.warn('🚨 Suspicious content detected:', element);
                // Opcional: remover elemento o sanitizar
                this.sanitizeElement(element);
            }
        });
    },

    // Sanitizar elemento sospechoso
    sanitizeElement(element) {
        // Remover atributos peligrosos
        const dangerousAttrs = ['onclick', 'onload', 'onerror', 'onmouseover'];
        dangerousAttrs.forEach(attr => {
            element.removeAttribute(attr);
        });

        // Remover scripts inline
        element.querySelectorAll('script').forEach(script => {
            if (!script.src) { // Solo scripts inline
                script.remove();
            }
        });
    },

    // Limpiar componentes huérfanos
    cleanupOrphanedComponents() {
        this.activeComponents.forEach((component, id) => {
            if (!document.contains(component.element)) {
                console.log('🧹 Cleaning orphaned component:', id);
                
                // Destruir instancia si tiene método destroy
                if (component.instance && typeof component.instance.destroy === 'function') {
                    component.instance.destroy();
                }
                
                this.activeComponents.delete(id);
            }
        });
    },

    // Obtener estadísticas
    getStats() {
        const stats = {
            total: this.activeComponents.size,
            byType: {}
        };

        this.activeComponents.forEach((component) => {
            stats.byType[component.type] = (stats.byType[component.type] || 0) + 1;
        });

        return stats;
    },

    // Destruir todos los componentes
    destroyAll() {
        this.activeComponents.forEach((component, id) => {
            if (component.instance && typeof component.instance.destroy === 'function') {
                component.instance.destroy();
            }
        });
        
        this.activeComponents.clear();
        console.log('🧹 All components destroyed');
    }
};

// Inicializar cuando Alpine y DOM estén listos
document.addEventListener('alpine:init', () => {
    ComponentSystem.init();
});

// Cleanup al salir de la página
window.addEventListener('beforeunload', () => {
    ComponentSystem.destroyAll();
});
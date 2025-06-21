// resources/js/libraries/core/initialization-queue.js
export default class InitializationQueue {
    constructor() {
        this.queue = [];
        this.dependencies = new Map();
        this.initialized = new Set();
        this.initializing = new Set();
        this.isProcessing = false;
        
        console.log('⏳ InitializationQueue initialized');
    }

    /**
     * Agregar librería a la cola con dependencias
     */
    addLibrary(name, initFunction, dependencies = []) {
        // Verificar si ya está en la cola
        if (this.queue.find(item => item.name === name)) {
            console.log(`⏳ ${name} already in queue, skipping`);
            return;
        }

        const libraryItem = {
            name,
            initFunction,
            dependencies: dependencies || [],
            priority: this.calculatePriority(name, dependencies)
        };

        this.queue.push(libraryItem);
        this.dependencies.set(name, dependencies);
        
        console.log(`⏳ ${name} added to queue with dependencies:`, dependencies);
    }

    /**
     * Calcular prioridad basada en dependencias y tipo de librería
     */
    calculatePriority(name, dependencies) {
        let priority = 100; // Prioridad base
        
        // Librerías fundamentales tienen mayor prioridad
        const fundamentalLibraries = {
            'alpine': 900,
            'gsap': 800,
            'tailwind': 700
        };
        
        if (fundamentalLibraries[name]) {
            priority = fundamentalLibraries[name];
        }
        
        // Reducir prioridad por cada dependencia
        priority -= dependencies.length * 10;
        
        return priority;
    }

    /**
     * Procesar la cola de inicialización
     */
    async processQueue() {
        if (this.isProcessing) {
            console.log('⏳ Queue already processing, waiting...');
            return await this.waitForProcessing();
        }

        this.isProcessing = true;
        console.log('⏳ Processing initialization queue...');

        try {
            // Ordenar por dependencias y prioridad
            const sortedQueue = this.topologicalSort();
            
            for (const item of sortedQueue) {
                if (!this.initialized.has(item.name)) {
                    await this.initializeLibrary(item);
                }
            }
            
            console.log('✅ Queue processing completed');
            
        } catch (error) {
            console.error('❌ Queue processing failed:', error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Inicializar una librería individual
     */
    async initializeLibrary(item) {
        const { name, initFunction, dependencies } = item;
        
        // Verificar que las dependencias estén inicializadas
        for (const dep of dependencies) {
            if (!this.initialized.has(dep)) {
                throw new Error(`${name} dependency '${dep}' not initialized`);
            }
        }

        console.log(`⏳ Initializing ${name}...`);
        this.initializing.add(name);

        try {
            const startTime = Date.now();
            await initFunction();
            const duration = Date.now() - startTime;
            
            this.initialized.add(name);
            this.initializing.delete(name);
            
            console.log(`✅ ${name} initialized in ${duration}ms`);
            
        } catch (error) {
            this.initializing.delete(name);
            console.error(`❌ ${name} initialization failed:`, error);
            throw error;
        }
    }

    /**
     * Ordenamiento topológico para resolver dependencias
     */
    topologicalSort() {
        const visited = new Set();
        const temp = new Set();
        const result = [];

        const visit = (item) => {
            if (temp.has(item.name)) {
                throw new Error(`Circular dependency detected involving ${item.name}`);
            }
            
            if (!visited.has(item.name)) {
                temp.add(item.name);
                
                // Visitar dependencias primero
                for (const depName of item.dependencies) {
                    const depItem = this.queue.find(q => q.name === depName);
                    if (depItem) {
                        visit(depItem);
                    }
                }
                
                temp.delete(item.name);
                visited.add(item.name);
                result.push(item);
            }
        };

        // Procesar cada item
        for (const item of this.queue) {
            if (!visited.has(item.name)) {
                visit(item);
            }
        }

        // Ordenar por prioridad dentro del orden topológico
        return result.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Esperar a que termine el procesamiento
     */
    async waitForProcessing() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (!this.isProcessing) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }

    /**
     * Verificar si una librería está inicializada
     */
    isInitialized(name) {
        return this.initialized.has(name);
    }

    /**
     * Verificar si una librería está en proceso de inicialización
     */
    isInitializing(name) {
        return this.initializing.has(name);
    }

    /**
     * Obtener estado de la cola
     */
    getStatus() {
        return {
            queueSize: this.queue.length,
            initialized: Array.from(this.initialized),
            initializing: Array.from(this.initializing),
            pending: this.queue
                .filter(item => !this.initialized.has(item.name))
                .map(item => item.name),
            isProcessing: this.isProcessing
        };
    }

    /**
     * Limpiar la cola
     */
    clear() {
        this.queue = [];
        this.dependencies.clear();
        this.initialized.clear();
        this.initializing.clear();
        this.isProcessing = false;
        
        console.log('🧹 InitializationQueue cleared');
    }

    /**
     * Remover librería de la cola
     */
    removeLibrary(name) {
        this.queue = this.queue.filter(item => item.name !== name);
        this.dependencies.delete(name);
        this.initialized.delete(name);
        this.initializing.delete(name);
        
        console.log(`🗑️ ${name} removed from queue`);
    }
}
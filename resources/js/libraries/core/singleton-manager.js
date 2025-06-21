// resources/js/libraries/core/singleton-manager.js
export default class SingletonManager {
    constructor() {
        this.instances = new Map();
        this.initPromises = new Map();
        this.locks = new Map();
        
        console.log('🔒 SingletonManager initialized');
    }

    /**
     * Obtener instancia única de una librería
     * Garantiza que solo se inicialice una vez, sin importar cuántas veces se llame
     */
    async getInstance(libraryName, initFunction) {
        // Si ya existe la instancia, devolverla inmediatamente
        if (this.instances.has(libraryName)) {
            console.log(`🔒 ${libraryName} - Returning existing instance`);
            return this.instances.get(libraryName);
        }

        // Si está en proceso de inicialización, esperar a que termine
        if (this.initPromises.has(libraryName)) {
            console.log(`🔒 ${libraryName} - Waiting for initialization to complete`);
            return await this.initPromises.get(libraryName);
        }

        // Crear lock para evitar race conditions
        if (this.locks.has(libraryName)) {
            console.log(`🔒 ${libraryName} - Locked, waiting...`);
            await this.waitForUnlock(libraryName);
            return this.getInstance(libraryName, initFunction);
        }

        console.log(`🔒 ${libraryName} - Starting initialization`);
        
        // Establecer lock
        this.locks.set(libraryName, true);

        try {
            // Crear promesa de inicialización
            const initPromise = this.initializeWithTimeout(libraryName, initFunction);
            this.initPromises.set(libraryName, initPromise);

            // Ejecutar inicialización
            const instance = await initPromise;

            // Guardar instancia exitosa
            this.instances.set(libraryName, instance);
            
            // Limpiar promesa temporal
            this.initPromises.delete(libraryName);
            
            console.log(`✅ ${libraryName} - Singleton instance created successfully`);
            return instance;

        } catch (error) {
            // Limpiar en caso de error
            this.initPromises.delete(libraryName);
            console.error(`❌ ${libraryName} - Singleton initialization failed:`, error);
            throw error;
        } finally {
            // Liberar lock
            this.locks.delete(libraryName);
        }
    }

    /**
     * Inicializar con timeout para evitar cuelgues
     */
    async initializeWithTimeout(libraryName, initFunction, timeout = 10000) {
        return new Promise(async (resolve, reject) => {
            // Timeout de seguridad
            const timeoutId = setTimeout(() => {
                reject(new Error(`${libraryName} initialization timeout after ${timeout}ms`));
            }, timeout);

            try {
                const result = await initFunction();
                clearTimeout(timeoutId);
                resolve(result);
            } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }

    /**
     * Esperar a que se libere un lock
     */
    async waitForUnlock(libraryName, maxWait = 5000) {
        const startTime = Date.now();
        
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (!this.locks.has(libraryName)) {
                    clearInterval(checkInterval);
                    resolve();
                } else if (Date.now() - startTime > maxWait) {
                    clearInterval(checkInterval);
                    console.warn(`⚠️ ${libraryName} - Lock wait timeout, proceeding anyway`);
                    resolve();
                }
            }, 50);
        });
    }

    /**
     * Verificar si una instancia existe
     */
    hasInstance(libraryName) {
        return this.instances.has(libraryName);
    }

    /**
     * Obtener instancia existente (sin inicializar)
     */
    getExistingInstance(libraryName) {
        return this.instances.get(libraryName);
    }

    /**
     * Remover una instancia (para testing o cleanup)
     */
    removeInstance(libraryName) {
        if (this.instances.has(libraryName)) {
            const instance = this.instances.get(libraryName);
            
            // Intentar hacer cleanup si tiene método destroy
            if (instance && typeof instance.destroy === 'function') {
                try {
                    instance.destroy();
                } catch (error) {
                    console.warn(`⚠️ Error during ${libraryName} cleanup:`, error);
                }
            }
            
            this.instances.delete(libraryName);
            console.log(`🗑️ ${libraryName} - Instance removed`);
        }
    }

    /**
     * Obtener estado del singleton manager
     */
    getStatus() {
        return {
            instances: Array.from(this.instances.keys()),
            initializing: Array.from(this.initPromises.keys()),
            locked: Array.from(this.locks.keys()),
            total: this.instances.size
        };
    }

    /**
     * Limpiar todas las instancias
     */
    clear() {
        console.log('🧹 SingletonManager - Clearing all instances');
        
        // Cleanup de instancias
        for (const [name, instance] of this.instances) {
            if (instance && typeof instance.destroy === 'function') {
                try {
                    instance.destroy();
                } catch (error) {
                    console.warn(`⚠️ Error cleaning up ${name}:`, error);
                }
            }
        }

        // Limpiar maps
        this.instances.clear();
        this.initPromises.clear();
        this.locks.clear();
        
        console.log('✅ SingletonManager - All instances cleared');
    }

    /**
     * Debug: Forzar nueva instancia (solo para testing)
     */
    forceNewInstance(libraryName, initFunction) {
        console.warn(`🔧 Force creating new instance for ${libraryName}`);
        this.removeInstance(libraryName);
        return this.getInstance(libraryName, initFunction);
    }
}
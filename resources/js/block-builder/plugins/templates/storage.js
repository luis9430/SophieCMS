// ===================================================================
// plugins/templates/storage.js
// Sistema de almacenamiento para templates
// ===================================================================

export class TemplateStorage {
    constructor(options = {}) {
        this.config = {
            storageType: options.storageType || 'localStorage', // localStorage, indexedDB, memory
            prefix: options.prefix || 'pagebuilder_template_',
            maxTemplates: options.maxTemplates || 100,
            maxTemplateSize: options.maxTemplateSize || 1024 * 1024, // 1MB
            enableVersioning: options.enableVersioning || true,
            enableBackup: options.enableBackup || true,
            compressionEnabled: options.compressionEnabled || false,
            ...options
        };
        
        // Cache en memoria para acceso rápido
        this.cache = new Map();
        this.metadata = new Map();
        
        // Estadísticas
        this.stats = {
            templatesStored: 0,
            totalSize: 0,
            cacheHits: 0,
            cacheMisses: 0,
            lastOperation: null
        };
        
        // Inicializar almacenamiento
        this._initializeStorage();
        
        console.log(`💾 TemplateStorage initialized (${this.config.storageType})`);
    }

    // ===================================================================
    // INICIALIZACIÓN
    // ===================================================================

    /**
     * Inicializar sistema de almacenamiento
     * @private
     */
    async _initializeStorage() {
        try {
            switch (this.config.storageType) {
                case 'indexedDB':
                    await this._initIndexedDB();
                    break;
                case 'localStorage':
                    this._initLocalStorage();
                    break;
                case 'memory':
                    this._initMemoryStorage();
                    break;
                default:
                    throw new Error(`Unsupported storage type: ${this.config.storageType}`);
            }
            
            // Cargar metadata existente
            await this._loadMetadata();
            
            // Verificar límites y limpiar si es necesario
            await this._cleanupIfNeeded();
            
        } catch (error) {
            console.error('❌ Error initializing storage:', error);
            // Fallback a memoria
            this.config.storageType = 'memory';
            this._initMemoryStorage();
        }
    }

    /**
     * Inicializar IndexedDB
     * @private
     */
    async _initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('PageBuilderTemplates', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Store para templates
                if (!db.objectStoreNames.contains('templates')) {
                    const templateStore = db.createObjectStore('templates', { keyPath: 'name' });
                    templateStore.createIndex('category', 'metadata.category', { unique: false });
                    templateStore.createIndex('createdAt', 'metadata.createdAt', { unique: false });
                }
                
                // Store para versiones
                if (!db.objectStoreNames.contains('versions')) {
                    const versionStore = db.createObjectStore('versions', { 
                        keyPath: ['templateName', 'version'] 
                    });
                    versionStore.createIndex('templateName', 'templateName', { unique: false });
                }
                
                // Store para metadata
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'key' });
                }
            };
        });
    }

    /**
     * Inicializar localStorage
     * @private
     */
    _initLocalStorage() {
        // Verificar disponibilidad
        if (typeof localStorage === 'undefined') {
            throw new Error('localStorage not available');
        }
        
        // Verificar espacio disponible
        try {
            const testKey = this.config.prefix + 'test';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
        } catch (error) {
            throw new Error('localStorage not accessible');
        }
        
        this.storage = localStorage;
    }

    /**
     * Inicializar almacenamiento en memoria
     * @private
     */
    _initMemoryStorage() {
        this.memoryStore = {
            templates: new Map(),
            versions: new Map(),
            metadata: new Map()
        };
    }

    // ===================================================================
    // OPERACIONES PRINCIPALES
    // ===================================================================

    /**
     * Guardar template
     */
    async saveTemplate(name, templateData) {
        try {
            // Validar entrada
            if (!name || !templateData) {
                throw new Error('Template name and data are required');
            }

            if (typeof templateData.content !== 'string') {
                throw new Error('Template content must be a string');
            }

            // Verificar límites
            if (templateData.content.length > this.config.maxTemplateSize) {
                throw new Error(`Template too large: ${templateData.content.length} bytes`);
            }

            // Verificar si ya existe para versionado
            const existingTemplate = await this.getTemplate(name);
            
            // Preparar datos del template
            const template = {
                name,
                content: templateData.content,
                metadata: {
                    ...templateData.metadata,
                    updatedAt: new Date().toISOString(),
                    size: templateData.content.length,
                    version: this._generateVersion(existingTemplate)
                }
            };

            // Si no existe, añadir fecha de creación
            if (!existingTemplate) {
                template.metadata.createdAt = template.metadata.updatedAt;
                template.metadata.version = '1.0.0';
            }

            // Guardar versión anterior si el versionado está habilitado
            if (this.config.enableVersioning && existingTemplate) {
                await this._saveVersion(name, existingTemplate);
            }

            // Guardar template
            await this._storeTemplate(template);
            
            // Actualizar cache
            this.cache.set(name, template);
            this.metadata.set(name, template.metadata);
            
            // Actualizar estadísticas
            this.stats.templatesStored = (await this.getTemplateCount());
            this.stats.totalSize = await this._calculateTotalSize();
            this.stats.lastOperation = `save:${name}`;
            
            console.log(`💾 Template saved: ${name} (${template.metadata.size} bytes)`);
            return template;
            
        } catch (error) {
            console.error(`❌ Error saving template ${name}:`, error);
            throw error;
        }
    }

    /**
     * Obtener template
     */
    async getTemplate(name) {
        try {
            // Verificar cache primero
            if (this.cache.has(name)) {
                this.stats.cacheHits++;
                return this.cache.get(name);
            }
            
            this.stats.cacheMisses++;
            
            // Cargar desde almacenamiento
            const template = await this._loadTemplate(name);
            
            // Actualizar cache si existe
            if (template) {
                this.cache.set(name, template);
                this.metadata.set(name, template.metadata);
            }
            
            return template;
            
        } catch (error) {
            console.error(`❌ Error loading template ${name}:`, error);
            return null;
        }
    }

    /**
     * Listar templates
     */
    async listTemplates(options = {}) {
        try {
            const {
                category = null,
                sortBy = 'updatedAt',
                sortOrder = 'desc',
                limit = null,
                offset = 0
            } = options;

            let templates = await this._loadAllTemplates();
            
            // Filtrar por categoría
            if (category) {
                templates = templates.filter(t => 
                    t.metadata?.category === category
                );
            }
            
            // Ordenar
            templates.sort((a, b) => {
                const aVal = this._getNestedValue(a, sortBy);
                const bVal = this._getNestedValue(b, sortBy);
                
                if (sortOrder === 'asc') {
                    return aVal > bVal ? 1 : -1;
                } else {
                    return aVal < bVal ? 1 : -1;
                }
            });
            
            // Paginación
            if (limit) {
                templates = templates.slice(offset, offset + limit);
            }
            
            return templates.map(template => ({
                name: template.name,
                metadata: template.metadata,
                size: template.metadata?.size || 0
            }));
            
        } catch (error) {
            console.error('❌ Error listing templates:', error);
            return [];
        }
    }

    /**
     * Eliminar template
     */
    async deleteTemplate(name) {
        try {
            // Verificar si existe
            const template = await this.getTemplate(name);
            if (!template) {
                return false;
            }

            // Crear backup si está habilitado
            if (this.config.enableBackup) {
                await this._createBackup(name, template);
            }

            // Eliminar versiones si existen
            if (this.config.enableVersioning) {
                await this._deleteVersions(name);
            }

            // Eliminar del almacenamiento
            await this._removeTemplate(name);
            
            // Limpiar cache
            this.cache.delete(name);
            this.metadata.delete(name);
            
            // Actualizar estadísticas
            this.stats.templatesStored = await this.getTemplateCount();
            this.stats.totalSize = await this._calculateTotalSize();
            this.stats.lastOperation = `delete:${name}`;
            
            console.log(`🗑️ Template deleted: ${name}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Error deleting template ${name}:`, error);
            return false;
        }
    }

    // ===================================================================
    // VERSIONADO
    // ===================================================================

    /**
     * Obtener versiones de un template
     */
    async getTemplateVersions(name) {
        if (!this.config.enableVersioning) {
            return [];
        }

        try {
            return await this._loadVersions(name);
        } catch (error) {
            console.error(`❌ Error loading versions for ${name}:`, error);
            return [];
        }
    }

    /**
     * Restaurar versión específica
     */
    async restoreVersion(name, version) {
        if (!this.config.enableVersioning) {
            throw new Error('Versioning is not enabled');
        }

        try {
            const versionData = await this._loadVersion(name, version);
            if (!versionData) {
                throw new Error(`Version ${version} not found for template ${name}`);
            }

            // Guardar versión actual antes de restaurar
            const currentTemplate = await this.getTemplate(name);
            if (currentTemplate) {
                await this._saveVersion(name, currentTemplate);
            }

            // Restaurar versión
            await this.saveTemplate(name, {
                content: versionData.content,
                metadata: {
                    ...versionData.metadata,
                    restoredFrom: version,
                    restoredAt: new Date().toISOString()
                }
            });

            console.log(`🔄 Template ${name} restored to version ${version}`);
            return true;

        } catch (error) {
            console.error(`❌ Error restoring version ${version} for ${name}:`, error);
            throw error;
        }
    }

    // ===================================================================
    // BÚSQUEDA Y FILTRADO
    // ===================================================================

    /**
     * Buscar templates
     */
    async searchTemplates(query, options = {}) {
        try {
            const {
                searchFields = ['name', 'metadata.description', 'metadata.category'],
                caseSensitive = false,
                exactMatch = false
            } = options;

            const templates = await this._loadAllTemplates();
            const searchTerm = caseSensitive ? query : query.toLowerCase();

            return templates.filter(template => {
                return searchFields.some(field => {
                    const value = this._getNestedValue(template, field);
                    if (!value) return false;

                    const searchValue = caseSensitive ? String(value) : String(value).toLowerCase();
                    
                    if (exactMatch) {
                        return searchValue === searchTerm;
                    } else {
                        return searchValue.includes(searchTerm);
                    }
                });
            });

        } catch (error) {
            console.error('❌ Error searching templates:', error);
            return [];
        }
    }

    /**
     * Obtener templates por categoría
     */
    async getTemplatesByCategory(category) {
        return await this.listTemplates({ category });
    }

    // ===================================================================
    // ESTADÍSTICAS Y INFORMACIÓN
    // ===================================================================

    /**
     * Obtener número total de templates
     */
    async getTemplateCount() {
        try {
            const templates = await this._loadAllTemplates();
            return templates.length;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Obtener estadísticas detalladas
     */
    async getStats() {
        const templateCount = await this.getTemplateCount();
        const totalSize = await this._calculateTotalSize();
        
        return {
            ...this.stats,
            templatesStored: templateCount,
            totalSize,
            cacheSize: this.cache.size,
            hitRatio: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) || 0,
            averageTemplateSize: templateCount > 0 ? Math.round(totalSize / templateCount) : 0
        };
    }

    /**
     * Obtener información de almacenamiento
     */
    async getStorageInfo() {
        const stats = await this.getStats();
        
        return {
            type: this.config.storageType,
            templateCount: stats.templatesStored,
            totalSize: stats.totalSize,
            maxTemplates: this.config.maxTemplates,
            maxTemplateSize: this.config.maxTemplateSize,
            utilizationPercent: (stats.templatesStored / this.config.maxTemplates) * 100,
            features: {
                versioning: this.config.enableVersioning,
                backup: this.config.enableBackup,
                compression: this.config.compressionEnabled
            }
        };
    }

    // ===================================================================
    // MANTENIMIENTO
    // ===================================================================

    /**
     * Limpiar almacenamiento si es necesario
     */
    async _cleanupIfNeeded() {
        const templateCount = await this.getTemplateCount();
        
        if (templateCount > this.config.maxTemplates) {
            console.log(`🧹 Cleanup needed: ${templateCount}/${this.config.maxTemplates} templates`);
            await this._performCleanup();
        }
    }

    /**
     * Realizar limpieza de templates antiguos
     */
    async _performCleanup() {
        try {
            const templates = await this._loadAllTemplates();
            
            // Ordenar por fecha de actualización (más antiguos primero)
            templates.sort((a, b) => {
                const aDate = new Date(a.metadata?.updatedAt || 0);
                const bDate = new Date(b.metadata?.updatedAt || 0);
                return aDate - bDate;
            });
            
            // Calcular cuántos eliminar
            const excess = templates.length - this.config.maxTemplates;
            const toDelete = templates.slice(0, excess);
            
            // Eliminar templates antiguos
            for (const template of toDelete) {
                await this.deleteTemplate(template.name);
            }
            
            console.log(`🧹 Cleaned up ${toDelete.length} old templates`);
            
        } catch (error) {
            console.error('❌ Error during cleanup:', error);
        }
    }

    /**
     * Optimizar almacenamiento
     */
    async optimize() {
        try {
            console.log('🔧 Optimizing template storage...');
            
            // Limpiar cache
            this.cache.clear();
            this.metadata.clear();
            
            // Recargar metadata
            await this._loadMetadata();
            
            // Verificar integridad
            await this._verifyIntegrity();
            
            // Comprimir si es compatible
            if (this.config.compressionEnabled) {
                await this._compressTemplates();
            }
            
            console.log('✅ Storage optimization completed');
            
        } catch (error) {
            console.error('❌ Error during optimization:', error);
        }
    }

    // ===================================================================
    // MÉTODOS DE ALMACENAMIENTO ESPECÍFICOS
    // ===================================================================

    /**
     * Guardar template según el tipo de almacenamiento
     * @private
     */
    async _storeTemplate(template) {
        switch (this.config.storageType) {
            case 'indexedDB':
                return await this._storeInIndexedDB(template);
            case 'localStorage':
                return this._storeInLocalStorage(template);
            case 'memory':
                return this._storeInMemory(template);
            default:
                throw new Error(`Unsupported storage type: ${this.config.storageType}`);
        }
    }

    /**
     * Cargar template según el tipo de almacenamiento
     * @private
     */
    async _loadTemplate(name) {
        switch (this.config.storageType) {
            case 'indexedDB':
                return await this._loadFromIndexedDB(name);
            case 'localStorage':
                return this._loadFromLocalStorage(name);
            case 'memory':
                return this._loadFromMemory(name);
            default:
                return null;
        }
    }

    /**
     * Cargar todos los templates
     * @private
     */
    async _loadAllTemplates() {
        switch (this.config.storageType) {
            case 'indexedDB':
                return await this._loadAllFromIndexedDB();
            case 'localStorage':
                return this._loadAllFromLocalStorage();
            case 'memory':
                return this._loadAllFromMemory();
            default:
                return [];
        }
    }

    /**
     * Eliminar template del almacenamiento
     * @private
     */
    async _removeTemplate(name) {
        switch (this.config.storageType) {
            case 'indexedDB':
                return await this._removeFromIndexedDB(name);
            case 'localStorage':
                return this._removeFromLocalStorage(name);
            case 'memory':
                return this._removeFromMemory(name);
            default:
                return false;
        }
    }

    // ===================================================================
    // MÉTODOS INDEXEDDB
    // ===================================================================

    async _storeInIndexedDB(template) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['templates'], 'readwrite');
            const store = transaction.objectStore('templates');
            
            const request = store.put(template);
            request.onsuccess = () => resolve(template);
            request.onerror = () => reject(request.error);
        });
    }

    async _loadFromIndexedDB(name) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['templates'], 'readonly');
            const store = transaction.objectStore('templates');
            
            const request = store.get(name);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async _loadAllFromIndexedDB() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['templates'], 'readonly');
            const store = transaction.objectStore('templates');
            
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async _removeFromIndexedDB(name) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['templates'], 'readwrite');
            const store = transaction.objectStore('templates');
            
            const request = store.delete(name);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // ===================================================================
    // MÉTODOS LOCALSTORAGE
    // ===================================================================

    _storeInLocalStorage(template) {
        const key = this.config.prefix + template.name;
        const data = JSON.stringify(template);
        
        try {
            this.storage.setItem(key, data);
            return template;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                throw new Error('Storage quota exceeded. Consider enabling cleanup or using IndexedDB.');
            }
            throw error;
        }
    }

    _loadFromLocalStorage(name) {
        const key = this.config.prefix + name;
        
        try {
            const data = this.storage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Error parsing template ${name}:`, error);
            return null;
        }
    }

    _loadAllFromLocalStorage() {
        const templates = [];
        const prefix = this.config.prefix;
        
        try {
            for (let i = 0; i < this.storage.length; i++) {
                const key = this.storage.key(i);
                if (key && key.startsWith(prefix)) {
                    const data = this.storage.getItem(key);
                    if (data) {
                        try {
                            const template = JSON.parse(data);
                            templates.push(template);
                        } catch (error) {
                            console.error(`Error parsing template at key ${key}:`, error);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading templates from localStorage:', error);
        }
        
        return templates;
    }

    _removeFromLocalStorage(name) {
        const key = this.config.prefix + name;
        
        try {
            this.storage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing template ${name}:`, error);
            return false;
        }
    }

    // ===================================================================
    // MÉTODOS MEMORY STORAGE
    // ===================================================================

    _storeInMemory(template) {
        this.memoryStore.templates.set(template.name, template);
        return template;
    }

    _loadFromMemory(name) {
        return this.memoryStore.templates.get(name) || null;
    }

    _loadAllFromMemory() {
        return Array.from(this.memoryStore.templates.values());
    }

    _removeFromMemory(name) {
        return this.memoryStore.templates.delete(name);
    }

    // ===================================================================
    // VERSIONADO (MÉTODOS PRIVADOS)
    // ===================================================================

    async _saveVersion(templateName, template) {
        const versionData = {
            templateName,
            version: template.metadata?.version || '1.0.0',
            content: template.content,
            metadata: { ...template.metadata },
            savedAt: new Date().toISOString()
        };

        switch (this.config.storageType) {
            case 'indexedDB':
                return await this._saveVersionIndexedDB(versionData);
            case 'localStorage':
                return this._saveVersionLocalStorage(versionData);
            case 'memory':
                return this._saveVersionMemory(versionData);
        }
    }

    async _loadVersions(templateName) {
        switch (this.config.storageType) {
            case 'indexedDB':
                return await this._loadVersionsIndexedDB(templateName);
            case 'localStorage':
                return this._loadVersionsLocalStorage(templateName);
            case 'memory':
                return this._loadVersionsMemory(templateName);
            default:
                return [];
        }
    }

    async _loadVersion(templateName, version) {
        const versions = await this._loadVersions(templateName);
        return versions.find(v => v.version === version);
    }

    async _deleteVersions(templateName) {
        const versions = await this._loadVersions(templateName);
        
        for (const version of versions) {
            switch (this.config.storageType) {
                case 'indexedDB':
                    await this._deleteVersionIndexedDB(templateName, version.version);
                    break;
                case 'localStorage':
                    this._deleteVersionLocalStorage(templateName, version.version);
                    break;
                case 'memory':
                    this._deleteVersionMemory(templateName, version.version);
                    break;
            }
        }
    }

    // ===================================================================
    // UTILIDADES
    // ===================================================================

    /**
     * Generar nueva versión
     * @private
     */
    _generateVersion(existingTemplate) {
        if (!existingTemplate || !existingTemplate.metadata?.version) {
            return '1.0.0';
        }

        const [major, minor, patch] = existingTemplate.metadata.version.split('.').map(Number);
        return `${major}.${minor}.${patch + 1}`;
    }

    /**
     * Obtener valor anidado de objeto
     * @private
     */
    _getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * Calcular tamaño total
     * @private
     */
    async _calculateTotalSize() {
        try {
            const templates = await this._loadAllTemplates();
            return templates.reduce((total, template) => {
                return total + (template.metadata?.size || 0);
            }, 0);
        } catch (error) {
            return 0;
        }
    }

    /**
     * Cargar metadata del sistema
     * @private
     */
    async _loadMetadata() {
        try {
            const templates = await this._loadAllTemplates();
            templates.forEach(template => {
                this.metadata.set(template.name, template.metadata);
            });
        } catch (error) {
            console.error('Error loading metadata:', error);
        }
    }

    /**
     * Verificar integridad de datos
     * @private
     */
    async _verifyIntegrity() {
        const templates = await this._loadAllTemplates();
        const issues = [];

        templates.forEach(template => {
            // Verificar estructura básica
            if (!template.name || !template.content) {
                issues.push(`Template missing required fields: ${template.name || 'unknown'}`);
            }

            // Verificar metadata
            if (!template.metadata || !template.metadata.updatedAt) {
                issues.push(`Template missing metadata: ${template.name}`);
            }

            // Verificar tamaño
            const actualSize = template.content.length;
            const reportedSize = template.metadata?.size;
            if (reportedSize && Math.abs(actualSize - reportedSize) > 100) {
                issues.push(`Size mismatch for ${template.name}: ${actualSize} vs ${reportedSize}`);
            }
        });

        if (issues.length > 0) {
            console.warn('🚨 Integrity issues found:', issues);
        }

        return issues;
    }

    /**
     * Crear backup de template
     * @private
     */
    async _createBackup(name, template) {
        const backupKey = `${this.config.prefix}backup_${name}_${Date.now()}`;
        const backupData = {
            ...template,
            backupCreatedAt: new Date().toISOString(),
            originalName: name
        };

        try {
            if (this.config.storageType === 'localStorage') {
                this.storage.setItem(backupKey, JSON.stringify(backupData));
            }
            // Para otros tipos de almacenamiento, implementar según necesidad
        } catch (error) {
            console.warn(`Warning: Could not create backup for ${name}:`, error);
        }
    }

    /**
     * Comprimir templates (si está habilitado)
     * @private
     */
    async _compressTemplates() {
        // Implementar compresión si es necesario
        // Por ahora es placeholder
        console.log('🗜️ Template compression not yet implemented');
    }

    // ===================================================================
    // MÉTODOS DE VERSIONADO ESPECÍFICOS POR STORAGE
    // ===================================================================

    // IndexedDB Versioning
    async _saveVersionIndexedDB(versionData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['versions'], 'readwrite');
            const store = transaction.objectStore('versions');
            
            const request = store.put(versionData);
            request.onsuccess = () => resolve(versionData);
            request.onerror = () => reject(request.error);
        });
    }

    async _loadVersionsIndexedDB(templateName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['versions'], 'readonly');
            const store = transaction.objectStore('versions');
            const index = store.index('templateName');
            
            const request = index.getAll(templateName);
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async _deleteVersionIndexedDB(templateName, version) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['versions'], 'readwrite');
            const store = transaction.objectStore('versions');
            
            const request = store.delete([templateName, version]);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // localStorage Versioning
    _saveVersionLocalStorage(versionData) {
        const key = `${this.config.prefix}version_${versionData.templateName}_${versionData.version}`;
        this.storage.setItem(key, JSON.stringify(versionData));
        return versionData;
    }

    _loadVersionsLocalStorage(templateName) {
        const versions = [];
        const versionPrefix = `${this.config.prefix}version_${templateName}_`;
        
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            if (key && key.startsWith(versionPrefix)) {
                try {
                    const data = this.storage.getItem(key);
                    const version = JSON.parse(data);
                    versions.push(version);
                } catch (error) {
                    console.error(`Error parsing version data for key ${key}:`, error);
                }
            }
        }
        
        return versions;
    }

    _deleteVersionLocalStorage(templateName, version) {
        const key = `${this.config.prefix}version_${templateName}_${version}`;
        this.storage.removeItem(key);
    }

    // Memory Versioning
    _saveVersionMemory(versionData) {
        if (!this.memoryStore.versions.has(versionData.templateName)) {
            this.memoryStore.versions.set(versionData.templateName, []);
        }
        this.memoryStore.versions.get(versionData.templateName).push(versionData);
        return versionData;
    }

    _loadVersionsMemory(templateName) {
        return this.memoryStore.versions.get(templateName) || [];
    }

    _deleteVersionMemory(templateName, version) {
        const versions = this.memoryStore.versions.get(templateName) || [];
        const filtered = versions.filter(v => v.version !== version);
        this.memoryStore.versions.set(templateName, filtered);
    }

    // ===================================================================
    // IMPORTAR/EXPORTAR
    // ===================================================================

    /**
     * Exportar templates
     */
    async exportTemplates(templateNames = null) {
        try {
            let templates = await this._loadAllTemplates();
            
            if (templateNames) {
                templates = templates.filter(t => templateNames.includes(t.name));
            }
            
            const exportData = {
                version: '1.0.0',
                exportedAt: new Date().toISOString(),
                templateCount: templates.length,
                templates: templates
            };
            
            return exportData;
            
        } catch (error) {
            console.error('❌ Error exporting templates:', error);
            throw error;
        }
    }

    /**
     * Importar templates
     */
    async importTemplates(importData, options = {}) {
        const {
            overwrite = false,
            prefix = '',
            validateBeforeImport = true
        } = options;
        
        try {
            if (!importData || !importData.templates) {
                throw new Error('Invalid import data format');
            }
            
            const results = {
                imported: 0,
                skipped: 0,
                errors: []
            };
            
            for (const template of importData.templates) {
                try {
                    // Añadir prefijo si se especifica
                    const templateName = prefix + template.name;
                    
                    // Verificar si ya existe
                    const existing = await this.getTemplate(templateName);
                    if (existing && !overwrite) {
                        results.skipped++;
                        continue;
                    }
                    
                    // Validar si es necesario
                    if (validateBeforeImport && window.pluginManager?.get('templates')?.validateTemplate) {
                        const validation = await window.pluginManager.get('templates').validateTemplate(template.content);
                        if (!validation.isValid) {
                            results.errors.push(`Validation failed for ${templateName}: ${validation.errors.join(', ')}`);
                            continue;
                        }
                    }
                    
                    // Importar template
                    await this.saveTemplate(templateName, {
                        content: template.content,
                        metadata: {
                            ...template.metadata,
                            importedAt: new Date().toISOString(),
                            originalName: template.name
                        }
                    });
                    
                    results.imported++;
                    
                } catch (error) {
                    results.errors.push(`Error importing ${template.name}: ${error.message}`);
                }
            }
            
            console.log(`📥 Import completed: ${results.imported} imported, ${results.skipped} skipped, ${results.errors.length} errors`);
            return results;
            
        } catch (error) {
            console.error('❌ Error importing templates:', error);
            throw error;
        }
    }

    // ===================================================================
    // CLEANUP
    // ===================================================================

    /**
     * Limpiar recursos
     */
    async cleanup() {
        try {
            // Limpiar cache
            this.cache.clear();
            this.metadata.clear();
            
            // Cerrar conexión IndexedDB si existe
            if (this.db) {
                this.db.close();
                this.db = null;
            }
            
            // Limpiar memoria
            if (this.memoryStore) {
                this.memoryStore.templates.clear();
                this.memoryStore.versions.clear();
                this.memoryStore.metadata.clear();
            }
            
            // Reset estadísticas
            this.stats = {
                templatesStored: 0,
                totalSize: 0,
                cacheHits: 0,
                cacheMisses: 0,
                lastOperation: null
            };
            
            console.log('🧹 TemplateStorage cleaned up');
            
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
}

// ===================================================================
// UTILIDADES EXPORTABLES
// ===================================================================

/**
 * Crear instancia de storage con configuración
 */
export const createTemplateStorage = (options) => {
    return new TemplateStorage(options);
};

/**
 * Verificar disponibilidad de storage
 */
export const checkStorageAvailability = () => {
    const availability = {
        localStorage: false,
        indexedDB: false,
        memory: true // Siempre disponible
    };

    // Verificar localStorage
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            availability.localStorage = true;
        }
    } catch (error) {
        // localStorage no disponible
    }

    // Verificar IndexedDB
    try {
        if (typeof indexedDB !== 'undefined') {
            availability.indexedDB = true;
        }
    } catch (error) {
        // IndexedDB no disponible
    }

    return availability;
};

/**
 * Obtener tipo de storage recomendado
 */
export const getRecommendedStorageType = () => {
    const availability = checkStorageAvailability();
    
    if (availability.indexedDB) {
        return 'indexedDB'; // Mejor para grandes volúmenes de datos
    } else if (availability.localStorage) {
        return 'localStorage'; // Bueno para datos pequeños
    } else {
        return 'memory'; // Fallback
    }
};

// ===================================================================
// DEBUGGING EN DESARROLLO
// ===================================================================

if (process.env.NODE_ENV === 'development') {
    window.TemplateStorage = TemplateStorage;
    window.templateStorageUtils = {
        createTemplateStorage,
        checkStorageAvailability,
        getRecommendedStorageType
    };
    
    console.log('🔧 TemplateStorage exposed to window for debugging');
}
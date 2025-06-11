// ===================================================================
// plugins/variables/providers.js
// Responsabilidad: Proveedores dinámicos de variables
// ===================================================================

/**
 * Clase base para proveedores de variables
 */
export class VariableProvider {
    constructor(name, config = {}) {
        this.name = name;
        this.title = config.title || name;
        this.description = config.description || '';
        this.category = config.category || 'custom';
        this.priority = config.priority || 50;
        this.lastUpdated = new Date().toISOString();
        
        // Configuración del provider
        this.config = {
            cacheable: true,
            refreshable: false,
            autoRefresh: false,
            refreshInterval: 60000, // 1 minuto
            ...config
        };
        
        // Estado interno
        this._variables = {};
        this._refreshTimer = null;
        
        console.log(`📦 VariableProvider created: ${this.name}`);
    }

    /**
     * Método abstracto - debe ser implementado por subclases
     * @returns {Object} Variables en formato { path: value }
     */
    getVariables() {
        return this._variables;
    }

    /**
     * Método para actualizar variables (opcional)
     */
    async refresh() {
        if (this.config.refreshable) {
            console.log(`🔄 Refreshing provider: ${this.name}`);
            this.lastUpdated = new Date().toISOString();
        }
    }

    /**
     * Configurar auto-refresh si está habilitado
     */
    startAutoRefresh() {
        if (this.config.autoRefresh && this.config.refreshable) {
            this._refreshTimer = setInterval(async () => {
                await this.refresh();
            }, this.config.refreshInterval);
            
            console.log(`⏰ Auto-refresh started for ${this.name}: ${this.config.refreshInterval}ms`);
        }
    }

    /**
     * Detener auto-refresh
     */
    stopAutoRefresh() {
        if (this._refreshTimer) {
            clearInterval(this._refreshTimer);
            this._refreshTimer = null;
            console.log(`⏰ Auto-refresh stopped for ${this.name}`);
        }
    }

    /**
     * Verificar si una variable existe en este provider
     */
    hasVariable(path) {
        return this.getVariables().hasOwnProperty(path);
    }

    /**
     * Obtener valor de variable específica
     */
    getVariable(path) {
        return this.getVariables()[path] || null;
    }

    /**
     * Obtener información de debug
     */
    getDebugInfo() {
        return {
            name: this.name,
            title: this.title,
            category: this.category,
            priority: this.priority,
            lastUpdated: this.lastUpdated,
            variableCount: Object.keys(this.getVariables()).length,
            config: this.config
        };
    }

    /**
     * Cleanup del provider
     */
    async cleanup() {
        this.stopAutoRefresh();
        this._variables = {};
        console.log(`🧹 Provider cleaned up: ${this.name}`);
    }
}

// ===================================================================
// PROVIDER DEL SISTEMA
// ===================================================================

class SystemVariableProvider extends VariableProvider {
    constructor() {
        super('system', {
            title: '⚙️ Sistema',
            description: 'Variables del sistema y aplicación',
            category: 'core',
            priority: 100,
            refreshable: true,
            autoRefresh: true,
            refreshInterval: 30000 // 30 segundos para tiempo actual
        });
    }

    getVariables() {
        const now = new Date();
        
        return {
            'app.name': 'Page Builder',
            'app.version': '2.0.0-plugins',
            'app.environment': process.env.NODE_ENV || 'development',
            'current.time': now.toLocaleTimeString('es-ES'),
            'current.date': now.toLocaleDateString('es-ES'),
            'current.datetime': now.toLocaleString('es-ES'),
            'current.year': now.getFullYear(),
            'current.month': now.toLocaleDateString('es-ES', { month: 'long' }),
            'current.day': now.getDate(),
            'current.weekday': now.toLocaleDateString('es-ES', { weekday: 'long' }),
            'current.timestamp': now.getTime(),
            'current.iso': now.toISOString(),
            'system.timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
            'system.language': navigator.language || 'es-ES',
            'system.platform': navigator.platform,
            'system.userAgent': navigator.userAgent.substring(0, 50) + '...'
        };
    }

    async refresh() {
        await super.refresh();
        // Las variables del sistema se actualizan automáticamente
        // porque se calculan dinámicamente en getVariables()
    }
}

// ===================================================================
// PROVIDER DEL USUARIO
// ===================================================================

class UserVariableProvider extends VariableProvider {
    constructor() {
        super('user', {
            title: '👤 Usuario',
            description: 'Información del usuario actual',
            category: 'user',
            priority: 95,
            refreshable: true
        });
        
        // Cargar datos iniciales
        this._loadUserData();
    }

    getVariables() {
        return this._variables;
    }

    async refresh() {
        await super.refresh();
        this._loadUserData();
    }

    /**
     * Cargar datos del usuario desde window.initialData o API
     * @private
     */
    _loadUserData() {
        const userData = window.initialData?.user || {};
        
        this._variables = {
            'user.id': userData.id || 1,
            'user.name': userData.name || 'Usuario Demo',
            'user.email': userData.email || 'usuario@demo.com',
            'user.role': userData.role || 'user',
            'user.avatar': userData.avatar || '👤',
            'user.firstName': userData.firstName || userData.name?.split(' ')[0] || 'Usuario',
            'user.lastName': userData.lastName || userData.name?.split(' ').slice(1).join(' ') || 'Demo',
            'user.initials': this._getInitials(userData.name || 'Usuario Demo'),
            'user.isAdmin': userData.role === 'admin',
            'user.isLoggedIn': !!userData.id,
            'user.registeredAt': userData.registeredAt || new Date().toISOString(),
            'user.lastLogin': userData.lastLogin || new Date().toISOString()
        };
    }

    /**
     * Obtener iniciales del nombre
     * @private
     */
    _getInitials(name) {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    /**
     * Actualizar datos del usuario (para uso externo)
     */
    updateUserData(newUserData) {
        if (window.initialData) {
            window.initialData.user = { ...window.initialData.user, ...newUserData };
        }
        this._loadUserData();
        console.log('👤 User data updated');
    }
}

// ===================================================================
// PROVIDER DEL SITIO
// ===================================================================

class SiteVariableProvider extends VariableProvider {
    constructor() {
        super('site', {
            title: '🎨 Sitio',
            description: 'Información del sitio web',
            category: 'site',
            priority: 80,
            refreshable: false // Datos del sitio raramente cambian
        });
        
        this._loadSiteData();
    }

    getVariables() {
        return this._variables;
    }

    /**
     * Cargar datos del sitio
     * @private
     */
    _loadSiteData() {
        const siteData = window.initialData?.site || {};
        
        this._variables = {
            'site.title': siteData.title || 'Mi Sitio Web',
            'site.description': siteData.description || 'Descripción de mi sitio web',
            'site.keywords': siteData.keywords || 'página, web, sitio',
            'site.author': siteData.author || 'Autor del sitio',
            'site.url': window.location.origin,
            'site.domain': window.location.hostname,
            'site.protocol': window.location.protocol,
            'site.path': window.location.pathname,
            'site.fullUrl': window.location.href,
            'site.language': siteData.language || document.documentElement.lang || 'es',
            'site.charset': document.characterSet || 'UTF-8',
            'site.viewport': this._getViewportSize(),
            'site.theme': siteData.theme || this._detectTheme(),
            'site.version': siteData.version || '1.0.0',
            'site.lastUpdate': siteData.lastUpdate || new Date().toISOString()
        };
    }

    /**
     * Obtener tamaño del viewport
     * @private
     */
    _getViewportSize() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            ratio: Math.round((window.innerWidth / window.innerHeight) * 100) / 100
        };
    }

    /**
     * Detectar tema actual
     * @private
     */
    _detectTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    /**
     * Actualizar datos del sitio
     */
    updateSiteData(newSiteData) {
        if (window.initialData) {
            window.initialData.site = { ...window.initialData.site, ...newSiteData };
        }
        this._loadSiteData();
        console.log('🎨 Site data updated');
    }
}

// ===================================================================
// PROVIDER DE TEMPLATES
// ===================================================================

class TemplatesVariableProvider extends VariableProvider {
    constructor() {
        super('templates', {
            title: '📝 Templates',
            description: 'Información sobre templates disponibles',
            category: 'content',
            priority: 70,
            refreshable: true
        });
        
        this._loadTemplatesData();
    }

    getVariables() {
        return this._variables;
    }

    async refresh() {
        await super.refresh();
        this._loadTemplatesData();
    }

    /**
     * Cargar datos de templates
     * @private
     */
    _loadTemplatesData() {
        const templatesData = window.initialData?.templates || [];
        
        this._variables = {
            'templates.count': templatesData.length,
            'templates.total': templatesData.length,
            'templates.latest': templatesData[0]?.name || 'Sin templates',
            'templates.latestDate': templatesData[0]?.updatedAt || new Date().toISOString(),
            'templates.oldest': templatesData[templatesData.length - 1]?.name || 'Sin templates',
            'templates.categories': this._getTemplateCategories(templatesData),
            'templates.averageSize': this._getAverageTemplateSize(templatesData),
            'templates.lastUpdate': new Date().toISOString()
        };

        // Añadir variables individuales para templates recientes
        templatesData.slice(0, 5).forEach((template, index) => {
            this._variables[`templates.recent.${index + 1}.name`] = template.name;
            this._variables[`templates.recent.${index + 1}.date`] = template.updatedAt;
        });
    }

    /**
     * Obtener categorías de templates
     * @private
     */
    _getTemplateCategories(templates) {
        const categories = [...new Set(templates.map(t => t.category || 'general'))];
        return categories.join(', ');
    }

    /**
     * Obtener tamaño promedio de templates
     * @private
     */
    _getAverageTemplateSize(templates) {
        if (templates.length === 0) return 0;
        
        const totalSize = templates.reduce((sum, t) => sum + (t.size || 0), 0);
        return Math.round(totalSize / templates.length);
    }

    /**
     * Actualizar datos de templates
     */
    updateTemplatesData(newTemplatesData) {
        if (window.initialData) {
            window.initialData.templates = newTemplatesData;
        }
        this._loadTemplatesData();
        console.log('📝 Templates data updated');
    }
}

// ===================================================================
// PROVIDER PERSONALIZADO PARA APIS EXTERNAS
// ===================================================================

export class ApiVariableProvider extends VariableProvider {
    constructor(name, config = {}) {
        super(name, {
            ...config,
            refreshable: true,
            autoRefresh: config.autoRefresh || false,
            refreshInterval: config.refreshInterval || 300000 // 5 minutos por defecto
        });
        
        this.apiUrl = config.apiUrl;
        this.apiKey = config.apiKey;
        this.transform = config.transform || (data => data);
        
        if (!this.apiUrl) {
            throw new Error('ApiVariableProvider requires apiUrl');
        }
        
        // Cargar datos iniciales
        this.refresh();
    }

    async refresh() {
        try {
            console.log(`🌐 Fetching data from API: ${this.apiUrl}`);
            
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (this.apiKey) {
                headers['Authorization'] = `Bearer ${this.apiKey}`;
            }
            
            const response = await fetch(this.apiUrl, { headers });
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }
            
            const data = await response.json();
            this._variables = this.transform(data);
            
            await super.refresh();
            console.log(`✅ API data loaded for provider: ${this.name}`);
            
        } catch (error) {
            console.error(`❌ Error fetching API data for ${this.name}:`, error);
            // Mantener variables existentes en caso de error
        }
    }
}

// ===================================================================
// PROVIDER PARA VARIABLES LOCALES/CUSTOM
// ===================================================================

export class CustomVariableProvider extends VariableProvider {
    constructor(name, variables = {}, config = {}) {
        super(name, {
            title: config.title || `Custom: ${name}`,
            description: config.description || 'Variables personalizadas',
            category: 'custom',
            priority: config.priority || 50,
            ...config
        });
        
        this._variables = { ...variables };
    }

    /**
     * Añadir nueva variable
     */
    addVariable(path, value) {
        this._variables[path] = value;
        this.lastUpdated = new Date().toISOString();
        console.log(`➕ Variable added to ${this.name}: ${path}`);
    }

    /**
     * Remover variable
     */
    removeVariable(path) {
        delete this._variables[path];
        this.lastUpdated = new Date().toISOString();
        console.log(`➖ Variable removed from ${this.name}: ${path}`);
    }

    /**
     * Actualizar múltiples variables
     */
    updateVariables(newVariables) {
        this._variables = { ...this._variables, ...newVariables };
        this.lastUpdated = new Date().toISOString();
        console.log(`🔄 Variables updated in ${this.name}`);
    }

    /**
     * Limpiar todas las variables
     */
    clearVariables() {
        this._variables = {};
        this.lastUpdated = new Date().toISOString();
        console.log(`🧹 Variables cleared in ${this.name}`);
    }
}

// ===================================================================
// INSTANCIAS DE PROVIDERS POR DEFECTO
// ===================================================================

export const SystemProvider = new SystemVariableProvider();
export const UserProvider = new UserVariableProvider();
export const SiteProvider = new SiteVariableProvider();
export const TemplatesProvider = new TemplatesVariableProvider();

// ===================================================================
// FUNCIONES DE UTILIDAD
// ===================================================================

/**
 * Crear provider personalizado rápidamente
 */
export const createCustomProvider = (name, variables, config = {}) => {
    return new CustomVariableProvider(name, variables, config);
};

/**
 * Crear provider API rápidamente
 */
export const createApiProvider = (name, apiUrl, config = {}) => {
    return new ApiVariableProvider(name, { ...config, apiUrl });
};

/**
 * Obtener provider por tipo
 */
export const getProviderByCategory = (category) => {
    const providers = [SystemProvider, UserProvider, SiteProvider, TemplatesProvider];
    return providers.find(p => p.category === category);
};

// ===================================================================
// DEBUGGING EN DESARROLLO
// ===================================================================

if (process.env.NODE_ENV === 'development') {
    // Exponer providers para debugging
    window.variableProviders = {
        SystemProvider,
        UserProvider,
        SiteProvider,
        TemplatesProvider,
        VariableProvider,
        ApiVariableProvider,
        CustomVariableProvider
    };
    
    console.log('🔧 Variable providers exposed to window for debugging');
}
// ===================================================================
// services/api.js
// Responsabilidad: SOLO manejo de HTTP requests
// ===================================================================

/**
 * Configuración base para todas las APIs
 */
const API_CONFIG = {
    baseURL: '/api',
    timeout: 10000, // 10 segundos
    retries: 3,
    retryDelay: 1000 // 1 segundo
};

/**
 * Obtiene headers por defecto para las requests
 * @returns {Object} Headers object
 */
const getDefaultHeaders = () => {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    
    // Agregar CSRF token si existe
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
    if (csrfToken) {
        headers['X-CSRF-TOKEN'] = csrfToken;
    }
    
    // Agregar auth token si existe
    const authToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    return headers;
};

/**
 * Maneja errores de respuesta HTTP
 * @param {Response} response - Response object
 * @param {Object} data - Parsed response data
 * @throws {Error} Error con mensaje descriptivo
 */
const handleResponseError = async (response, data) => {
    let errorMessage = `HTTP ${response.status}`;
    
    // Mapear códigos de estado comunes
    switch (response.status) {
        case 400:
            errorMessage = data?.message || 'Solicitud inválida';
            break;
        case 401:
            errorMessage = 'No autorizado - Inicia sesión nuevamente';
            // Opcional: redirigir al login
            break;
        case 403:
            errorMessage = 'Acceso denegado';
            break;
        case 404:
            errorMessage = 'Recurso no encontrado';
            break;
        case 422:
            errorMessage = data?.message || 'Datos de validación incorrectos';
            break;
        case 429:
            errorMessage = 'Demasiadas solicitudes - Intenta más tarde';
            break;
        case 500:
            errorMessage = 'Error interno del servidor';
            break;
        case 502:
        case 503:
        case 504:
            errorMessage = 'Servidor no disponible temporalmente';
            break;
        default:
            errorMessage = data?.message || data?.error || errorMessage;
    }
    
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    
    throw error;
};

/**
 * Función de delay para retry
 * @param {number} ms - Milisegundos a esperar
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Cliente HTTP base con retry automático
 * @param {string} endpoint - Endpoint relativo (ej: '/templates')
 * @param {Object} options - Opciones de fetch
 * @returns {Promise<Object>} Response data
 */
export const apiCall = async (endpoint, options = {}) => {
    const url = `${API_CONFIG.baseURL}${endpoint}`;
    const maxRetries = options.retries ?? API_CONFIG.retries;
    let lastError;
    
    // Configurar options por defecto
    const defaultOptions = {
        method: 'GET',
        headers: getDefaultHeaders(),
        timeout: API_CONFIG.timeout
    };
    
    // Merge options
    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    // Intentar la request con retry
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🌐 API [${finalOptions.method}] ${endpoint} (intento ${attempt + 1})`);
            
            // Crear AbortController para timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), finalOptions.timeout);
            
            const response = await fetch(url, {
                ...finalOptions,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // Parsear respuesta
            let data;
            try {
                const text = await response.text();
                data = text ? JSON.parse(text) : {};
            } catch (parseError) {
                console.warn('Error parsing JSON response:', parseError);
                data = {};
            }
            
            // Verificar si la respuesta es exitosa
            if (!response.ok) {
                await handleResponseError(response, data);
            }
            
            console.log(`✅ API Success [${finalOptions.method}] ${endpoint}`);
            return data;
            
        } catch (error) {
            lastError = error;
            
            // No reintentar para ciertos errores
            if (error.name === 'AbortError') {
                throw new Error('Timeout: La solicitud tardó demasiado');
            }
            
            if (error.status && error.status >= 400 && error.status < 500) {
                // Errores 4xx no se reintentán (errores del cliente)
                throw error;
            }
            
            // Si no es el último intento, esperar antes de reintentar
            if (attempt < maxRetries) {
                const delayTime = API_CONFIG.retryDelay * Math.pow(2, attempt); // Exponential backoff
                console.warn(`⚠️ API Error [${finalOptions.method}] ${endpoint} - Reintentando en ${delayTime}ms`);
                await delay(delayTime);
            }
        }
    }
    
    // Si llegamos aquí, se agotaron los reintentos
    console.error(`❌ API Failed [${finalOptions.method}] ${endpoint} después de ${maxRetries + 1} intentos`);
    throw lastError;
};

// ===================================================================
// MÉTODOS HTTP CONVENIENTES
// ===================================================================

/**
 * GET request
 * @param {string} endpoint - Endpoint
 * @param {Object} params - Query parameters
 * @param {Object} options - Opciones adicionales
 */
export const get = async (endpoint, params = {}, options = {}) => {
    // Agregar query parameters
    const url = new URL(endpoint, API_CONFIG.baseURL);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.append(key, value);
        }
    });
    
    return apiCall(url.pathname + url.search, {
        method: 'GET',
        ...options
    });
};

/**
 * POST request
 * @param {string} endpoint - Endpoint
 * @param {Object} data - Data to send
 * @param {Object} options - Opciones adicionales
 */
export const post = async (endpoint, data = {}, options = {}) => {
    return apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
        ...options
    });
};

/**
 * PUT request
 * @param {string} endpoint - Endpoint
 * @param {Object} data - Data to send
 * @param {Object} options - Opciones adicionales
 */
export const put = async (endpoint, data = {}, options = {}) => {
    return apiCall(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
        ...options
    });
};

/**
 * PATCH request
 * @param {string} endpoint - Endpoint
 * @param {Object} data - Data to send
 * @param {Object} options - Opciones adicionales
 */
export const patch = async (endpoint, data = {}, options = {}) => {
    return apiCall(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(data),
        ...options
    });
};

/**
 * DELETE request
 * @param {string} endpoint - Endpoint
 * @param {Object} options - Opciones adicionales
 */
export const del = async (endpoint, options = {}) => {
    return apiCall(endpoint, {
        method: 'DELETE',
        ...options
    });
};

// ===================================================================
// UTILIDADES DE UPLOAD
// ===================================================================

/**
 * Upload de archivo
 * @param {string} endpoint - Endpoint
 * @param {File|FormData} fileOrFormData - Archivo o FormData
 * @param {Object} options - Opciones adicionales
 */
export const upload = async (endpoint, fileOrFormData, options = {}) => {
    let body;
    let headers = { ...getDefaultHeaders() };
    
    // Eliminar Content-Type para FormData (browser lo setea automáticamente)
    delete headers['Content-Type'];
    
    if (fileOrFormData instanceof FormData) {
        body = fileOrFormData;
    } else if (fileOrFormData instanceof File) {
        body = new FormData();
        body.append('file', fileOrFormData);
    } else {
        throw new Error('Expected File or FormData');
    }
    
    return apiCall(endpoint, {
        method: 'POST',
        headers,
        body,
        ...options
    });
};

// ===================================================================
// DEBUGGING & MONITORING
// ===================================================================

/**
 * Configurar interceptor para debugging
 * @param {boolean} enabled - Activar debugging
 */
export const setDebugMode = (enabled = true) => {
    if (enabled) {
        console.log('🔧 API Debug Mode: ENABLED');
    }
    // En una implementación real, aquí podrías interceptar todas las requests
};

/**
 * Obtener estadísticas de API
 */
export const getApiStats = () => {
    // En una implementación real, aquí llevarías un contador de requests
    return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0
    };
};

// ===================================================================
// CONFIGURACIÓN Y SETUP
// ===================================================================

/**
 * Configurar cliente API
 * @param {Object} config - Nueva configuración
 */
export const configure = (config = {}) => {
    Object.assign(API_CONFIG, config);
    console.log('🔧 API Client configured:', API_CONFIG);
};

/**
 * Health check del API
 */
export const healthCheck = async () => {
    try {
        await get('/health');
        return { status: 'ok', timestamp: new Date().toISOString() };
    } catch (error) {
        return { status: 'error', error: error.message, timestamp: new Date().toISOString() };
    }
};

// Exportar configuración para lectura
export { API_CONFIG };

// ===================================================================
// AUTO-SETUP
// ===================================================================

// Setup automático en desarrollo
if (process.env.NODE_ENV === 'development') {
    setDebugMode(true);
}
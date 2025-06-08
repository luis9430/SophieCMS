// ===================================================================
// hooks/useAPI.js
// Responsabilidad: Estado y lógica de llamadas API
// ===================================================================

import { useState, useCallback, useRef } from 'preact/hooks';
import { apiCall, get, post, put, patch, del } from '../services/api.js';

/**
 * Hook para manejo completo de APIs con estado
 * @returns {Object} State y funciones para llamadas API
 */
export const useApi = () => {
    // ===================================================================
    // ESTADO
    // ===================================================================
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastResponse, setLastResponse] = useState(null);
    
    // Referencias para tracking
    const requestCountRef = useRef(0);
    const activeRequestsRef = useRef(new Set());
    
    // ===================================================================
    // FUNCIONES DE UTILIDAD
    // ===================================================================
    
    /**
     * Limpiar error
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);
    
    /**
     * Limpiar último response
     */
    const clearLastResponse = useCallback(() => {
        setLastResponse(null);
    }, []);
    
    /**
     * Reset completo del estado
     */
    const reset = useCallback(() => {
        setLoading(false);
        setError(null);
        setLastResponse(null);
    }, []);
    
    // ===================================================================
    // WRAPPER PARA LLAMADAS API
    // ===================================================================
    
    /**
     * Wrapper base para todas las llamadas API
     * @param {Function} apiFunction - Función API a ejecutar
     * @param {Array} args - Argumentos para la función
     * @param {Object} options - Opciones adicionales
     */
    const executeApiCall = useCallback(async (apiFunction, args = [], options = {}) => {
        const requestId = ++requestCountRef.current;
        activeRequestsRef.current.add(requestId);
        
        try {
            setLoading(true);
            setError(null);
            
            const response = await apiFunction(...args);
            
            setLastResponse({
                data: response,
                timestamp: new Date().toISOString(),
                requestId
            });
            
            return response;
            
        } catch (err) {
            const apiError = {
                message: err.message,
                status: err.status,
                data: err.data,
                timestamp: new Date().toISOString(),
                requestId
            };
            
            setError(apiError);
            
            // Re-throw error si no queremos que sea silencioso
            if (!options.silent) {
                throw err;
            }
            
            return null;
            
        } finally {
            activeRequestsRef.current.delete(requestId);
            
            // Solo quitar loading si no hay otras requests activas
            if (activeRequestsRef.current.size === 0) {
                setLoading(false);
            }
        }
    }, []);
    
    // ===================================================================
    // MÉTODOS HTTP ENVUELTOS
    // ===================================================================
    
    /**
     * GET request con estado
     */
    const apiGet = useCallback(async (endpoint, params = {}, options = {}) => {
        return executeApiCall(get, [endpoint, params, options.apiOptions], options);
    }, [executeApiCall]);
    
    /**
     * POST request con estado
     */
    const apiPost = useCallback(async (endpoint, data = {}, options = {}) => {
        return executeApiCall(post, [endpoint, data, options.apiOptions], options);
    }, [executeApiCall]);
    
    /**
     * PUT request con estado
     */
    const apiPut = useCallback(async (endpoint, data = {}, options = {}) => {
        return executeApiCall(put, [endpoint, data, options.apiOptions], options);
    }, [executeApiCall]);
    
    /**
     * PATCH request con estado
     */
    const apiPatch = useCallback(async (endpoint, data = {}, options = {}) => {
        return executeApiCall(patch, [endpoint, data, options.apiOptions], options);
    }, [executeApiCall]);
    
    /**
     * DELETE request con estado
     */
    const apiDelete = useCallback(async (endpoint, options = {}) => {
        return executeApiCall(del, [endpoint, options.apiOptions], options);
    }, [executeApiCall]);
    
    /**
     * Llamada API genérica con estado
     */
    const apiCallWithState = useCallback(async (endpoint, options = {}) => {
        return executeApiCall(apiCall, [endpoint, options.apiOptions], options);
    }, [executeApiCall]);
    
    // ===================================================================
    // FUNCIONES ESPECIALIZADAS
    // ===================================================================
    
    /**
     * Request con timeout personalizado
     */
    const apiWithTimeout = useCallback(async (apiFunction, args, timeoutMs = 5000) => {
        const controller = new AbortController();
        
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, timeoutMs);
        
        try {
            const options = args[args.length - 1] || {};
            options.signal = controller.signal;
            
            return await executeApiCall(apiFunction, args);
        } finally {
            clearTimeout(timeoutId);
        }
    }, [executeApiCall]);
    
    /**
     * Request con retry automático
     */
    const apiWithRetry = useCallback(async (apiFunction, args, maxRetries = 3) => {
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await executeApiCall(apiFunction, args, { silent: attempt < maxRetries });
            } catch (error) {
                lastError = error;
                
                if (attempt < maxRetries) {
                    // Esperar antes del siguiente intento (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
            }
        }
        
        throw lastError;
    }, [executeApiCall]);
    
    /**
     * Múltiples requests en paralelo
     */
    const apiParallel = useCallback(async (requests) => {
        const promises = requests.map(({ method, endpoint, data, options = {} }) => {
            switch (method.toLowerCase()) {
                case 'get':
                    return apiGet(endpoint, data, { ...options, silent: true });
                case 'post':
                    return apiPost(endpoint, data, { ...options, silent: true });
                case 'put':
                    return apiPut(endpoint, data, { ...options, silent: true });
                case 'patch':
                    return apiPatch(endpoint, data, { ...options, silent: true });
                case 'delete':
                    return apiDelete(endpoint, { ...options, silent: true });
                default:
                    throw new Error(`Método HTTP no soportado: ${method}`);
            }
        });
        
        try {
            setLoading(true);
            const results = await Promise.allSettled(promises);
            
            return results.map((result, index) => ({
                success: result.status === 'fulfilled',
                data: result.status === 'fulfilled' ? result.value : null,
                error: result.status === 'rejected' ? result.reason : null,
                request: requests[index]
            }));
            
        } finally {
            setLoading(false);
        }
    }, [apiGet, apiPost, apiPut, apiPatch, apiDelete]);
    
    // ===================================================================
    // INFORMACIÓN Y DEBUGGING
    // ===================================================================
    
    /**
     * Obtener estadísticas de requests
     */
    const getStats = useCallback(() => {
        return {
            totalRequests: requestCountRef.current,
            activeRequests: activeRequestsRef.current.size,
            isLoading: loading,
            hasError: !!error,
            lastRequestTime: lastResponse?.timestamp,
            errorCount: error ? 1 : 0 // En una impl real, mantener contador
        };
    }, [loading, error, lastResponse]);
    
    /**
     * Debug info completa
     */
    const getDebugInfo = useCallback(() => {
        return {
            stats: getStats(),
            state: {
                loading,
                error,
                lastResponse
            },
            activeRequests: Array.from(activeRequestsRef.current)
        };
    }, [getStats, loading, error, lastResponse]);
    
    // ===================================================================
    // RETURN OBJECT
    // ===================================================================
    
    return {
        // Estado
        loading,
        error,
        lastResponse,
        
        // Funciones básicas
        clearError,
        clearLastResponse,
        reset,
        
        // Métodos HTTP
        get: apiGet,
        post: apiPost,
        put: apiPut,
        patch: apiPatch,
        delete: apiDelete,
        call: apiCallWithState,
        
        // Funciones especializadas
        withTimeout: apiWithTimeout,
        withRetry: apiWithRetry,
        parallel: apiParallel,
        
        // Info y debugging
        getStats,
        getDebugInfo,
        
        // Estado computed
        isLoading: loading,
        hasError: !!error,
        hasActiveRequests: activeRequestsRef.current.size > 0
    };
};

// ===================================================================
// HOOK SIMPLIFICADO
// ===================================================================

/**
 * Hook simplificado solo con lo básico
 * @returns {Object} Funciones básicas de API
 */
export const useSimpleAPI = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const executeRequest = useCallback(async (apiFunction, ...args) => {
        try {
            setLoading(true);
            setError(null);
            return await apiFunction(...args);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);
    
    return {
        loading,
        error,
        execute: executeRequest,
        clearError: () => setError(null)
    };
};

export default useApi;
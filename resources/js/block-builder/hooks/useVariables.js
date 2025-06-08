// ===================================================================
// hooks/useVariables.js
// Responsabilidad: Estado y lógica de variables
// ===================================================================

import { useState, useCallback, useMemo } from 'preact/hooks';
import { 
    getAvailableVariables, 
    processVariables, 
    extractVariables, 
    validateVariable,
    formatVariableForInsertion,
    findInvalidVariables 
} from '../utils/variableProcessor.js';

/**
 * Hook para manejo completo de variables
 * @returns {Object} State y funciones para manejo de variables
 */
export const useVariables = () => {
    // ===================================================================
    // ESTADO
    // ===================================================================
    
    const [showVariablesPanel, setShowVariablesPanel] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        user: true,
        system: false,
        templates: false,
        site: false
    });
    const [searchTerm, setSearchTerm] = useState('');
    
    // ===================================================================
    // COMPUTED VALUES (Memoized)
    // ===================================================================
    
    // Variables disponibles (memoized para evitar recálculos)
    const availableVariables = useMemo(() => {
        return getAvailableVariables();
    }, []); // Se recalcula solo al cambiar dependencias externas
    
    // Variables filtradas por búsqueda
    const filteredVariables = useMemo(() => {
        if (!searchTerm.trim()) {
            return availableVariables;
        }
        
        const filtered = {};
        const searchLower = searchTerm.toLowerCase();
        
        Object.entries(availableVariables).forEach(([categoryKey, category]) => {
            const matchingVars = {};
            
            Object.entries(category.variables).forEach(([path, value]) => {
                const pathMatches = path.toLowerCase().includes(searchLower);
                const valueMatches = String(value).toLowerCase().includes(searchLower);
                
                if (pathMatches || valueMatches) {
                    matchingVars[path] = value;
                }
            });
            
            if (Object.keys(matchingVars).length > 0) {
                filtered[categoryKey] = {
                    ...category,
                    variables: matchingVars
                };
            }
        });
        
        return filtered;
    }, [availableVariables, searchTerm]);
    
    // Estadísticas de variables
    const variableStats = useMemo(() => {
        const totalCount = Object.values(availableVariables).reduce(
            (sum, category) => sum + Object.keys(category.variables).length, 
            0
        );
        
        const categoriesCount = Object.keys(availableVariables).length;
        
        return {
            total: totalCount,
            categories: categoriesCount,
            filtered: Object.values(filteredVariables).reduce(
                (sum, category) => sum + Object.keys(category.variables).length, 
                0
            )
        };
    }, [availableVariables, filteredVariables]);
    
    // ===================================================================
    // FUNCIONES DE UI
    // ===================================================================
    
    /**
     * Toggle panel de variables
     */
    const toggleVariablesPanel = useCallback(() => {
        setShowVariablesPanel(prev => !prev);
    }, []);
    
    /**
     * Mostrar panel de variables
     */
    const showPanel = useCallback(() => {
        setShowVariablesPanel(true);
    }, []);
    
    /**
     * Ocultar panel de variables
     */
    const hidePanel = useCallback(() => {
        setShowVariablesPanel(false);
    }, []);
    
    /**
     * Toggle sección expandida/colapsada
     * @param {string} sectionKey - Clave de la sección
     */
    const toggleSection = useCallback((sectionKey) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }));
    }, []);
    
    /**
     * Expandir todas las secciones
     */
    const expandAllSections = useCallback(() => {
        const allExpanded = {};
        Object.keys(availableVariables).forEach(key => {
            allExpanded[key] = true;
        });
        setExpandedSections(allExpanded);
    }, [availableVariables]);
    
    /**
     * Colapsar todas las secciones
     */
    const collapseAllSections = useCallback(() => {
        const allCollapsed = {};
        Object.keys(availableVariables).forEach(key => {
            allCollapsed[key] = false;
        });
        setExpandedSections(allCollapsed);
    }, [availableVariables]);
    
    /**
     * Actualizar término de búsqueda
     * @param {string} term - Término de búsqueda
     */
    const updateSearchTerm = useCallback((term) => {
        setSearchTerm(term);
        
        // Si hay búsqueda, expandir secciones que tienen resultados
        if (term.trim()) {
            const newExpanded = {};
            Object.keys(filteredVariables).forEach(key => {
                newExpanded[key] = true;
            });
            setExpandedSections(prev => ({ ...prev, ...newExpanded }));
        }
    }, [filteredVariables]);
    
    /**
     * Limpiar búsqueda
     */
    const clearSearch = useCallback(() => {
        setSearchTerm('');
    }, []);
    
    // ===================================================================
    // FUNCIONES DE VARIABLES
    // ===================================================================
    
    /**
     * Procesar variables en código HTML
     * @param {string} htmlCode - Código HTML
     * @returns {string} HTML procesado
     */
    const processCode = useCallback((htmlCode) => {
        return processVariables(htmlCode);
    }, []);
    
    /**
     * Obtener variables usadas en código
     * @param {string} htmlCode - Código HTML
     * @returns {Array} Variables encontradas
     */
    const getUsedVariables = useCallback((htmlCode) => {
        return extractVariables(htmlCode);
    }, []);
    
    /**
     * Validar si una variable existe
     * @param {string} variablePath - Path de variable
     * @returns {boolean} True si es válida
     */
    const isValidVariable = useCallback((variablePath) => {
        return validateVariable(variablePath);
    }, []);
    
    /**
     * Encontrar variables inválidas en código
     * @param {string} htmlCode - Código HTML
     * @returns {Array} Variables inválidas
     */
    const getInvalidVariables = useCallback((htmlCode) => {
        return findInvalidVariables(htmlCode);
    }, []);
    
    /**
     * Formatear variable para inserción
     * @param {string} variablePath - Path de variable
     * @returns {string} Variable formateada
     */
    const formatVariable = useCallback((variablePath) => {
        return formatVariableForInsertion(variablePath);
    }, []);
    
    /**
     * Obtener información detallada de una variable
     * @param {string} variablePath - Path de variable
     * @returns {Object|null} Info de la variable
     */
    const getVariableInfo = useCallback((variablePath) => {
        for (const [categoryKey, category] of Object.entries(availableVariables)) {
            if (category.variables.hasOwnProperty(variablePath)) {
                return {
                    path: variablePath,
                    value: category.variables[variablePath],
                    category: categoryKey,
                    categoryTitle: category.title,
                    formatted: formatVariableForInsertion(variablePath)
                };
            }
        }
        return null;
    }, [availableVariables]);
    
    // ===================================================================
    // FUNCIONES DE ANÁLISIS
    // ===================================================================
    
    /**
     * Analizar código y obtener reporte completo
     * @param {string} htmlCode - Código HTML
     * @returns {Object} Reporte de análisis
     */
    const analyzeCode = useCallback((htmlCode) => {
        const usedVars = getUsedVariables(htmlCode);
        const invalidVars = getInvalidVariables(htmlCode);
        const validVars = usedVars.filter(v => !invalidVars.includes(v));
        
        return {
            totalVariables: usedVars.length,
            validVariables: validVars,
            invalidVariables: invalidVars,
            hasVariables: usedVars.length > 0,
            hasInvalidVariables: invalidVars.length > 0,
            processingReady: invalidVars.length === 0,
            suggestions: invalidVars.map(invalid => {
                // Buscar variables similares
                const allPaths = Object.values(availableVariables)
                    .flatMap(cat => Object.keys(cat.variables));
                
                const similar = allPaths.filter(path => 
                    path.toLowerCase().includes(invalid.toLowerCase()) ||
                    invalid.toLowerCase().includes(path.toLowerCase())
                ).slice(0, 3);
                
                return {
                    invalid,
                    suggestions: similar
                };
            })
        };
    }, [availableVariables, getUsedVariables, getInvalidVariables]);
    
    // ===================================================================
    // RETURN OBJECT
    // ===================================================================
    
    return {
        // Estado UI
        showVariablesPanel,
        expandedSections,
        searchTerm,
        
        // Datos computados
        availableVariables,
        filteredVariables,
        variableStats,
        
        // Funciones UI
        toggleVariablesPanel,
        showPanel,
        hidePanel,
        toggleSection,
        expandAllSections,
        collapseAllSections,
        updateSearchTerm,
        clearSearch,
        
        // Funciones de variables
        processCode,
        getUsedVariables,
        isValidVariable,
        getInvalidVariables,
        formatVariable,
        getVariableInfo,
        analyzeCode
    };
};

// ===================================================================
// HOOK SIMPLIFICADO PARA CASOS BÁSICOS
// ===================================================================

/**
 * Hook simplificado solo para procesamiento
 * @returns {Object} Funciones básicas de procesamiento
 */
export const useVariableProcessor = () => {
    const processCode = useCallback((htmlCode) => {
        return processVariables(htmlCode);
    }, []);
    
    const analyzeCode = useCallback((htmlCode) => {
        return {
            variables: extractVariables(htmlCode),
            invalid: findInvalidVariables(htmlCode),
            valid: extractVariables(htmlCode).filter(v => validateVariable(v))
        };
    }, []);
    
    return {
        processCode,
        analyzeCode
    };
};

export default useVariables;
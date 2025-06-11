// ===================================================================
// security/TemplateValidator.js
// Responsabilidad: Validación de seguridad para templates editables
// ===================================================================

/**
 * Validador de seguridad para templates editables
 * Previene XSS, inyección de scripts y otros ataques
 */
class TemplateValidator {
    constructor(options = {}) {
        this.options = {
            strictMode: false,
            allowedTags: ['div', 'span', 'p', 'a', 'img', 'button', 'input', 'form'],
            allowUnsafeElements: false,
            ...options
        };
    }

    // ===================================================================
    // VALIDACIÓN PRINCIPAL
    // ===================================================================

    /**
     * Validar template completo
     * @param {string} template - Template HTML a validar
     * @param {Object} options - Opciones de validación
     * @returns {Object} Resultado de validación con errores/warnings
     */
    validate(template, options = {}) {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            sanitized: null,
            stats: {}
        };

        try {
            // Validaciones básicas
            this._validateBasics(template, result);
            
            if (!result.isValid) return result;

            // Validar tamaño
            this._validateSize(template, result);
            
            // Validar patrones peligrosos
            this._validateDangerousPatterns(template, result);
            
            // Validar estructura HTML
            this._validateHTMLStructure(template, result);
            
            // Validar atributos Alpine.js
            this._validateAlpineAttributes(template, result);
            
            // Validar variables del sistema
            this._validateSystemVariables(template, result);
            
            // Generar versión sanitizada
            if (options.sanitize !== false) {
                result.sanitized = this.sanitize(template);
            }
            
            // Generar estadísticas
            result.stats = this._generateStats(template);
            
            console.log(`🛡️ Template validation ${result.isValid ? 'passed' : 'failed'}: ${result.errors.length} errors, ${result.warnings.length} warnings`);
            
        } catch (error) {
            result.isValid = false;
            result.errors.push({
                type: 'validation_error',
                message: `Error durante validación: ${error.message}`,
                severity: 'critical'
            });
        }

        return result;
    }

    /**
     * Sanitizar template (limpiar contenido peligroso)
     * @param {string} template - Template a sanitizar
     * @returns {string} Template sanitizado
     */
    sanitize(template) {
        if (!template || typeof template !== 'string') {
            return '';
        }

        let sanitized = template;

        try {
            // Remover patrones peligrosos
            for (const pattern of this.config.dangerousPatterns) {
                sanitized = sanitized.replace(pattern, '');
            }

            // Sanitizar URLs
            sanitized = this._sanitizeUrls(sanitized);
            
            // Escapar caracteres peligrosos en atributos
            sanitized = this._sanitizeAttributes(sanitized);
            
            // Limitar anidamiento
            sanitized = this._limitNesting(sanitized);
            
            console.log('🧹 Template sanitized successfully');
            return sanitized;
            
        } catch (error) {
            console.error('❌ Error sanitizing template:', error);
            return template; // Devolver original si falla
        }
    }

    // ===================================================================
    // VALIDACIONES ESPECÍFICAS
    // ===================================================================

    /**
     * Validaciones básicas
     * @private
     */
    _validateBasics(template, result) {
        if (!template) {
            result.errors.push({
                type: 'empty_template',
                message: 'Template está vacío',
                severity: 'error'
            });
            result.isValid = false;
            return;
        }

        if (typeof template !== 'string') {
            result.errors.push({
                type: 'invalid_type',
                message: 'Template debe ser una cadena de texto',
                severity: 'error'
            });
            result.isValid = false;
            return;
        }
    }

    /**
     * Validar tamaño del template
     * @private
     */
    _validateSize(template, result) {
        if (template.length > this.config.maxTemplateSize) {
            result.errors.push({
                type: 'size_exceeded',
                message: `Template demasiado grande: ${template.length} bytes (máximo: ${this.config.maxTemplateSize})`,
                severity: 'error'
            });
            result.isValid = false;
        }

        if (template.length > this.config.maxTemplateSize * 0.8) {
            result.warnings.push({
                type: 'size_warning',
                message: `Template cercano al límite de tamaño: ${template.length} bytes`,
                severity: 'warning'
            });
        }
    }

    /**
     * Validar patrones peligrosos
     * @private
     */
    _validateDangerousPatterns(template, result) {
        for (const pattern of this.config.dangerousPatterns) {
            const matches = template.match(pattern);
            if (matches) {
                result.errors.push({
                    type: 'dangerous_pattern',
                    message: `Patrón peligroso detectado: ${matches[0].substring(0, 50)}...`,
                    severity: 'critical',
                    pattern: pattern.toString()
                });
                result.isValid = false;
            }
        }
    }

    /**
     * Validar estructura HTML básica
     * @private
     */
    _validateHTMLStructure(template, result) {
        try {
            // Validar tags balanceados
            const tagBalance = this._checkTagBalance(template);
            if (!tagBalance.balanced) {
                result.errors.push({
                    type: 'unbalanced_tags',
                    message: `Tags no balanceados: ${tagBalance.details}`,
                    severity: 'error'
                });
                result.isValid = false;
            }

            // Validar anidamiento
            const nestingLevel = this._checkNestingLevel(template);
            if (nestingLevel > this.config.maxNestingLevel) {
                result.errors.push({
                    type: 'nesting_too_deep',
                    message: `Anidamiento demasiado profundo: ${nestingLevel} niveles (máximo: ${this.config.maxNestingLevel})`,
                    severity: 'error'
                });
                result.isValid = false;
            }

            // Validar tags permitidos
            const invalidTags = this._findInvalidTags(template);
            invalidTags.forEach(tag => {
                result.errors.push({
                    type: 'invalid_tag',
                    message: `Tag no permitido: <${tag}>`,
                    severity: 'error'
                });
                result.isValid = false;
            });

        } catch (error) {
            result.warnings.push({
                type: 'structure_validation_error',
                message: `Error validando estructura HTML: ${error.message}`,
                severity: 'warning'
            });
        }
    }

    /**
     * Validar atributos específicos de Alpine.js
     * @private
     */
    _validateAlpineAttributes(template, result) {
        const alpineAttributePattern = /(x-[\w-]+|@[\w-]+(?:\.[\w-]+)*|:[\w-]+)\s*=\s*["']([^"']*)["']/g;
        let match;

        while ((match = alpineAttributePattern.exec(template)) !== null) {
            const [, attribute, value] = match;
            
            // Validar que el valor no contenga JavaScript peligroso
            if (this._containsDangerousJS(value)) {
                result.errors.push({
                    type: 'dangerous_alpine_expression',
                    message: `Expresión Alpine peligrosa en ${attribute}: ${value}`,
                    severity: 'critical'
                });
                result.isValid = false;
            }

            // Validar estructura básica de x-for
            if (attribute === 'x-for' && !this._isValidXForExpression(value)) {
                result.warnings.push({
                    type: 'invalid_xfor',
                    message: `Expresión x-for inválida: ${value}`,
                    severity: 'warning'
                });
            }
        }
    }

    /**
     * Validar variables del sistema
     * @private
     */
    _validateSystemVariables(template, result) {
        const variablePattern = /\{\{\s*([^}]+)\s*\}\}/g;
        let match;
        const usedVariables = new Set();

        while ((match = variablePattern.exec(template)) !== null) {
            const variable = match[1].trim();
            usedVariables.add(variable);

            // Validar formato de variable
            if (!/^[\w.-]+$/.test(variable)) {
                result.errors.push({
                    type: 'invalid_variable_format',
                    message: `Formato de variable inválido: {{ ${variable} }}`,
                    severity: 'error'
                });
                result.isValid = false;
            }

            // Advertir sobre variables que podrían no existir
            if (this._isPotentiallyUndefinedVariable(variable)) {
                result.warnings.push({
                    type: 'undefined_variable',
                    message: `Variable posiblemente no definida: {{ ${variable} }}`,
                    severity: 'warning'
                });
            }
        }

        result.stats.variablesUsed = Array.from(usedVariables);
    }

    // ===================================================================
    // UTILIDADES DE VALIDACIÓN
    // ===================================================================

    /**
     * Verificar balance de tags HTML
     * @private
     */
    _checkTagBalance(template) {
        const stack = [];
        const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
        let match;

        while ((match = tagPattern.exec(template)) !== null) {
            const isClosing = match[0].startsWith('</');
            const tagName = match[1].toLowerCase();
            
            // Ignorar tags auto-cerrados
            const selfClosing = ['br', 'hr', 'img', 'input', 'meta', 'link'];
            if (selfClosing.includes(tagName) && !isClosing) {
                continue;
            }

            if (isClosing) {
                if (stack.length === 0 || stack[stack.length - 1] !== tagName) {
                    return {
                        balanced: false,
                        details: `Tag de cierre sin apertura: </${tagName}>`
                    };
                }
                stack.pop();
            } else {
                stack.push(tagName);
            }
        }

        if (stack.length > 0) {
            return {
                balanced: false,
                details: `Tags sin cerrar: ${stack.join(', ')}`
            };
        }

        return { balanced: true };
    }

    /**
     * Verificar nivel de anidamiento
     * @private
     */
    _checkNestingLevel(template) {
        let maxLevel = 0;
        let currentLevel = 0;
        const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
        let match;

        while ((match = tagPattern.exec(template)) !== null) {
            const isClosing = match[0].startsWith('</');
            const tagName = match[1].toLowerCase();
            
            // Ignorar tags auto-cerrados
            const selfClosing = ['br', 'hr', 'img', 'input', 'meta', 'link'];
            if (selfClosing.includes(tagName) && !isClosing) {
                continue;
            }

            if (isClosing) {
                currentLevel--;
            } else {
                currentLevel++;
                maxLevel = Math.max(maxLevel, currentLevel);
            }
        }

        return maxLevel;
    }

    /**
     * Encontrar tags no permitidos
     * @private
     */
    _findInvalidTags(template) {
        const invalidTags = [];
        const tagPattern = /<([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
        let match;

        while ((match = tagPattern.exec(template)) !== null) {
            const tagName = match[1].toLowerCase();
            if (!this.config.allowedTags.has(tagName)) {
                if (!invalidTags.includes(tagName)) {
                    invalidTags.push(tagName);
                }
            }
        }

        return invalidTags;
    }

    /**
     * Verificar si contiene JavaScript peligroso
     * @private
     */
    _containsDangerousJS(value) {
        const dangerousKeywords = [
            'eval', 'Function', 'setTimeout', 'setInterval',
            'document.write', 'innerHTML', 'outerHTML',
            'location', 'window', 'parent', 'top',
            'fetch', 'XMLHttpRequest', 'import'
        ];

        return dangerousKeywords.some(keyword => 
            value.toLowerCase().includes(keyword.toLowerCase())
        );
    }

    /**
     * Validar expresión x-for
     * @private
     */
    _isValidXForExpression(value) {
        // Patrón básico: "item in items" o "(item, index) in items"
        const patterns = [
            /^\s*\w+\s+in\s+\w+(\.\w+)*\s*$/,
            /^\s*\(\s*\w+\s*,\s*\w+\s*\)\s+in\s+\w+(\.\w+)*\s*$/
        ];

        return patterns.some(pattern => pattern.test(value));
    }

    /**
     * Verificar si variable podría no estar definida
     * @private
     */
    _isPotentiallyUndefinedVariable(variable) {
        const knownPrefixes = ['user', 'app', 'current', 'site', 'templates'];
        return !knownPrefixes.some(prefix => variable.startsWith(prefix));
    }

    // ===================================================================
    // SANITIZACIÓN
    // ===================================================================

    /**
     * Sanitizar URLs en atributos
     * @private
     */
    _sanitizeUrls(template) {
        return template.replace(/(href|src)\s*=\s*["']([^"']+)["']/gi, (match, attr, url) => {
            try {
                const urlObj = new URL(url);
                if (this.config.allowedProtocols.has(urlObj.protocol.replace(':', ''))) {
                    return match;
                }
            } catch {
                // URL inválida o relativa - permitir URLs relativas
                if (!url.startsWith('javascript:') && !url.startsWith('data:')) {
                    return match;
                }
            }
            return `${attr}="#"`;
        });
    }

    /**
     * Sanitizar atributos peligrosos
     * @private
     */
    _sanitizeAttributes(template) {
        // Remover event handlers (onclick, onload, etc.)
        return template.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
    }

    /**
     * Limitar anidamiento excesivo
     * @private
     */
    _limitNesting(template) {
        // Implementación básica - en caso real sería más sofisticada
        let nestingLevel = 0;
        const maxLevel = this.config.maxNestingLevel;
        
        return template.replace(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g, (match, tagName) => {
            nestingLevel++;
            if (nestingLevel > maxLevel) {
                return `<!-- Nesting too deep: ${match} -->`;
            }
            return match;
        });
    }

    // ===================================================================
    // ESTADÍSTICAS Y REPORTING
    // ===================================================================

    /**
     * Generar estadísticas del template
     * @private
     */
    _generateStats(template) {
        const stats = {
            size: template.length,
            lineCount: (template.match(/\n/g) || []).length + 1,
            tagCount: (template.match(/<[^>]+>/g) || []).length,
            alpineDirectives: (template.match(/(x-[\w-]+|@[\w-]+)/g) || []).length,
            variablesCount: (template.match(/\{\{[^}]+\}\}/g) || []).length,
            nestingLevel: this._checkNestingLevel(template),
            variablesUsed: []
        };

        return stats;
    }

    // ===================================================================
    // CONFIGURACIÓN Y UTILS
    // ===================================================================

    /**
     * Actualizar configuración de seguridad
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('🛡️ TemplateValidator config updated');
    }

    /**
     * Obtener configuración actual
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Verificar si template es seguro (validación rápida)
     */
    isSafe(template) {
        const result = this.validate(template, { sanitize: false });
        return result.isValid && result.errors.length === 0;
    }

    /**
     * Obtener solo errores críticos
     */
    getCriticalErrors(template) {
        const result = this.validate(template, { sanitize: false });
        return result.errors.filter(error => error.severity === 'critical');
    }

    /**
     * Validar template básico (sin opciones avanzadas)
     */
    validateBasic(template) {
        try {
            // Validaciones básicas
            if (!template) {
                return { valid: false, error: 'Template está vacío' };
            }

            if (typeof template !== 'string') {
                return { valid: false, error: 'Template debe ser una cadena de texto' };
            }

            // Validar tamaño
            if (template.length > this.config.maxTemplateSize) {
                return { valid: false, error: `Template demasiado grande` };
            }

            // Validar patrones peligrosos
            for (const pattern of this.config.dangerousPatterns) {
                if (pattern.test(template)) {
                    return { valid: false, error: 'Template contiene patrones peligrosos' };
                }
            }

            // Validar estructura HTML básica
            const hasValidStructure = this._validateHTMLStructure(template);
            if (!hasValidStructure) {
                return { valid: false, error: 'Estructura HTML inválida' };
            }

            return { valid: true };
        } catch (error) {
            console.error('❌ Error en validación básica:', error);
            return { valid: false, error: 'Error en validación básica' };
        }
    }

    /**
     * Validar template completo (con todas las opciones)
     */
    validateFull(template) {
        try {
            // Validar template completo
            const result = this.validate(template);
            
            // Validar errores críticos
            if (!result.isValid) {
                const criticalErrors = result.errors.filter(err => err.severity === 'critical');
                if (criticalErrors.length > 0) {
                    return { valid: false, errors: criticalErrors };
                }
            }

            return { valid: true };
        } catch (error) {
            console.error('❌ Error en validación completa:', error);
            return { valid: false, error: 'Error en validación completa' };
        }
    }
}

export default TemplateValidator;
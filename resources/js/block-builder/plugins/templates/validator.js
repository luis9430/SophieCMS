// ===================================================================
// plugins/templates/validator.js
// Validador de templates Liquid con seguridad y sintaxis
// ===================================================================

export class TemplateValidator {
    constructor(liquidEngine) {
        this.liquid = liquidEngine;
        this.config = {
            maxTemplateSize: 1024 * 1024, // 1MB max
            allowedTags: [
                'if', 'elsif', 'else', 'endif',
                'for', 'endfor', 'break', 'continue',
                'assign', 'capture', 'endcapture',
                'case', 'when', 'endcase',
                'unless', 'endunless',
                'comment', 'endcomment',
                'raw', 'endraw',
                'tablerow', 'endtablerow',
                // Tags personalizados
                'component', 'section'
            ],
            allowedFilters: [
                // Filtros básicos
                'default', 'size', 'first', 'last',
                'join', 'split', 'reverse', 'sort',
                'map', 'where', 'group_by',
                'upcase', 'downcase', 'capitalize',
                'strip', 'lstrip', 'rstrip',
                'replace', 'remove', 'append', 'prepend',
                'slice', 'truncate', 'truncatewords',
                'escape', 'escape_once', 'url_encode',
                'date', 'plus', 'minus', 'times', 'divided_by',
                'modulo', 'round', 'ceil', 'floor',
                // Filtros personalizados
                'money', 'date_format', 'slugify'
            ],
            blockedPatterns: [
                /javascript:/i,
                /vbscript:/i,
                /data:/i,
                /<script/i,
                /<iframe/i,
                /on\w+\s*=/i, // eventos onclick, onload, etc.
                /eval\s*\(/i,
                /function\s*\(/i
            ],
            maxNestingLevel: 10,
            maxVariableDepth: 5
        };
        
        this.stats = {
            validationsPerformed: 0,
            validTemplates: 0,
            invalidTemplates: 0,
            lastValidation: null
        };
        
        console.log('🔍 TemplateValidator initialized');
    }

    // ===================================================================
    // VALIDACIÓN PRINCIPAL
    // ===================================================================

    /**
     * Validar template completo
     */
    async validate(templateContent, options = {}) {
        const startTime = Date.now();
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            stats: {
                size: templateContent.length,
                validationTime: 0,
                complexity: 0
            },
            security: {
                safe: true,
                issues: []
            }
        };

        try {
            this.stats.validationsPerformed++;
            
            // 1. Validaciones básicas
            this._validateBasics(templateContent, result);
            
            // 2. Validación de seguridad
            this._validateSecurity(templateContent, result);
            
            // 3. Validación de sintaxis Liquid
            await this._validateLiquidSyntax(templateContent, result);
            
            // 4. Validación semántica
            this._validateSemantics(templateContent, result);
            
            // 5. Calcular complejidad
            result.stats.complexity = this._calculateComplexity(templateContent);
            
            // Determinar si es válido
            result.isValid = result.errors.length === 0 && result.security.safe;
            
            if (result.isValid) {
                this.stats.validTemplates++;
            } else {
                this.stats.invalidTemplates++;
            }
            
        } catch (error) {
            result.isValid = false;
            result.errors.push({
                type: 'validation-error',
                message: `Error during validation: ${error.message}`,
                line: 0,
                severity: 'error'
            });
        }
        
        result.stats.validationTime = Date.now() - startTime;
        this.stats.lastValidation = new Date().toISOString();
        
        return result;
    }

    /**
     * Validación rápida (solo sintaxis básica)
     */
    async validateQuick(templateContent) {
        try {
            await this.liquid.parse(templateContent);
            return { isValid: true, errors: [] };
        } catch (error) {
            return {
                isValid: false,
                errors: [{
                    type: 'syntax-error',
                    message: error.message,
                    line: this._extractLineNumber(error.message),
                    severity: 'error'
                }]
            };
        }
    }

    // ===================================================================
    // VALIDACIONES ESPECÍFICAS
    // ===================================================================

    /**
     * Validaciones básicas
     * @private
     */
    _validateBasics(content, result) {
        // Tamaño del template
        if (content.length > this.config.maxTemplateSize) {
            result.errors.push({
                type: 'size-limit',
                message: `Template too large: ${content.length} bytes (max: ${this.config.maxTemplateSize})`,
                severity: 'error'
            });
        }

        // Contenido vacío
        if (!content.trim()) {
            result.warnings.push({
                type: 'empty-template',
                message: 'Template is empty',
                severity: 'warning'
            });
        }

        // Encoding válido
        if (!/^[\x00-\x7F]*$/.test(content)) {
            // Verificar UTF-8 válido
            try {
                new TextEncoder().encode(content);
            } catch (error) {
                result.errors.push({
                    type: 'encoding-error',
                    message: 'Invalid character encoding',
                    severity: 'error'
                });
            }
        }
    }

    /**
     * Validación de seguridad
     * @private
     */
    _validateSecurity(content, result) {
        // Verificar patrones bloqueados
        for (const pattern of this.config.blockedPatterns) {
            if (pattern.test(content)) {
                result.security.safe = false;
                result.security.issues.push({
                    type: 'blocked-pattern',
                    message: `Potentially unsafe pattern detected: ${pattern.source}`,
                    pattern: pattern.source,
                    severity: 'error'
                });
            }
        }

        // Verificar HTML malicioso
        const htmlIssues = this._checkMaliciousHtml(content);
        if (htmlIssues.length > 0) {
            result.security.safe = false;
            result.security.issues.push(...htmlIssues);
        }

        // Verificar Liquid malicioso
        const liquidIssues = this._checkMaliciousLiquid(content);
        if (liquidIssues.length > 0) {
            result.security.safe = false;
            result.security.issues.push(...liquidIssues);
        }
    }

    /**
     * Validación de sintaxis Liquid
     * @private
     */
    async _validateLiquidSyntax(content, result) {
        try {
            // Intentar parsear el template
            const ast = await this.liquid.parse(content);
            
            // Validar tags permitidos
            this._validateAllowedTags(ast, result);
            
            // Validar filtros permitidos
            this._validateAllowedFilters(ast, result);
            
            // Validar niveles de anidamiento
            this._validateNestingLevel(ast, result);
            
        } catch (error) {
            result.errors.push({
                type: 'liquid-syntax',
                message: error.message,
                line: this._extractLineNumber(error.message),
                severity: 'error'
            });
        }
    }

    /**
     * Validación semántica
     * @private
     */
    _validateSemantics(content, result) {
        // Verificar variables no definidas (opcional)
        const variables = this._extractVariables(content);
        const undefinedVars = this._checkUndefinedVariables(variables);
        
        undefinedVars.forEach(variable => {
            result.warnings.push({
                type: 'undefined-variable',
                message: `Variable "${variable}" might be undefined`,
                variable: variable,
                severity: 'warning'
            });
        });

        // Verificar bucles potencialmente infinitos
        const infiniteLoops = this._checkPotentialInfiniteLoops(content);
        infiniteLoops.forEach(issue => {
            result.warnings.push({
                type: 'infinite-loop',
                message: issue.message,
                line: issue.line,
                severity: 'warning'
            });
        });

        // Verificar mejores prácticas
        const practices = this._checkBestPractices(content);
        practices.forEach(practice => {
            result.warnings.push({
                type: 'best-practice',
                message: practice.message,
                line: practice.line,
                severity: 'info'
            });
        });
    }

    // ===================================================================
    // VALIDACIONES DE SEGURIDAD ESPECÍFICAS
    // ===================================================================

    /**
     * Verificar HTML malicioso
     * @private
     */
    _checkMaliciousHtml(content) {
        const issues = [];
        
        // Buscar tags peligrosos
        const dangerousTags = [
            'script', 'iframe', 'object', 'embed', 
            'applet', 'meta', 'link', 'style'
        ];
        
        dangerousTags.forEach(tag => {
            const regex = new RegExp(`<${tag}\\b`, 'gi');
            let match;
            while ((match = regex.exec(content)) !== null) {
                issues.push({
                    type: 'dangerous-html',
                    message: `Potentially dangerous HTML tag: <${tag}>`,
                    tag: tag,
                    position: match.index,
                    severity: 'error'
                });
            }
        });

        // Buscar atributos peligrosos
        const dangerousAttrs = /\bon\w+\s*=/gi;
        let match;
        while ((match = dangerousAttrs.exec(content)) !== null) {
            issues.push({
                type: 'dangerous-attribute',
                message: `Potentially dangerous HTML attribute: ${match[0]}`,
                attribute: match[0],
                position: match.index,
                severity: 'error'
            });
        }

        return issues;
    }

    /**
     * Verificar Liquid malicioso
     * @private
     */
    _checkMaliciousLiquid(content) {
        const issues = [];
        
        // Buscar acceso a propiedades peligrosas
        const dangerousAccess = [
            '__proto__', 'prototype', 'constructor',
            'eval', 'function', 'require', 'import'
        ];
        
        dangerousAccess.forEach(prop => {
            const regex = new RegExp(`\\b${prop}\\b`, 'gi');
            if (regex.test(content)) {
                issues.push({
                    type: 'dangerous-access',
                    message: `Potentially dangerous property access: ${prop}`,
                    property: prop,
                    severity: 'error'
                });
            }
        });

        return issues;
    }

    // ===================================================================
    // VALIDACIONES DE ESTRUCTURA
    // ===================================================================

    /**
     * Validar tags permitidos
     * @private
     */
    _validateAllowedTags(ast, result) {
        const usedTags = this._extractTags(ast);
        
        usedTags.forEach(tag => {
            if (!this.config.allowedTags.includes(tag)) {
                result.errors.push({
                    type: 'disallowed-tag',
                    message: `Tag not allowed: {% ${tag} %}`,
                    tag: tag,
                    severity: 'error'
                });
            }
        });
    }

    /**
     * Validar filtros permitidos
     * @private
     */
    _validateAllowedFilters(ast, result) {
        const usedFilters = this._extractFilters(ast);
        
        usedFilters.forEach(filter => {
            if (!this.config.allowedFilters.includes(filter)) {
                result.warnings.push({
                    type: 'unknown-filter',
                    message: `Unknown or potentially unsafe filter: | ${filter}`,
                    filter: filter,
                    severity: 'warning'
                });
            }
        });
    }

}
  
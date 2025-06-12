// ===================================================================
// plugins/templates/editor.js
// Sistema de autocompletado para templates Liquid en CodeMirror
// ===================================================================

export class TemplateCompletions {
    constructor() {
        this.config = {
            enableSnippets: true,
            enableTagCompletion: true,
            enableFilterCompletion: true,
            enableVariableCompletion: true,
            maxSuggestions: 20,
            caseSensitive: false,
            includeDocumentation: true
        };
        
        // Cache de completions para mejorar rendimiento
        this.completionCache = new Map();
        this.cacheTimeout = 60000; // 1 minuto
        
        // Definiciones de Liquid
        this.liquidTags = this._initializeLiquidTags();
        this.liquidFilters = this._initializeLiquidFilters();
        this.snippets = this._initializeSnippets();
        
        console.log('📝 TemplateCompletions initialized');
    }

    // ===================================================================
    // API PRINCIPAL
    // ===================================================================

    /**
     * Obtener completions para contexto dado
     */
    getCompletions(context, liquidEngine = null) {
        try {
            const completions = [];
            const { pos, state } = context;
            const doc = state.doc;
            const line = doc.lineAt(pos);
            const lineText = line.text;
            const beforeCursor = lineText.slice(0, pos - line.from);
            const afterCursor = lineText.slice(pos - line.from);

            // Determinar tipo de completion necesario
            const completionType = this._detectCompletionType(beforeCursor, afterCursor);
            
            switch (completionType.type) {
                case 'tag':
                    completions.push(...this._getTagCompletions(completionType, context));
                    break;
                case 'filter':
                    completions.push(...this._getFilterCompletions(completionType, context));
                    break;
                case 'variable':
                    completions.push(...this._getVariableCompletions(completionType, context));
                    break;
                case 'snippet':
                    completions.push(...this._getSnippetCompletions(completionType, context));
                    break;
                case 'attribute':
                    completions.push(...this._getAttributeCompletions(completionType, context));
                    break;
                default:
                    // Completion general - mostrar todas las opciones disponibles
                    completions.push(...this._getGeneralCompletions(context));
            }

            // Filtrar por relevancia y límite
            return this._filterAndSortCompletions(completions, completionType.searchTerm);

        } catch (error) {
            console.error('Error getting template completions:', error);
            return [];
        }
    }

    // ===================================================================
    // DETECCIÓN DE CONTEXTO
    // ===================================================================

    /**
     * Detectar tipo de completion requerido
     * @private
     */
    _detectCompletionType(beforeCursor, afterCursor) {
        // Liquid tag: {% ... %}
        const tagMatch = beforeCursor.match(/\{\%\s*(\w*)$/);
        if (tagMatch) {
            return {
                type: 'tag',
                searchTerm: tagMatch[1] || '',
                isOpening: true
            };
        }

        // Liquid tag de cierre: {% end... %}
        const endTagMatch = beforeCursor.match(/\{\%\s*(end\w*)$/);
        if (endTagMatch) {
            return {
                type: 'endtag',
                searchTerm: endTagMatch[1] || '',
                isClosing: true
            };
        }

        // Liquid filter: {{ variable | ... }}
        const filterMatch = beforeCursor.match(/\{\{[^}]*\|\s*(\w*)$/);
        if (filterMatch) {
            return {
                type: 'filter',
                searchTerm: filterMatch[1] || '',
                variable: this._extractVariable(beforeCursor)
            };
        }

        // Liquid variable: {{ ... }}
        const variableMatch = beforeCursor.match(/\{\{\s*([^|}]*)$/);
        if (variableMatch) {
            return {
                type: 'variable',
                searchTerm: variableMatch[1] || '',
                inOutput: true
            };
        }

        // Atributo de tag Liquid
        const attrMatch = beforeCursor.match(/\{\%\s*\w+\s+([^%]*)$/);
        if (attrMatch) {
            return {
                type: 'attribute',
                searchTerm: attrMatch[1] || '',
                tagContext: this._extractTagFromLine(beforeCursor)
            };
        }

        // HTML con posible snippet
        if (this._isInHtmlContext(beforeCursor)) {
            return {
                type: 'snippet',
                searchTerm: this._extractWordAtCursor(beforeCursor),
                htmlContext: true
            };
        }

        return {
            type: 'general',
            searchTerm: this._extractWordAtCursor(beforeCursor)
        };
    }

    /**
     * Extraer variable de expresión Liquid
     * @private
     */
    _extractVariable(text) {
        const match = text.match(/\{\{\s*([^|}]+)/);
        return match ? match[1].trim() : '';
    }

    /**
     * Extraer tag de línea
     * @private
     */
    _extractTagFromLine(text) {
        const match = text.match(/\{\%\s*(\w+)/);
        return match ? match[1] : '';
    }

    /**
     * Verificar si estamos en contexto HTML
     * @private
     */
    _isInHtmlContext(text) {
        const liquidPatterns = [/\{\%/, /\{\{/];
        return !liquidPatterns.some(pattern => pattern.test(text));
    }

    /**
     * Extraer palabra en cursor
     * @private
     */
    _extractWordAtCursor(text) {
        const match = text.match(/(\w+)$/);
        return match ? match[1] : '';
    }

    // ===================================================================
    // COMPLETIONS ESPECÍFICOS
    // ===================================================================

    /**
     * Obtener completions de tags
     * @private
     */
    _getTagCompletions(completionType, context) {
        const completions = [];
        const searchTerm = completionType.searchTerm.toLowerCase();

        for (const [tagName, tagInfo] of Object.entries(this.liquidTags)) {
            if (!searchTerm || tagName.toLowerCase().includes(searchTerm)) {
                completions.push({
                    label: tagName,
                    type: 'liquid-tag',
                    info: 'Liquid Tag',
                    detail: tagInfo.description,
                    documentation: this._createTagDocumentation(tagName, tagInfo),
                    apply: this._createTagApplication(tagName, tagInfo),
                    boost: tagInfo.priority || 50
                });
            }
        }

        return completions;
    }

    /**
     * Obtener completions de filtros
     * @private
     */
    _getFilterCompletions(completionType, context) {
        const completions = [];
        const searchTerm = completionType.searchTerm.toLowerCase();

        for (const [filterName, filterInfo] of Object.entries(this.liquidFilters)) {
            if (!searchTerm || filterName.toLowerCase().includes(searchTerm)) {
                completions.push({
                    label: filterName,
                    type: 'liquid-filter',
                    info: 'Liquid Filter',
                    detail: filterInfo.description,
                    documentation: this._createFilterDocumentation(filterName, filterInfo),
                    apply: this._createFilterApplication(filterName, filterInfo),
                    boost: filterInfo.priority || 50
                });
            }
        }

        return completions;
    }

/**
     * Obtener completions de variables
     * @private
     */
    _getVariableCompletions(completionType, context) {
        const completions = [];
        const searchTerm = completionType.searchTerm.toLowerCase();

        // Variables del plugin de variables si está disponible
        if (window.pluginManager?.get('variables')) {
            const variablesPlugin = window.pluginManager.get('variables');
            const availableVars = variablesPlugin.getAvailableVariables();
            
            Object.entries(availableVars).forEach(([categoryKey, category]) => {
                Object.entries(category.variables).forEach(([path, value]) => {
                    if (!searchTerm || path.toLowerCase().includes(searchTerm)) {
                        completions.push({
                            label: path,
                            type: 'liquid-variable',
                            info: category.title,
                            detail: `${path} → ${this._formatValuePreview(value)}`,
                            documentation: this._createVariableDocumentation(path, value, category),
                            apply: path,
                            boost: category.priority || 50
                        });
                    }
                });
            });
        }

        // Variables Liquid estándar
        const standardVars = this._getStandardLiquidVariables();
        standardVars.forEach(variable => {
            if (!searchTerm || variable.name.toLowerCase().includes(searchTerm)) {
                completions.push({
                    label: variable.name,
                    type: 'liquid-variable',
                    info: 'Standard Variable',
                    detail: variable.description,
                    documentation: variable.documentation,
                    apply: variable.name,
                    boost: 60
                });
            }
        });

        return completions;
    }

    /**
     * Obtener completions de snippets
     * @private
     */
    _getSnippetCompletions(completionType, context) {
        if (!this.config.enableSnippets) return [];

        const completions = [];
        const searchTerm = completionType.searchTerm.toLowerCase();

        for (const [snippetKey, snippet] of Object.entries(this.snippets)) {
            if (!searchTerm || snippetKey.toLowerCase().includes(searchTerm) || 
                snippet.label.toLowerCase().includes(searchTerm)) {
                completions.push({
                    label: snippet.label || snippetKey,
                    type: 'snippet',
                    info: 'Template Snippet',
                    detail: snippet.description,
                    documentation: this._createSnippetDocumentation(snippetKey, snippet),
                    apply: this._createSnippetApplication(snippet),
                    boost: 80 // Los snippets tienen alta prioridad
                });
            }
        }

        return completions;
    }

    /**
     * Obtener completions de atributos
     * @private
     */
    _getAttributeCompletions(completionType, context) {
        const completions = [];
        const tagName = completionType.tagContext;
        const searchTerm = completionType.searchTerm.toLowerCase();

        // Atributos específicos por tag
        const tagAttributes = this._getTagAttributes(tagName);
        tagAttributes.forEach(attr => {
            if (!searchTerm || attr.name.toLowerCase().includes(searchTerm)) {
                completions.push({
                    label: attr.name,
                    type: 'liquid-attribute',
                    info: 'Tag Attribute',
                    detail: attr.description,
                    documentation: attr.documentation,
                    apply: `${attr.name}="${attr.defaultValue || ''}"`,
                    boost: 70
                });
            }
        });

        return completions;
    }

    /**
     * Obtener completions generales
     * @private
     */
    _getGeneralCompletions(context) {
        const completions = [];

        // Tags más comunes
        const commonTags = ['if', 'for', 'assign', 'capture', 'include'];
        commonTags.forEach(tag => {
            if (this.liquidTags[tag]) {
                completions.push({
                    label: `{% ${tag} %}`,
                    type: 'liquid-tag',
                    info: 'Common Tag',
                    detail: this.liquidTags[tag].description,
                    apply: this._createTagApplication(tag, this.liquidTags[tag]),
                    boost: 90
                });
            }
        });

        // Variables más comunes
        const commonVars = ['user', 'site', 'current', 'app'];
        commonVars.forEach(varName => {
            completions.push({
                label: `{{ ${varName}. }}`,
                type: 'liquid-variable',
                info: 'Common Variable',
                detail: `Access ${varName} properties`,
                apply: `{{ ${varName}.`,
                boost: 85
            });
        });

        // Snippets destacados
        const featuredSnippets = ['card', 'hero', 'form'];
        featuredSnippets.forEach(snippetKey => {
            if (this.snippets[snippetKey]) {
                const snippet = this.snippets[snippetKey];
                completions.push({
                    label: snippet.label,
                    type: 'snippet',
                    info: 'Featured Snippet',
                    detail: snippet.description,
                    apply: this._createSnippetApplication(snippet),
                    boost: 95
                });
            }
        });

        return completions;
    }

    // ===================================================================
    // APLICACIÓN DE COMPLETIONS
    // ===================================================================

    /**
     * Crear aplicación de tag
     * @private
     */
    _createTagApplication(tagName, tagInfo) {
        return (view, completion, from, to) => {
            let insertion = tagName;
            let cursorOffset = tagName.length;

            // Tags que requieren cierre
            if (tagInfo.requiresEnd) {
                if (tagInfo.hasBody) {
                    insertion = `${tagName} ${tagInfo.defaultParams || ''}\n  \n{% end${tagName} %}`;
                    cursorOffset = tagName.length + (tagInfo.defaultParams?.length || 0) + 3;
                } else {
                    insertion = `${tagName} ${tagInfo.defaultParams || ''} %}{% end${tagName}`;
                    cursorOffset = tagName.length + (tagInfo.defaultParams?.length || 0) + 1;
                }
            } else {
                insertion = `${tagName} ${tagInfo.defaultParams || ''}`;
                cursorOffset = insertion.length;
            }

            view.dispatch({
                changes: { from, to, insert: insertion },
                selection: { anchor: from + cursorOffset }
            });
        };
    }

    /**
     * Crear aplicación de filtro
     * @private
     */
    _createFilterApplication(filterName, filterInfo) {
        return (view, completion, from, to) => {
            let insertion = filterName;
            
            if (filterInfo.parameters && filterInfo.parameters.length > 0) {
                const params = filterInfo.parameters.map(p => p.defaultValue || '').join(', ');
                insertion = `${filterName}: ${params}`;
            }

            view.dispatch({
                changes: { from, to, insert: insertion }
            });
        };
    }

    /**
     * Crear aplicación de snippet
     * @private
     */
    _createSnippetApplication(snippet) {
        return (view, completion, from, to) => {
            const insertion = snippet.body;
            
            // Buscar placeholder para cursor
            const cursorMatch = insertion.match(/\$\{1:([^}]*)\}/);
            let cursorPos = from + insertion.length;
            
            if (cursorMatch) {
                cursorPos = from + cursorMatch.index;
                // Remover placeholder del snippet
                const cleanInsertion = insertion.replace(/\$\{\d+:([^}]*)\}/g, '$1');
                view.dispatch({
                    changes: { from, to, insert: cleanInsertion },
                    selection: { 
                        anchor: cursorPos, 
                        head: cursorPos + cursorMatch[1].length 
                    }
                });
                return;
            }

            view.dispatch({
                changes: { from, to, insert: insertion },
                selection: { anchor: cursorPos }
            });
        };
    }

    // ===================================================================
    // DOCUMENTACIÓN
    // ===================================================================

    /**
     * Crear documentación de tag
     * @private
     */
    _createTagDocumentation(tagName, tagInfo) {
        if (!this.config.includeDocumentation) return undefined;

        return `
            **${tagName}** - ${tagInfo.description}

            ${tagInfo.longDescription || ''}

            **Sintaxis:**
            \`\`\`liquid
            {% ${tagName} ${tagInfo.syntax || ''} %}
            ${tagInfo.hasBody ? '  content here' : ''}
            ${tagInfo.requiresEnd ? `{% end${tagName} %}` : ''}
            \`\`\`

            ${tagInfo.examples ? `**Ejemplo:**\n\`\`\`liquid\n${tagInfo.examples}\n\`\`\`` : ''}
                    `.trim();
                }

    /**
     * Crear documentación de filtro
     * @private
     */
    _createFilterDocumentation(filterName, filterInfo) {
        if (!this.config.includeDocumentation) return undefined;

                return `
        **${filterName}** - ${filterInfo.description}

        ${filterInfo.longDescription || ''}

        **Sintaxis:**
        \`\`\`liquid
        {{ variable | ${filterName}${filterInfo.parameters ? ': param1, param2' : ''} }}
        \`\`\`

        ${filterInfo.examples ? `**Ejemplo:**\n\`\`\`liquid\n${filterInfo.examples}\n\`\`\`` : ''}
                `.trim();
            }

            /**
             * Crear documentación de variable
             * @private
             */
     _createVariableDocumentation(path, value, category) {
                if (!this.config.includeDocumentation) return undefined;

                return `
        **${path}** - ${category.title}

        **Valor actual:** ${this._formatValuePreview(value)}
        **Tipo:** ${typeof value}

        **Uso:**
        \`\`\`liquid
        {{ ${path} }}
        \`\`\`
                `.trim();
            }

    /**
     * Crear documentación de snippet
     * @private
     */
    _createSnippetDocumentation(snippetKey, snippet) {
        if (!this.config.includeDocumentation) return undefined;

        return `
**${snippet.label}** - ${snippet.description}

${snippet.longDescription || ''}

**Variables disponibles:**
${snippet.variables ? snippet.variables.map(v => `- ${v}`).join('\n') : 'Ninguna'}

**Código generado:**
\`\`\`liquid
${snippet.body.replace(/\$\{\d+:([^}]*)\}/g, '$1')}
\`\`\`
        `.trim();
    }

    // ===================================================================
    // INICIALIZACIÓN DE DATOS
    // ===================================================================

    /**
     * Inicializar tags de Liquid
     * @private
     */
    _initializeLiquidTags() {
        return {
            'if': {
                description: 'Conditional statement',
                longDescription: 'Renders content only if the condition is true',
                syntax: 'condition',
                requiresEnd: true,
                hasBody: true,
                defaultParams: 'condition',
                examples: '{% if user.name %}\n  Hello {{ user.name }}!\n{% endif %}',
                priority: 95
            },
            'unless': {
                description: 'Negative conditional statement',
                longDescription: 'Renders content only if the condition is false',
                syntax: 'condition',
                requiresEnd: true,
                hasBody: true,
                defaultParams: 'condition',
                examples: '{% unless user.name %}\n  Please enter your name\n{% endunless %}',
                priority: 80
            },
            'elsif': {
                description: 'Alternative condition',
                syntax: 'condition',
                requiresEnd: false,
                hasBody: true,
                defaultParams: 'condition',
                priority: 85
            },
            'else': {
                description: 'Default condition',
                requiresEnd: false,
                hasBody: true,
                priority: 85
            },
            'for': {
                description: 'Loop through collection',
                longDescription: 'Iterates over arrays or objects',
                syntax: 'item in collection',
                requiresEnd: true,
                hasBody: true,
                defaultParams: 'item in collection',
                examples: '{% for product in products %}\n  {{ product.name }}\n{% endfor %}',
                priority: 90
            },
            'assign': {
                description: 'Create or assign variable',
                longDescription: 'Creates a new variable or assigns a value to an existing one',
                syntax: 'variable = value',
                requiresEnd: false,
                hasBody: false,
                defaultParams: 'variable = value',
                examples: '{% assign total = price | times: quantity %}',
                priority: 85
            },
            'capture': {
                description: 'Capture content in variable',
                longDescription: 'Captures the rendered content and saves it to a variable',
                syntax: 'variable_name',
                requiresEnd: true,
                hasBody: true,
                defaultParams: 'variable_name',
                examples: '{% capture greeting %}\n  Hello {{ user.name }}!\n{% endcapture %}',
                priority: 75
            },
            'case': {
                description: 'Switch statement',
                longDescription: 'Compares a variable against multiple values',
                syntax: 'variable',
                requiresEnd: true,
                hasBody: true,
                defaultParams: 'variable',
                examples: '{% case user.role %}\n  {% when "admin" %}\n    Admin panel\n  {% else %}\n    User panel\n{% endcase %}',
                priority: 70
            },
            'when': {
                description: 'Case condition',
                syntax: 'value',
                requiresEnd: false,
                hasBody: true,
                defaultParams: 'value',
                priority: 70
            },
            'break': {
                description: 'Exit loop',
                requiresEnd: false,
                hasBody: false,
                priority: 60
            },
            'continue': {
                description: 'Skip to next iteration',
                requiresEnd: false,
                hasBody: false,
                priority: 60
            },
            'comment': {
                description: 'Comment block',
                longDescription: 'Content inside will not be rendered',
                requiresEnd: true,
                hasBody: true,
                examples: '{% comment %}\n  This is a comment\n{% endcomment %}',
                priority: 50
            },
            'raw': {
                description: 'Raw content block',
                longDescription: 'Content will not be processed by Liquid',
                requiresEnd: true,
                hasBody: true,
                examples: '{% raw %}\n  {{ this will not be processed }}\n{% endraw %}',
                priority: 50
            },
            'tablerow': {
                description: 'Create HTML table rows',
                longDescription: 'Generates HTML table rows with automatic styling',
                syntax: 'item in collection',
                requiresEnd: true,
                hasBody: true,
                defaultParams: 'item in collection',
                examples: '{% tablerow product in products %}\n  {{ product.name }}\n{% endtablerow %}',
                priority: 40
            }
        };
    }

    /**
     * Inicializar filtros de Liquid
     * @private
     */
    _initializeLiquidFilters() {
        return {
            // String filters
            'upcase': {
                description: 'Convert to uppercase',
                examples: "{{ 'hello' | upcase }} → HELLO",
                priority: 80
            },
            'downcase': {
                description: 'Convert to lowercase',
                examples: "{{ 'HELLO' | downcase }} → hello",
                priority: 80
            },
            'capitalize': {
                description: 'Capitalize first letter',
                examples: "{{ 'hello world' | capitalize }} → Hello world",
                priority: 75
            },
            'strip': {
                description: 'Remove whitespace',
                examples: "{{ '  hello  ' | strip }} → hello",
                priority: 70
            },
            'truncate': {
                description: 'Truncate string',
                parameters: [{ name: 'length', defaultValue: '50' }],
                examples: "{{ text | truncate: 20 }}",
                priority: 85
            },
            'replace': {
                description: 'Replace text',
                parameters: [
                    { name: 'search', defaultValue: "'old'" },
                    { name: 'replace', defaultValue: "'new'" }
                ],
                examples: "{{ text | replace: 'old', 'new' }}",
                priority: 80
            },
            'remove': {
                description: 'Remove text',
                parameters: [{ name: 'string', defaultValue: "'text'" }],
                examples: "{{ text | remove: 'unwanted' }}",
                priority: 70
            },
            'append': {
                description: 'Append string',
                parameters: [{ name: 'string', defaultValue: "'suffix'" }],
                examples: "{{ 'hello' | append: ' world' }} → hello world",
                priority: 75
            },
            'prepend': {
                description: 'Prepend string',
                parameters: [{ name: 'string', defaultValue: "'prefix'" }],
                examples: "{{ 'world' | prepend: 'hello ' }} → hello world",
                priority: 75
            },
            'slice': {
                description: 'Extract substring',
                parameters: [
                    { name: 'start', defaultValue: '0' },
                    { name: 'length', defaultValue: '10' }
                ],
                examples: "{{ 'hello world' | slice: 0, 5 }} → hello",
                priority: 70
            },
            
            // Array filters
            'join': {
                description: 'Join array elements',
                parameters: [{ name: 'separator', defaultValue: "', '" }],
                examples: "{{ array | join: ', ' }}",
                priority: 85
            },
            'first': {
                description: 'Get first element',
                examples: "{{ array | first }}",
                priority: 80
            },
            'last': {
                description: 'Get last element',
                examples: "{{ array | last }}",
                priority: 80
            },
            'size': {
                description: 'Get array/string length',
                examples: "{{ array | size }}",
                priority: 85
            },
            'reverse': {
                description: 'Reverse array order',
                examples: "{{ array | reverse }}",
                priority: 70
            },
            'sort': {
                description: 'Sort array',
                parameters: [{ name: 'property', defaultValue: '' }],
                examples: "{{ products | sort: 'name' }}",
                priority: 80
            },
            'uniq': {
                description: 'Remove duplicates',
                examples: "{{ array | uniq }}",
                priority: 70
            },
            'map': {
                description: 'Extract property from objects',
                parameters: [{ name: 'property', defaultValue: "'name'" }],
                examples: "{{ products | map: 'name' }}",
                priority: 75
            },
            'where': {
                description: 'Filter by property value',
                parameters: [
                    { name: 'property', defaultValue: "'status'" },
                    { name: 'value', defaultValue: "'active'" }
                ],
                examples: "{{ products | where: 'status', 'active' }}",
                priority: 80
            },
            
            // Number filters
            'plus': {
                description: 'Add numbers',
                parameters: [{ name: 'number', defaultValue: '1' }],
                examples: "{{ 5 | plus: 3 }} → 8",
                priority: 85
            },
            'minus': {
                description: 'Subtract numbers',
                parameters: [{ name: 'number', defaultValue: '1' }],
                examples: "{{ 5 | minus: 3 }} → 2",
                priority: 85
            },
            'times': {
                description: 'Multiply numbers',
                parameters: [{ name: 'number', defaultValue: '2' }],
                examples: "{{ 5 | times: 3 }} → 15",
                priority: 85
            },
            'divided_by': {
                description: 'Divide numbers',
                parameters: [{ name: 'number', defaultValue: '2' }],
                examples: "{{ 10 | divided_by: 2 }} → 5",
                priority: 85
            },
            'modulo': {
                description: 'Get remainder',
                parameters: [{ name: 'number', defaultValue: '2' }],
                examples: "{{ 7 | modulo: 3 }} → 1",
                priority: 70
            },
            'round': {
                description: 'Round number',
                parameters: [{ name: 'decimals', defaultValue: '0' }],
                examples: "{{ 3.14159 | round: 2 }} → 3.14",
                priority: 80
            },
            'ceil': {
                description: 'Round up',
                examples: "{{ 3.2 | ceil }} → 4",
                priority: 70
            },
            'floor': {
                description: 'Round down',
                examples: "{{ 3.8 | floor }} → 3",
                priority: 70
            },
            
            // Date filters
            'date': {
                description: 'Format date',
                parameters: [{ name: 'format', defaultValue: "'%Y-%m-%d'" }],
                examples: "{{ 'now' | date: '%Y-%m-%d' }}",
                priority: 90
            },
            
            // URL and HTML filters
            'url_encode': {
                description: 'URL encode string',
                examples: "{{ 'hello world' | url_encode }} → hello%20world",
                priority: 75
            },
            'escape': {
                description: 'HTML escape',
                examples: "{{ '<script>' | escape }} → &lt;script&gt;",
                priority: 85
            },
            'escape_once': {
                description: 'HTML escape (once)',
                examples: "{{ text | escape_once }}",
                priority: 80
            },
            
            // Custom filters
            'money': {
                description: 'Format as currency',
                parameters: [{ name: 'currency', defaultValue: "'EUR'" }],
                examples: "{{ 19.99 | money }} → €19,99",
                priority: 90
            },
            'date_format': {
                description: 'Custom date format',
                parameters: [{ name: 'format', defaultValue: "'short'" }],
                examples: "{{ date | date_format: 'long' }}",
                priority: 85
            },
            'slugify': {
                description: 'Create URL slug',
                examples: "{{ 'Hello World!' | slugify }} → hello-world",
                priority: 80
            }
        };
    }

    /**
     * Inicializar snippets
     * @private
     */
    _initializeSnippets() {
        return {
            'card': {
                label: 'Card Component',
                description: 'Responsive card component',
                longDescription: 'Creates a flexible card component with image, title, description and optional button',
                body: `<div class="bg-white rounded-lg shadow-md overflow-hidden">
                {% if \${1:image} %}
                <img src="{{ \${1:image} }}" alt="{{ \${2:title} }}" class="w-full h-48 object-cover">
                {% endif %}
                
                <div class="p-6">
                    <h3 class="text-xl font-semibold mb-2">{{ \${2:title} }}</h3>
                    
                    {% if \${3:description} %}
                    <p class="text-gray-600 mb-4">{{ \${3:description} }}</p>
                    {% endif %}
                    
                    {% if \${4:button_text} %}
                    <a href="{{ \${5:button_url} | default: '#' }}" 
                    class="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                    {{ \${4:button_text} }}
                    </a>
                    {% endif %}
                </div>
                </div>`,
                variables: ['image', 'title', 'description', 'button_text', 'button_url']
            },
            
            'hero': {
                label: 'Hero Section',
                description: 'Hero section with title and CTA',
                body: `<section class="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
                <div class="container mx-auto px-4 text-center">
                    <h1 class="text-4xl md:text-6xl font-bold mb-6">
                    {{ \${1:title} | default: "Welcome to our site" }}
                    </h1>
                    
                    <p class="text-xl md:text-2xl mb-8 opacity-90">
                    {{ \${2:subtitle} | default: "Amazing experiences await" }}
                    </p>
                    
                    {% if \${3:cta_text} %}
                    <a href="{{ \${4:cta_url} | default: '#' }}" 
                    class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                    {{ \${3:cta_text} }}
                    </a>
                    {% endif %}
                </div>
                </section>`,
                variables: ['title', 'subtitle', 'cta_text', 'cta_url']
            },
            
            'form': {
                label: 'Contact Form',
                description: 'Responsive contact form',
                body: `<form action="{{ \${1:form_action} | default: '#' }}" method="POST" class="max-w-md mx-auto space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                        {{ \${2:name_label} | default: "Name" }}
                        </label>
                        <input type="text" name="name" required 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                        {{ \${3:email_label} | default: "Email" }}
                        </label>
                        <input type="email" name="email" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                        {{ \${4:message_label} | default: "Message" }}
                        </label>
                        <textarea name="message" rows="4" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                    </div>
                    
                    <button type="submit" 
                            class="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors">
                        {{ \${5:submit_text} | default: "Send Message" }}
                    </button>
                    </form>`,
                variables: ['form_action', 'name_label', 'email_label', 'message_label', 'submit_text']
            },
            
            'loop': {
                label: 'For Loop',
                description: 'Basic for loop structure',
                body: `{% for \${1:item} in \${2:collection} %}
                <div class="\${3:item-class}">
                    {{ \${1:item}.\${4:property} }}
                </div>
                {% endfor %}`,
                                variables: ['item', 'collection', 'item-class', 'property']
                            },
                            
            'condition': {
                label: 'If Condition',
                description: 'Conditional statement',
                body: `{% if \${1:condition} %}
                \${2:content}
                {% elsif \${3:alternative_condition} %}
                \${4:alternative_content}
                {% else %}
                \${5:default_content}
                {% endif %}`,
                variables: ['condition', 'content', 'alternative_condition', 'alternative_content', 'default_content']
            }
        };
    }

    // ===================================================================
    // UTILIDADES
    // ===================================================================

    /**
     * Obtener variables Liquid estándar
     * @private
     */
    _getStandardLiquidVariables() {
        return [
            {
                name: 'forloop.index',
                description: 'Current iteration (1-based)',
                documentation: 'The current iteration count, starting from 1'
            },
            {
                name: 'forloop.index0',
                description: 'Current iteration (0-based)',
                documentation: 'The current iteration count, starting from 0'
            },
            {
                name: 'forloop.rindex',
                description: 'Remaining iterations',
                documentation: 'Number of iterations remaining'
            },
            {
                name: 'forloop.first',
                description: 'First iteration?',
                documentation: 'True if this is the first iteration'
            },
            {
                name: 'forloop.last',
                description: 'Last iteration?',
                documentation: 'True if this is the last iteration'
            },
            {
                name: 'tablerowloop.col',
                description: 'Current column',
                documentation: 'Current column number in tablerow'
            },
            {
                name: 'tablerowloop.col_first',
                description: 'First column?',
                documentation: 'True if this is the first column'
            },
            {
                name: 'tablerowloop.col_last',
                description: 'Last column?',
                documentation: 'True if this is the last column'
            }
        ];
    }

    /**
     * Obtener atributos de tag
     * @private
     */
    _getTagAttributes(tagName) {
        const attributes = {
            'for': [
                { name: 'limit', description: 'Limit iterations', defaultValue: '10' },
                { name: 'offset', description: 'Skip items', defaultValue: '0' },
                { name: 'reversed', description: 'Reverse order', defaultValue: '' }
            ],
            'tablerow': [
                { name: 'cols', description: 'Number of columns', defaultValue: '3' },
                { name: 'limit', description: 'Limit rows', defaultValue: '10' },
            ]};
                    return attributes[tagName] || [];

        }
    /**
     * Obtener atributos de tag
     * @private
     */
    _getTagAttributes(tagName) {
        const attributes = {
            'for': [
                { name: 'limit', description: 'Limit iterations', defaultValue: '10' },
                { name: 'offset', description: 'Skip items', defaultValue: '0' },
                { name: 'reversed', description: 'Reverse order', defaultValue: '' }
            ],
            'tablerow': [
                { name: 'cols', description: 'Number of columns', defaultValue: '3' },
                { name: 'limit', description: 'Limit rows', defaultValue: '10' },
                { name: 'offset', description: 'Skip rows', defaultValue: '0' }
            ],
            'case': [
                { name: 'variable', description: 'Variable to compare', defaultValue: 'status' }
            ]
        };

        return attributes[tagName] || [];
    }

    /**
     * Formatear preview de valor
     * @private
     */
    _formatValuePreview(value) {
        if (value === null || value === undefined) return 'null';
        if (typeof value === 'string') {
            return value.length > 30 ? `"${value.substring(0, 30)}..."` : `"${value}"`;
        }
        if (typeof value === 'number') return value.toString();
        if (typeof value === 'boolean') return value.toString();
        if (typeof value === 'object') {
            return Array.isArray(value) ? `Array(${value.length})` : 'Object';
        }
        return String(value);
    }

    /**
     * Filtrar y ordenar completions
     * @private
     */
    _filterAndSortCompletions(completions, searchTerm = '') {
        let filtered = completions;

        // Filtrar por término de búsqueda si existe
        if (searchTerm && !this.config.caseSensitive) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            filtered = completions.filter(completion =>
                completion.label.toLowerCase().includes(lowerSearchTerm) ||
                (completion.detail && completion.detail.toLowerCase().includes(lowerSearchTerm))
            );
        } else if (searchTerm) {
            filtered = completions.filter(completion =>
                completion.label.includes(searchTerm) ||
                (completion.detail && completion.detail.includes(searchTerm))
            );
        }

        // Ordenar por relevancia
        filtered.sort((a, b) => {
            // Prioridad por boost
            const boostDiff = (b.boost || 50) - (a.boost || 50);
            if (boostDiff !== 0) return boostDiff;

            // Coincidencia exacta primero
            if (searchTerm) {
                const aExact = a.label.toLowerCase() === searchTerm.toLowerCase();
                const bExact = b.label.toLowerCase() === searchTerm.toLowerCase();
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;

                // Coincidencia al inicio
                const aStarts = a.label.toLowerCase().startsWith(searchTerm.toLowerCase());
                const bStarts = b.label.toLowerCase().startsWith(searchTerm.toLowerCase());
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
            }

            // Alfabético como último criterio
            return a.label.localeCompare(b.label);
        });

        // Limitar número de sugerencias
        return filtered.slice(0, this.config.maxSuggestions);
    }

    // ===================================================================
    // CONFIGURACIÓN Y GESTIÓN
    // ===================================================================

    /**
     * Actualizar configuración
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Limpiar cache si cambió configuración relevante
        if ('maxSuggestions' in newConfig || 'caseSensitive' in newConfig) {
            this.completionCache.clear();
        }
        
        console.log('⚙️ TemplateCompletions config updated');
    }

    /**
     * Obtener configuración actual
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Añadir snippet personalizado
     */
    addSnippet(key, snippet) {
        this.snippets[key] = {
            label: snippet.label || key,
            description: snippet.description || 'Custom snippet',
            body: snippet.body,
            variables: snippet.variables || [],
            longDescription: snippet.longDescription
        };
        
        console.log(`📝 Custom snippet added: ${key}`);
    }

    /**
     * Remover snippet
     */
    removeSnippet(key) {
        const removed = delete this.snippets[key];
        if (removed) {
            console.log(`📝 Snippet removed: ${key}`);
        }
        return removed;
    }

    /**
     * Añadir filtro personalizado
     */
    addCustomFilter(name, filterInfo) {
        this.liquidFilters[name] = {
            description: filterInfo.description || 'Custom filter',
            longDescription: filterInfo.longDescription,
            parameters: filterInfo.parameters || [],
            examples: filterInfo.examples,
            priority: filterInfo.priority || 50
        };
        
        console.log(`🔧 Custom filter added: ${name}`);
    }

    /**
     * Añadir tag personalizado
     */
    addCustomTag(name, tagInfo) {
        this.liquidTags[name] = {
            description: tagInfo.description || 'Custom tag',
            longDescription: tagInfo.longDescription,
            syntax: tagInfo.syntax,
            requiresEnd: tagInfo.requiresEnd || false,
            hasBody: tagInfo.hasBody || false,
            defaultParams: tagInfo.defaultParams,
            examples: tagInfo.examples,
            priority: tagInfo.priority || 50
        };
        
        console.log(`🏷️ Custom tag added: ${name}`);
    }

    /**
     * Obtener estadísticas de uso
     */
    getUsageStats() {
        return {
            totalTags: Object.keys(this.liquidTags).length,
            totalFilters: Object.keys(this.liquidFilters).length,
            totalSnippets: Object.keys(this.snippets).length,
            cacheSize: this.completionCache.size,
            config: this.config
        };
    }

    /**
     * Exportar configuración completa
     */
    exportConfig() {
        return {
            config: this.config,
            customTags: this._getCustomEntries(this.liquidTags),
            customFilters: this._getCustomEntries(this.liquidFilters),
            customSnippets: this.snippets
        };
    }

    /**
     * Importar configuración
     */
    importConfig(configData) {
        try {
            if (configData.config) {
                this.updateConfig(configData.config);
            }

            if (configData.customTags) {
                Object.entries(configData.customTags).forEach(([name, tag]) => {
                    this.addCustomTag(name, tag);
                });
            }

            if (configData.customFilters) {
                Object.entries(configData.customFilters).forEach(([name, filter]) => {
                    this.addCustomFilter(name, filter);
                });
            }

            if (configData.customSnippets) {
                Object.entries(configData.customSnippets).forEach(([key, snippet]) => {
                    this.addSnippet(key, snippet);
                });
            }

            console.log('📥 Template completions config imported');
            return true;

        } catch (error) {
            console.error('❌ Error importing config:', error);
            return false;
        }
    }

    /**
     * Obtener entradas personalizadas
     * @private
     */
    _getCustomEntries(collection) {
        const custom = {};
        const standardKeys = this._getStandardKeys(collection);
        
        Object.entries(collection).forEach(([key, value]) => {
            if (!standardKeys.includes(key)) {
                custom[key] = value;
            }
        });
        
        return custom;
    }

    /**
     * Obtener claves estándar
     * @private
     */
    _getStandardKeys(collection) {
        // Determinar qué claves son estándar vs personalizadas
        if (collection === this.liquidTags) {
            return ['if', 'unless', 'elsif', 'else', 'for', 'assign', 'capture', 'case', 'when', 'break', 'continue', 'comment', 'raw', 'tablerow'];
        } else if (collection === this.liquidFilters) {
            return ['upcase', 'downcase', 'capitalize', 'strip', 'truncate', 'replace', 'remove', 'append', 'prepend', 'slice', 'join', 'first', 'last', 'size', 'reverse', 'sort', 'uniq', 'map', 'where', 'plus', 'minus', 'times', 'divided_by', 'modulo', 'round', 'ceil', 'floor', 'date', 'url_encode', 'escape', 'escape_once'];
        }
        return [];
    }

    // ===================================================================
    // INTEGRACIÓN CON SISTEMAS EXTERNOS
    // ===================================================================

    /**
     * Sincronizar con plugin de variables
     */
    syncWithVariablesPlugin() {
        if (!window.pluginManager?.get('variables')) {
            console.warn('⚠️ Variables plugin not available for sync');
            return false;
        }

        try {
            // Limpiar cache para refrescar variables
            this.completionCache.clear();
            console.log('🔄 Synced with variables plugin');
            return true;
        } catch (error) {
            console.error('❌ Error syncing with variables plugin:', error);
            return false;
        }
    }

    /**
     * Integrar con sistema de templates
     */
    integrateWithTemplateSystem(templateStorage) {
        try {
            // Añadir snippets desde templates guardados
            this._loadSnippetsFromTemplates(templateStorage);
            console.log('🔗 Integrated with template system');
            return true;
        } catch (error) {
            console.error('❌ Error integrating with template system:', error);
            return false;
        }
    }

    /**
     * Cargar snippets desde templates guardados
     * @private
     */
    async _loadSnippetsFromTemplates(templateStorage) {
        try {
            const templates = await templateStorage.listTemplates();
            
            templates.forEach(template => {
                if (template.metadata?.category === 'snippet') {
                    this.addSnippet(`template_${template.name}`, {
                        label: template.metadata.title || template.name,
                        description: template.metadata.description || 'Template snippet',
                        body: template.content,
                        variables: template.metadata.variables || []
                    });
                }
            });
            
        } catch (error) {
            console.warn('⚠️ Could not load snippets from templates:', error);
        }
    }

    // ===================================================================
    // ANÁLISIS Y DEBUGGING
    // ===================================================================

    /**
     * Analizar completions para contexto específico
     */
    analyzeCompletions(context) {
        const completions = this.getCompletions(context);
        
        return {
            total: completions.length,
            byType: this._groupCompletionsByType(completions),
            topBoosts: completions
                .sort((a, b) => (b.boost || 0) - (a.boost || 0))
                .slice(0, 5)
                .map(c => ({ label: c.label, boost: c.boost })),
            averageBoost: completions.reduce((sum, c) => sum + (c.boost || 50), 0) / completions.length,
            hasDocumentation: completions.filter(c => !!c.documentation).length
        };
    }

    /**
     * Agrupar completions por tipo
     * @private
     */
    _groupCompletionsByType(completions) {
        const groups = {};
        
        completions.forEach(completion => {
            const type = completion.type || 'unknown';
            if (!groups[type]) {
                groups[type] = 0;
            }
            groups[type]++;
        });
        
        return groups;
    }

    /**
     * Obtener información de debugging
     */
    getDebugInfo() {
        return {
            config: this.config,
            stats: this.getUsageStats(),
            cacheInfo: {
                size: this.completionCache.size,
                timeout: this.cacheTimeout
            },
            definitions: {
                tags: Object.keys(this.liquidTags).length,
                filters: Object.keys(this.liquidFilters).length,
                snippets: Object.keys(this.snippets).length
            }
        };
    }

    // ===================================================================
    // CLEANUP
    // ===================================================================

    /**
     * Limpiar recursos
     */
    cleanup() {
        try {
            // Limpiar cache
            this.completionCache.clear();
            
            // Reset a valores por defecto
            this.config = {
                enableSnippets: true,
                enableTagCompletion: true,
                enableFilterCompletion: true,
                enableVariableCompletion: true,
                maxSuggestions: 20,
                caseSensitive: false,
                includeDocumentation: true
            };
            
            // Reinicializar definiciones
            this.liquidTags = this._initializeLiquidTags();
            this.liquidFilters = this._initializeLiquidFilters();
            this.snippets = this._initializeSnippets();
            
            console.log('🧹 TemplateCompletions cleaned up');
            
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
}

// ===================================================================
// UTILIDADES EXPORTABLES
// ===================================================================

/**
 * Crear instancia de completions con configuración
 */
export const createTemplateCompletions = (config = {}) => {
    const completions = new TemplateCompletions();
    completions.updateConfig(config);
    return completions;
};

/**
 * Validar snippet
 */
export const validateSnippet = (snippet) => {
    const required = ['label', 'body'];
    const missing = required.filter(field => !snippet[field]);
    
    if (missing.length > 0) {
        throw new Error(`Snippet missing required fields: ${missing.join(', ')}`);
    }
    
    return true;
};

/**
 * Formatear snippet para CodeMirror
 */
export const formatSnippetForEditor = (snippet) => {
    return {
        label: snippet.label,
        type: 'snippet',
        info: 'Template Snippet',
        detail: snippet.description,
        apply: snippet.body.replace(/\$\{\d+:([^}]*)\}/g, '$1')
    };
};

// ===================================================================
// DEBUGGING EN DESARROLLO
// ===================================================================

if (process.env.NODE_ENV === 'development') {
    window.TemplateCompletions = TemplateCompletions;
    window.templateCompletionsUtils = {
        createTemplateCompletions,
        validateSnippet,
        formatSnippetForEditor
    };
    
    console.log('🔧 TemplateCompletions exposed to window for debugging');
}
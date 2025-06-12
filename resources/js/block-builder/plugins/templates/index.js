// ===================================================================
// plugins/templates/index.js
// Plugin de Templates usando Liquid.js
// ===================================================================

import { Liquid } from 'liquidjs';
import { TemplateValidator } from './validator.js';
import { TemplateStorage } from './storage.js';
import { TemplateRenderer } from './renderer.js';
import { TemplateCompletions } from './editor.js';

const templatesPlugin = {
    name: 'templates',
    version: '1.0.0',
    dependencies: [], 
    previewPriority: 85,
    
    // ===================================================================
    // INICIALIZACIÓN
    // ===================================================================
    
    async init(context) {
        console.log('📄 Initializing Templates Plugin v1.0.0...');
        
        try {
            // Configurar Liquid.js
            this.liquid = new Liquid({
                cache: true,
                root: '/', // Base path para templates
                extname: '.liquid',
                strictFilters: false,
                strictVariables: false,
                trimTagLeft: false,
                trimTagRight: false,
                trimOutputLeft: false,
                trimOutputRight: false
            });
            
            // Inicializar componentes
            this.validator = new TemplateValidator(this.liquid);
            this.storage = new TemplateStorage();
            this.renderer = new TemplateRenderer(this.liquid, this.validator);
            this.completions = new TemplateCompletions();
            
            // Registrar filtros personalizados
            this._registerCustomFilters();
            
            // Registrar tags personalizados
            this._registerCustomTags();
            
            // Cargar templates predefinidos
            await this._loadDefaultTemplates();
            
            // Configurar integración con otros plugins
            this._setupPluginIntegration();
            
            console.log('✅ Templates Plugin initialized successfully');
            return this;
            
        } catch (error) {
            console.error('❌ Error initializing Templates Plugin:', error);
            throw error;
        }
    },

    // ===================================================================
    // API PÚBLICA - RENDERIZADO
    // ===================================================================
    
    /**
     * Renderizar template con datos
     */
    async renderTemplate(templateContent, data = {}) {
        return await this.renderer.render(templateContent, data);
    },

    /**
     * Renderizar template por nombre
     */
    async renderByName(templateName, data = {}) {
        const template = await this.storage.getTemplate(templateName);
        if (!template) {
            throw new Error(`Template "${templateName}" not found`);
        }
        return await this.renderTemplate(template.content, data);
    },

    /**
     * Compilar template (para uso múltiple)
     */
    async compileTemplate(templateContent) {
        return await this.liquid.parse(templateContent);
    },

    // ===================================================================
    // API PÚBLICA - GESTIÓN DE TEMPLATES
    // ===================================================================
    
    /**
     * Guardar template
     */
    async saveTemplate(name, content, metadata = {}) {
        // Validar contenido
        const validation = await this.validator.validate(content);
        if (!validation.isValid) {
            throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
        }
        
        return await this.storage.saveTemplate(name, {
            content,
            metadata: {
                ...metadata,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                version: '1.0.0'
            }
        });
    },

    /**
     * Obtener template
     */
    async getTemplate(name) {
        return await this.storage.getTemplate(name);
    },

    /**
     * Listar templates
     */
    async listTemplates() {
        return await this.storage.listTemplates();
    },

    /**
     * Eliminar template
     */
    async deleteTemplate(name) {
        return await this.storage.deleteTemplate(name);
    },

    /**
     * Validar template
     */
    async validateTemplate(content) {
        return await this.validator.validate(content);
    },

    // ===================================================================
    // INTEGRACIÓN CON EDITOR
    // ===================================================================
    
    /**
     * Obtener completions para CodeMirror
     */
    getEditorCompletions(context) {
        return this.completions.getCompletions(context, this.liquid);
    },

    /**
     * Validar sintaxis para editor
     */
    validateEditorSyntax(code) {
        const errors = [];
        const warnings = [];
        
        try {
            // Validación básica de sintaxis Liquid
            this.liquid.parse(code);
        } catch (error) {
            errors.push({
                type: 'syntax-error',
                message: error.message,
                position: this._extractPosition(error),
                severity: 'error'
            });
        }
        
        return { errors, warnings };
    },

    // ===================================================================
    // PREVIEW INTEGRATION
    // ===================================================================
    
    /**
     * Obtener template para preview
     */
    getPreviewTemplate() {
        return `
            <!-- LIQUID.JS TEMPLATES -->
            <script src="https://cdnjs.cloudflare.com/ajax/libs/liquidjs/10.9.2/liquid.browser.min.js"></script>
            <script>
                // Configurar Liquid para preview
                if (typeof Liquid !== 'undefined') {
                    window.liquidEngine = new Liquid.Liquid({
                        cache: false,
                        strictFilters: false,
                        strictVariables: false
                    });
                    
                    // Registrar filtros básicos para preview
                    window.liquidEngine.registerFilter('money', (value) => {
                        return new Intl.NumberFormat('es-ES', { 
                            style: 'currency', 
                            currency: 'EUR' 
                        }).format(value);
                    });
                    
                    window.liquidEngine.registerFilter('date_format', (value, format = 'short') => {
                        const date = new Date(value);
                        return date.toLocaleDateString('es-ES');
                    });
                    
                    console.log('🔄 Liquid engine configured for preview');
                }
            </script>
        `;
    },

    // ===================================================================
    // FILTROS PERSONALIZADOS
    // ===================================================================
    
    _registerCustomFilters() {
        // Filtro para formatear dinero
        this.liquid.registerFilter('money', (value, currency = 'EUR') => {
            return new Intl.NumberFormat('es-ES', { 
                style: 'currency', 
                currency: currency 
            }).format(value);
        });

        // Filtro para formatear fechas
        this.liquid.registerFilter('date_format', (value, format = 'short') => {
            const date = new Date(value);
            const options = {
                'short': { year: 'numeric', month: 'short', day: 'numeric' },
                'long': { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
                'time': { hour: '2-digit', minute: '2-digit' },
                'datetime': { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
            };
            return date.toLocaleDateString('es-ES', options[format] || options.short);
        });

        // Filtro para truncar texto
        this.liquid.registerFilter('truncate', (value, length = 100, suffix = '...') => {
            const str = String(value);
            return str.length > length ? str.substring(0, length) + suffix : str;
        });

        // Filtro para slug
        this.liquid.registerFilter('slugify', (value) => {
            return String(value)
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
        });

        console.log('✅ Custom filters registered');
    },

    // ===================================================================
    // TAGS PERSONALIZADOS
    // ===================================================================
    
    _registerCustomTags() {
        // Tag para incluir componentes
        this.liquid.registerTag('component', {
            parse: function(token) {
                const [name, ...args] = token.args.split(' ');
                this.name = name;
                this.args = args;
            },
            render: async function(ctx) {
                // Aquí se podría integrar con un sistema de componentes
                return `<!-- Component: ${this.name} -->`;
            }
        });

        // Tag para secciones condicionales
        this.liquid.registerTag('section', {
            parse: function(token) {
                this.condition = token.args;
            },
            render: async function(ctx) {
                return `<!-- Section: ${this.condition} -->`;
            }
        });

        console.log('✅ Custom tags registered');
    },

    // ===================================================================
    // TEMPLATES POR DEFECTO
    // ===================================================================
    
    async _loadDefaultTemplates() {
        const defaultTemplates = {
            'hero-basic': {
                content: `
<div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
    <div class="container mx-auto px-4 text-center">
        <h1 class="text-4xl md:text-6xl font-bold mb-6">
            {{ title | default: "Bienvenido a nuestro sitio" }}
        </h1>
        <p class="text-xl md:text-2xl mb-8 opacity-90">
            {{ subtitle | default: "Creamos experiencias increíbles" }}
        </p>
        {% if button_text %}
        <a href="{{ button_url | default: '#' }}" 
           class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            {{ button_text }}
        </a>
        {% endif %}
    </div>
</div>`,
                metadata: {
                    category: 'hero',
                    description: 'Hero section básico con título, subtítulo y botón',
                    variables: ['title', 'subtitle', 'button_text', 'button_url']
                }
            },

            'card-product': {
                content: `
<div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
    {% if image %}
    <img src="{{ image }}" alt="{{ title }}" class="w-full h-48 object-cover">
    {% endif %}
    
    <div class="p-6">
        <h3 class="text-xl font-semibold mb-2">{{ title }}</h3>
        
        {% if description %}
        <p class="text-gray-600 mb-4">{{ description | truncate: 100 }}</p>
        {% endif %}
        
        {% if price %}
        <div class="flex justify-between items-center">
            <span class="text-2xl font-bold text-green-600">
                {{ price | money }}
            </span>
            
            {% if button_text %}
            <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                {{ button_text | default: "Comprar" }}
            </button>
            {% endif %}
        </div>
        {% endif %}
    </div>
</div>`,
                metadata: {
                    category: 'product',
                    description: 'Tarjeta de producto con imagen, título, descripción y precio',
                    variables: ['image', 'title', 'description', 'price', 'button_text']
                }
            },

            'contact-form': {
                content: `
<div class="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
    <h2 class="text-2xl font-bold mb-6 text-center">
        {{ form_title | default: "Contáctanos" }}
    </h2>
    
    <form action="{{ form_action | default: '#' }}" method="POST" class="space-y-4">
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
                {{ name_label | default: "Nombre" }}
            </label>
            <input type="text" name="name" required 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
        
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
                {{ email_label | default: "Email" }}
            </label>
            <input type="email" name="email" required
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
        
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
                {{ message_label | default: "Mensaje" }}
            </label>
            <textarea name="message" rows="4" required
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        </div>
        
        <button type="submit" 
                class="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors">
            {{ submit_text | default: "Enviar mensaje" }}
        </button>
    </form>
</div>`,
                metadata: {
                    category: 'form',
                    description: 'Formulario de contacto responsive',
                    variables: ['form_title', 'form_action', 'name_label', 'email_label', 'message_label', 'submit_text']
                }
            }
        };

        // Cargar templates por defecto
        for (const [name, template] of Object.entries(defaultTemplates)) {
            await this.storage.saveTemplate(name, template);
        }

        console.log('✅ Default templates loaded');
    },

    // ===================================================================
    // INTEGRACIÓN CON OTROS PLUGINS
    // ===================================================================
    
    _setupPluginIntegration() {
        // Integrar con plugin de variables
        if (window.pluginManager?.get('variables')) {
            const variablesPlugin = window.pluginManager.get('variables');
            
            // Configurar Liquid para usar variables del plugin
            this.liquid.registerFilter('variable', (path) => {
                return variablesPlugin.getVariableValue(path) || '';
            });
            
            console.log('✅ Integrated with Variables plugin');
        }

        // Configurar funciones globales
        window.renderLiquidTemplate = (content, data) => this.renderTemplate(content, data);
    },

    // ===================================================================
    // UTILIDADES
    // ===================================================================
    
    _extractPosition(error) {
        // Extraer posición del error de Liquid.js
        const match = error.message.match(/line (\d+)/);
        return match ? parseInt(match[1]) : 0;
    },

    // ===================================================================
    // SNIPPETS PARA EDITOR
    // ===================================================================
    
    getSnippets() {
        return {
            'liquid-if': {
                label: 'Liquid If',
                body: '{% if ${1:condition} %}\n  ${2:content}\n{% endif %}',
                description: 'Condicional Liquid'
            },
            'liquid-for': {
                label: 'Liquid For',
                body: '{% for ${1:item} in ${2:collection} %}\n  ${3:content}\n{% endfor %}',
                description: 'Loop Liquid'
            },
            'liquid-variable': {
                label: 'Liquid Variable',
                body: '{{ ${1:variable} }}',
                description: 'Variable Liquid'
            },
            'liquid-filter': {
                label: 'Liquid Filter',
                body: '{{ ${1:variable} | ${2:filter} }}',
                description: 'Variable con filtro'
            }
        };
    },

    // ===================================================================
    // CLEANUP
    // ===================================================================
    
    async cleanup() {
        try {
            // Limpiar cache de Liquid
            this.liquid.cache.clear();
            
            // Cleanup de componentes
            if (this.storage) await this.storage.cleanup();
            if (this.validator) await this.validator.cleanup();
            if (this.renderer) await this.renderer.cleanup();
            
            // Limpiar funciones globales
            delete window.renderLiquidTemplate;
            
            console.log('🧹 Templates plugin cleaned up');
        } catch (error) {
            console.error('Error cleaning up templates plugin:', error);
        }
    }
};

export default templatesPlugin;
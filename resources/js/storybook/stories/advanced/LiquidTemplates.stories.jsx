// resources/js/storybook/stories/advanced/LiquidTemplates.stories.jsx
// 🌊 Stories avanzadas usando Liquid.js + Variables dinámicas

import LiquidVariableAdapter from '../../adapters/LiquidVariableAdapter.jsx';

export default {
  title: 'Advanced/Liquid Templates',
  component: LiquidVariableAdapter,
  parameters: {
    docs: {
      description: {
        component: 'Templates avanzados usando Liquid.js con variables dinámicas desde tu VariableController de Laravel. Demuestra el poder completo de tu sistema de variables + templating.'
      }
    }
  }
};

// ===================================================================
// TEMPLATE BÁSICO CON VARIABLES
// ===================================================================

export const BasicLiquidTemplate = {
  args: {
    templateData: {
      name: 'Landing Page Header',
      type: 'component',
      category: 'marketing',
      content: `
        <header class="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
          <div class="max-w-4xl mx-auto px-4 text-center">
            <h1 class="text-4xl md:text-6xl font-bold mb-6">
              {{ site.name | default: 'Mi Sitio Web' }}
            </h1>
            
            <p class="text-xl md:text-2xl mb-8 opacity-90">
              {{ site.description | default: 'Descripción increíble' }}
            </p>
            
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="{{ cta.primary_url | default: '#' }}" 
                 class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                {{ cta.primary_text | default: 'Comenzar Ahora' }}
              </a>
              
              <a href="{{ cta.secondary_url | default: '#' }}" 
                 class="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                {{ cta.secondary_text | default: 'Saber Más' }}
              </a>
            </div>
            
            <div class="mt-8 text-sm opacity-75">
              Última actualización: {{ current.date | format_date: 'long' }}
            </div>
          </div>
        </header>
      `
    },
    variables: {
      'site.name': 'SophieCMS',
      'site.description': 'El page builder más potente del mundo',
      'cta.primary_text': 'Probar Gratis',
      'cta.primary_url': '/register',
      'cta.secondary_text': 'Ver Demo',
      'cta.secondary_url': '/demo'
    },
    loadDynamicVariables: true
  },
  argTypes: {
    'variables.site.name': { 
      control: 'text',
      description: 'Nombre del sitio web'
    },
    'variables.site.description': { 
      control: 'text',
      description: 'Descripción del sitio'
    },
    'variables.cta.primary_text': { 
      control: 'text',
      description: 'Texto del botón principal'
    },
    'variables.cta.secondary_text': { 
      control: 'text',
      description: 'Texto del botón secundario'
    },
    loadDynamicVariables: {
      control: 'boolean',
      description: 'Cargar variables desde la API de Laravel'
    }
  }
};

// ===================================================================
// TEMPLATE CON LOOPS Y CONDICIONALES
// ===================================================================

export const AdvancedLiquidFeatures = {
  args: {
    templateData: {
      name: 'Features Grid with Liquid Logic',
      type: 'component',
      category: 'marketing',
      content: `
        <section class="py-16 bg-gray-50">
          <div class="max-w-7xl mx-auto px-4">
            
            <!-- Dynamic Title -->
            <div class="text-center mb-12">
              <h2 class="text-3xl font-bold text-gray-900 mb-4">
                {{ features.title | default: 'Características Increíbles' }}
              </h2>
              
              {% if features.subtitle %}
                <p class="text-xl text-gray-600">{{ features.subtitle }}</p>
              {% endif %}
            </div>
            
            <!-- Features Grid with Loop -->
            {% if features.items %}
              <div class="grid grid-cols-1 md:grid-cols-{{ features.columns | default: 3 }} gap-8">
                {% for feature in features.items %}
                  <div class="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    
                    <!-- Icon with conditional styling -->
                    {% if feature.icon %}
                      <div class="text-4xl mb-4 
                        {% if feature.highlight %}text-blue-500{% else %}text-gray-400{% endif %}">
                        {{ feature.icon }}
                      </div>
                    {% endif %}
                    
                    <!-- Title -->
                    <h3 class="text-xl font-semibold mb-2 
                      {% if feature.highlight %}text-blue-900{% else %}text-gray-900{% endif %}">
                      {{ feature.title }}
                    </h3>
                    
                    <!-- Description with truncate -->
                    <p class="text-gray-600 leading-relaxed">
                      {{ feature.description | smart_truncate: 120 }}
                    </p>
                    
                    <!-- Badge for highlighted features -->
                    {% if feature.highlight %}
                      <span class="inline-block mt-3 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        ⭐ Destacado
                      </span>
                    {% endif %}
                    
                    <!-- Loop info for debugging -->
                    {% if system.debug %}
                      <div class="mt-2 text-xs text-gray-400">
                        Item {{ forloop.index }} de {{ forloop.length }}
                        {% if forloop.first %} (Primero){% endif %}
                        {% if forloop.last %} (Último){% endif %}
                      </div>
                    {% endif %}
                  </div>
                {% endfor %}
              </div>
            {% else %}
              <!-- Fallback content -->
              <div class="text-center text-gray-500 py-8">
                <p>No hay características configuradas.</p>
                <p class="text-sm mt-2">Configura la variable 'features.items' para mostrar contenido.</p>
              </div>
            {% endif %}
            
            <!-- Stats Counter -->
            {% if company.stats %}
              <div class="mt-16 grid grid-cols-1 md:grid-cols-{{ company.stats | size }} gap-8 text-center">
                {% for stat in company.stats %}
                  <div>
                    <div class="text-3xl font-bold text-blue-600">{{ stat.value }}{{ stat.suffix }}</div>
                    <div class="text-gray-600">{{ stat.label }}</div>
                  </div>
                {% endfor %}
              </div>
            {% endif %}
          </div>
        </section>
      `
    },
    variables: {
      'features.title': 'Por qué elegir SophieCMS',
      'features.subtitle': 'Todo lo que necesitas para crear sitios web increíbles',
      'features.columns': 3,
      'features.items': [
        {
          icon: '🚀',
          title: 'Súper Rápido',
          description: 'Genera páginas en segundos con nuestro page builder avanzado y sistema de templates.',
          highlight: true
        },
        {
          icon: '🎨',
          title: 'Diseño Flexible',
          description: 'Personaliza cada aspecto con Tailwind CSS y variables dinámicas.',
          highlight: false
        },
        {
          icon: '⚡',
          title: 'Alpine.js Integrado',
          description: 'Agrega interactividad sin complicaciones usando Alpine.js de forma nativa.',
          highlight: true
        },
        {
          icon: '🌊',
          title: 'Liquid Templates',
          description: 'Sistema de templates potente con variables, loops y condicionales.',
          highlight: false
        },
        {
          icon: '💾',
          title: 'Base de Datos',
          description: 'Todos los componentes se guardan automáticamente en tu base de datos.',
          highlight: false
        },
        {
          icon: '📱',
          title: 'Responsive',
          description: 'Todos los componentes son completamente responsive por defecto.',
          highlight: true
        }
      ],
      'company.stats': [
        { value: '1000', suffix: '+', label: 'Usuarios Activos' },
        { value: '5000', suffix: '+', label: 'Sitios Creados' },
        { value: '99.9', suffix: '%', label: 'Uptime' }
      ],
      'system.debug': false
    },
    loadDynamicVariables: true
  },
  argTypes: {
    'variables.features.title': { control: 'text' },
    'variables.features.subtitle': { control: 'text' },
    'variables.features.columns': { 
      control: { type: 'select' },
      options: [1, 2, 3, 4]
    },
    'variables.system.debug': { 
      control: 'boolean',
      description: 'Mostrar información de debug en los loops'
    },
    loadDynamicVariables: { control: 'boolean' }
  }
};

// ===================================================================
// TEMPLATE DE CONTACTO CON FORMULARIO
// ===================================================================

export const ContactFormTemplate = {
  args: {
    templateData: {
      name: 'Contact Form with Variables',
      type: 'component',
      category: 'forms',
      content: `
        <section class="py-16 bg-white">
          <div class="max-w-4xl mx-auto px-4">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              <!-- Contact Info -->
              <div>
                <h2 class="text-3xl font-bold text-gray-900 mb-6">
                  {{ contact.title | default: 'Contáctanos' }}
                </h2>
                
                <p class="text-gray-600 mb-8">
                  {{ contact.description | default: 'Estamos aquí para ayudarte' }}
                </p>
                
                <div class="space-y-4">
                  {% if company.email %}
                    <div class="flex items-center">
                      <span class="text-blue-500 text-xl mr-3">📧</span>
                      <a href="mailto:{{ company.email }}" class="text-gray-700 hover:text-blue-600">
                        {{ company.email }}
                      </a>
                    </div>
                  {% endif %}
                  
                  {% if company.phone %}
                    <div class="flex items-center">
                      <span class="text-blue-500 text-xl mr-3">📞</span>
                      <a href="tel:{{ company.phone | remove: ' ' | remove: '-' }}" class="text-gray-700 hover:text-blue-600">
                        {{ company.phone }}
                      </a>
                    </div>
                  {% endif %}
                  
                  {% if company.address %}
                    <div class="flex items-center">
                      <span class="text-blue-500 text-xl mr-3">📍</span>
                      <span class="text-gray-700">{{ company.address }}</span>
                    </div>
                  {% endif %}
                </div>
                
                <!-- Business Hours -->
                {% if business.hours %}
                  <div class="mt-8">
                    <h3 class="font-semibold text-gray-900 mb-4">Horarios de Atención</h3>
                    <div class="space-y-2">
                      {% for schedule in business.hours %}
                        <div class="flex justify-between text-sm">
                          <span class="text-gray-600">{{ schedule.day }}:</span>
                          <span class="text-gray-900">{{ schedule.time }}</span>
                        </div>
                      {% endfor %}
                    </div>
                  </div>
                {% endif %}
              </div>
              
              <!-- Contact Form -->
              <div class="bg-gray-50 p-8 rounded-lg">
                <h3 class="text-xl font-semibold text-gray-900 mb-6">
                  {{ form.title | default: 'Envíanos un mensaje' }}
                </h3>
                
                <form class="space-y-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      {{ form.fields.name_label | default: 'Nombre completo' }}
                    </label>
                    <input type="text" 
                           placeholder="{{ form.fields.name_placeholder | default: 'Tu nombre' }}"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      {{ form.fields.email_label | default: 'Email' }}
                    </label>
                    <input type="email" 
                           placeholder="{{ form.fields.email_placeholder | default: 'tu@email.com' }}"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      {{ form.fields.message_label | default: 'Mensaje' }}
                    </label>
                    <textarea rows="4" 
                              placeholder="{{ form.fields.message_placeholder | default: 'Tu mensaje...' }}"
                              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
                  </div>
                  
                  <button type="submit" 
                          class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    {{ form.submit_text | default: 'Enviar Mensaje' }}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      `
    },
    variables: {
      'contact.title': 'Hablemos de tu proyecto',
      'contact.description': 'Estamos listos para ayudarte a crear algo increíble juntos.',
      'company.email': 'hola@sophiecms.com',
      'company.phone': '+1 (555) 123-4567',
      'company.address': 'Madrid, España',
      'business.hours': [
        { day: 'Lunes - Viernes', time: '9:00 - 18:00' },
        { day: 'Sábados', time: '10:00 - 14:00' },
        { day: 'Domingos', time: 'Cerrado' }
      ],
      'form.title': 'Cuéntanos sobre tu proyecto',
      'form.fields.name_label': 'Nombre',
      'form.fields.email_label': 'Email',
      'form.fields.message_label': 'Mensaje',
      'form.submit_text': 'Enviar Consulta'
    }
  }
};
// resources/js/storybook/stories/marketing/Hero.stories.jsx
// 🎯 Ejemplo REAL usando tu estructura de BD

import LaravelTemplateAdapter from '../../adapters/LaravelTemplateAdapter.jsx';

export default {
  title: 'Marketing/Hero',
  component: LaravelTemplateAdapter,
  parameters: {
    docs: {
      description: {
        component: 'Sección Hero para landing pages. Carga desde tu tabla `templates` con type="component" y category="marketing"'
      }
    }
  }
};

// Hero básico cargado desde BD
export const FromDatabase = {
  args: {
    templateType: 'component',
    templateCategory: 'marketing',
    // Variables que reemplazarán {{ variable }} en tu template
    variables: {
      title: 'Construye Sitios Web Increíbles',
      subtitle: 'Con nuestro page builder revolucionario',
      ctaText: 'Comenzar Ahora',
      ctaUrl: '/signup',
      backgroundImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920',
      overlayOpacity: '0.7'
    }
  },
  argTypes: {
    'variables.title': { 
      control: 'text',
      description: 'Título principal del hero'
    },
    'variables.subtitle': { 
      control: 'text',
      description: 'Subtítulo descriptivo'
    },
    'variables.ctaText': { 
      control: 'text',
      description: 'Texto del botón CTA'
    },
    'variables.ctaUrl': { 
      control: 'text',
      description: 'URL del botón'
    },
    'variables.backgroundImage': { 
      control: 'text',
      description: 'URL de imagen de fondo'
    },
    'variables.overlayOpacity': {
      control: { type: 'range', min: 0, max: 1, step: 0.1 },
      description: 'Opacidad del overlay'
    }
  }
};

// Hero con Alpine.js interactivo
export const WithAlpineJS = {
  args: {
    templateData: {
      name: 'Hero Interactivo',
      type: 'component',
      category: 'marketing',
      content: `
        <section class="relative h-screen flex items-center justify-center bg-cover bg-center" 
                 style="background-image: url('{{ backgroundImage }}');"
                 x-data="heroComponent">
          
          <!-- Overlay -->
          <div class="absolute inset-0 bg-black" 
               :style="'opacity: ' + overlayOpacity"></div>
          
          <!-- Content -->
          <div class="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
            <h1 class="text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up"
                x-text="title"></h1>
                
            <p class="text-xl md:text-2xl mb-8 opacity-90 animate-fade-in-up"
               x-text="subtitle"
               style="animation-delay: 0.2s;"></p>
               
            <button @click="handleCTAClick()"
                    class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105 animate-fade-in-up"
                    style="animation-delay: 0.4s;"
                    x-text="ctaText">
            </button>
            
            <!-- Stats Counter -->
            <div class="mt-12 grid grid-cols-3 gap-8 text-center animate-fade-in-up" style="animation-delay: 0.6s;">
              <div>
                <div class="text-3xl font-bold" x-text="stats.users + '+'"></div>
                <div class="text-sm opacity-75">Usuarios Activos</div>
              </div>
              <div>
                <div class="text-3xl font-bold" x-text="stats.websites + '+'"></div>
                <div class="text-sm opacity-75">Sitios Creados</div>
              </div>
              <div>
                <div class="text-3xl font-bold" x-text="stats.templates + '+'"></div>
                <div class="text-sm opacity-75">Templates</div>
              </div>
            </div>
          </div>
          
          <!-- Scroll indicator -->
          <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </div>
        </section>
        
        <script>
          Alpine.data('heroComponent', () => ({
            title: '{{ title }}',
            subtitle: '{{ subtitle }}',
            ctaText: '{{ ctaText }}',
            backgroundImage: '{{ backgroundImage }}',
            overlayOpacity: {{ overlayOpacity }},
            
            stats: {
              users: 0,
              websites: 0,
              templates: 0
            },
            
            init() {
              // Animar contadores
              this.animateCounters();
            },
            
            handleCTAClick() {
              alert('CTA Clicked! Redireccionar a: {{ ctaUrl }}');
              // En producción: window.location.href = '{{ ctaUrl }}';
            },
            
            animateCounters() {
              const targets = { users: 1500, websites: 5000, templates: 200 };
              const duration = 2000;
              
              Object.keys(targets).forEach(key => {
                const target = targets[key];
                const step = target / (duration / 50);
                
                const timer = setInterval(() => {
                  if (this.stats[key] < target) {
                    this.stats[key] = Math.min(this.stats[key] + step, target);
                  } else {
                    clearInterval(timer);
                    this.stats[key] = target;
                  }
                }, 50);
              });
            }
          }));
        </script>
        
        <style>
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-fade-in-up {
            animation: fade-in-up 0.8s ease-out forwards;
            opacity: 0;
          }
        </style>
      `
    },
    variables: {
      title: 'Transforma Ideas en Realidad',
      subtitle: 'Crea sitios web profesionales sin código',
      ctaText: 'Comenzar Gratis',
      ctaUrl: '/register',
      backgroundImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920',
      overlayOpacity: 0.6
    }
  }
};
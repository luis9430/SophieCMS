// resources/js/block-builder/plugins/alpine/index.js - SIMPLIFICADO

const alpinePlugin = {
    name: 'alpine',
    dependencies: ['variables'],
    previewPriority: 90,

    // Método init requerido
    async init(context) {
        console.log('✅ Alpine.js Plugin Initialized');
        return this;
    },

    getPreviewTemplate() {
        return `
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
<script>
    document.addEventListener('DOMContentLoaded', () => {
        window.$utils = {
            isMobile: () => window.innerWidth < 768,
            formatTime: () => new Date().toLocaleTimeString('es-ES'),
            randomColor: () => ['blue', 'green', 'purple'][Math.floor(Math.random() * 3)]
        };
    });

    document.addEventListener('alpine:init', () => {
        Alpine.store('global', {
            user: { name: 'Usuario Demo' },
            site: { title: 'Mi Sitio' },
            app: { name: 'Page Builder' }
        });
        
        Alpine.data('counter', () => ({
            count: 0,
            increment() { this.count++; },
            decrement() { this.count--; }
        }));

        Alpine.magic('utils', () => window.$utils);
    });
</script>`;
    }
};

export default alpinePlugin;
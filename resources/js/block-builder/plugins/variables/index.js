// resources/js/block-builder/plugins/variables/index.js - VERSIÓN SIMPLIFICADA

const variablesPlugin = {
    name: 'variables',
    version: '1.0.1',
    dependencies: [],
    previewPriority: 95,
    
    // Método init requerido
    async init(context) {
        console.log('✅ Variables Plugin Initialized');
        return this;
    },

    // Template para preview
    getPreviewTemplate() {
        return `
<script>
    document.addEventListener('DOMContentLoaded', () => {
        window.initialData = {
            user: { name: 'Usuario Demo', email: 'usuario@demo.com', role: 'user' },
            site: { title: 'Mi Sitio Web', url: window.location.origin },
            app: { name: 'Page Builder', version: '2.0.0' }
        };

        window.processVariables = (content) => {
            if (!content) return content;
            const vars = {
                'user.name': window.initialData.user.name,
                'user.email': window.initialData.user.email,
                'site.title': window.initialData.site.title,
                'current.date': new Date().toLocaleDateString('es-ES'),
                'current.time': new Date().toLocaleTimeString('es-ES')
            };
            let processed = content;
            Object.entries(vars).forEach(([key, value]) => {
                const regex = new RegExp(\`\\\\{\\\\{\\\\s*\${key.replace(/\\./g, '\\\\.')}\\\\s*\\\\}\\\\}\`, 'g');
                processed = processed.replace(regex, value);
            });
            return processed;
        };
        
        console.log('✅ Variables system ready');
    });
</script>`;
    },

    // Funciones básicas para compatibilidad
    getAvailableVariables() {
        return {
            user: { title: 'Usuario', variables: { 'user.name': 'Usuario Demo' } },
            site: { title: 'Sitio', variables: { 'site.title': 'Mi Sitio' } }
        };
    }
};

export default variablesPlugin;
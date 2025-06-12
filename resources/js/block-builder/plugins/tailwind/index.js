// resources/js/block-builder/plugins/tailwind/index.js - SIMPLIFICADO

const tailwindPlugin = {
    name: 'tailwind',
    previewPriority: 100,
    
    async init(context) {
        console.log('✅ Tailwind CSS Plugin Initialized');
        return this;
    },

    getPreviewTemplate() {
        // Usar CSS compilado de Laravel
        return `<link rel="stylesheet" href="/build/assets/app-Di9zQ_Kz.css">`;
    }
};

export default tailwindPlugin;
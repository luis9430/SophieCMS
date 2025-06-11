// resources/js/block-builder/plugins/tailwind/index.js

import { getTailwindCompletions } from './editor';

const tailwindPlugin = {
    name: 'tailwind',
    
    // AÑADE ESTE MÉTODO PARA CUMPLIR CON LAS REGLAS DEL MANAGER
    init() {
        console.log('✅ Tailwind CSS Plugin Initialized');
    },

    editor: {
        getCompletions: getTailwindCompletions,
    },
};

export default tailwindPlugin;
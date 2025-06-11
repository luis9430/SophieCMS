// resources/js/block-builder/plugins/alpine/index.js

import { getAlpineCompletions, AlpineEditor, createAlpineMode, registerAlpineHints } from './editor';
import { generatePreview } from './templates/preview';

const alpinePlugin = {
    name: 'alpine',
    dependencies: ['variables'], // Declara que necesita el plugin 'variables'

    init() {
        console.log('✅ Alpine.js Plugin Initialized');
    },

    getCompletions: getAlpineCompletions,
    generatePreview,
};

export default alpinePlugin;
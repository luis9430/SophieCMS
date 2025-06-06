// js/block-builder/blocks/BlockRegistry.js

import heroConfig from './Hero/config';
import textConfig from './Text/config';
import gridConfig from './Grid/config';

const blockRegistry = new Map();

const registerBlock = (config) => {
    if (config) { // Buena práctica: asegurar que el config no sea nulo/indefinido
        blockRegistry.set(config.id, config);
    }
};

registerBlock(heroConfig);
registerBlock(textConfig);
registerBlock(gridConfig);

export default blockRegistry;
export const availableBlocks = Array.from(blockRegistry.values());
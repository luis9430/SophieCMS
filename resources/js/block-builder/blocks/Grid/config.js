// js/block-builder/blocks/Grid/config.js

import { IconColumns } from '@tabler/icons-preact';

const gridConfig = {
    id: 'grid',
    name: 'Grid de Columnas',
    description: 'Añade columnas para organizar contenido.',
    category: 'layout', // Ideal para organizar tus componentes
    icon: IconColumns,
    color: 'grape',
    isContainer: true, // Es un contenedor especial
    
    // Configuración por defecto
    defaultConfig: {
        columns: 2,
        gap: '16px',
    },

    // No necesitamos un componente de Preact (`GridBlock.jsx`) porque
    // su renderizado se manejará directamente en PageBuilder.jsx
    component: null,
};

export default gridConfig;
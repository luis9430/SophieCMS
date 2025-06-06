import { IconLayout } from '@tabler/icons-preact';
import HeroBlock from './HeroBlock';
import HeroSettings from './HeroSettings';

export default {
    id: 'hero',
    name: 'Hero Section',
    description: 'Sección principal con título y CTA',
    icon: IconLayout,
    category: 'content',
    color: 'red',
    
    // Componente para renderizar el bloque en el canvas
    component: HeroBlock,
    
    // Componente para renderizar los ajustes en el panel lateral
    settingsComponent: HeroSettings,

    // Configuración por defecto al crear el bloque
    defaultConfig: {
        title: 'Título Impactante',
        subtitle: 'Subtítulo que describe tu propuesta de valor',
        buttonText: 'Comenzar Ahora',
        buttonUrl: '#'
    },

    // Estilos por defecto
    defaultStyles: {
        padding: 'md',
        margin: 'sm',
        textAlign: 'center',
        backgroundColor: 'transparent'
    }
};
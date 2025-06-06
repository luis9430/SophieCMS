import { IconLetterCaseLower } from '@tabler/icons-preact';
import TextBlock from './TextBlock';
import TextSettings from './TextSettings';

export default {
    id: 'text',
    name: 'Text Block',
    description: 'Párrafo de texto enriquecido',
    icon: IconLetterCaseLower,
    category: 'content',
    color: 'green',
    
    component: TextBlock,
    settingsComponent: TextSettings,

    defaultConfig: {
        content: 'Este es un párrafo de contenido. Puedes editarlo para agregar tu propio texto.'
    },

    defaultStyles: {
        padding: 'md',
        margin: 'sm',
        textAlign: 'left',
        backgroundColor: 'transparent'
    }
};
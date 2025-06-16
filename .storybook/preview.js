// .storybook/preview.js
// Configuración MÍNIMA para Storybook 9

// Importar Tailwind CSS
import '../resources/css/app.css';

export const parameters = {
  backgrounds: {
    default: 'light',
    values: [
      { name: 'light', value: '#ffffff' },
      { name: 'gray', value: '#f3f4f6' }
    ],
  },
};

export const decorators = [
  (Story) => (
    <div className="p-8">
      <Story />
    </div>
  ),
];
// .storybook/main.js
// Configuración FINAL para Storybook 9 + Preact

export default {
  stories: [
       "../resources/js/storybook/stories/**/*.stories.@(js|jsx)"
  ],
  
  // ✅ NO agregar addons - vienen incluidos en Storybook 9
  addons: [],
  
  framework: {
    name: "@storybook/preact-vite",
    options: {}
  },
  
  // ✅ Configurar variables de entorno y proxy
  viteFinal: async (config) => {
    // Variables de entorno para el navegador
    config.define = {
      ...config.define,
      'process.env.STORYBOOK_MODE': JSON.stringify('true'),
      'process.env.LARAVEL_BASE_URL': JSON.stringify('http://127.0.0.1:8000'),
      'process.env.NODE_ENV': JSON.stringify('development')
    };
    
    // Configurar proxy para evitar CORS
    config.server = {
      ...config.server,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false
        },
        '/admin': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false
        }
      }
    };
    
    return config;
  }
};
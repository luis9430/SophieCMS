import './bootstrap';

// Importar Alpine.js
import Alpine from 'alpinejs';

// Hacer Alpine disponible globalmente
window.Alpine = Alpine;

// Inicializar Alpine al final
Alpine.start();

console.log('✅ Alpine.js loaded via app.js');
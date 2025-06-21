// resources/js/app.js
import './bootstrap';

// ⚠️ IMPORTANTE: NO inicializar Alpine aquí para evitar conflictos con Moonshine

// Importar Alpine.js SOLO para hacerlo disponible globalmente
import Alpine from 'alpinejs';

// Hacer Alpine disponible globalmente pero NO inicializarlo
window.Alpine = Alpine;

// ✅ NO llamar Alpine.start() - Moonshine se encarga de la inicialización

console.log('✅ Alpine.js loaded and available globally (not started)');
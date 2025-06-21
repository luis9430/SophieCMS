// resources/js/app.js - Versión final simplificada
import './bootstrap';
import Alpine from 'alpinejs';
import { gsap } from 'gsap';
import AlpineComponents from './components/AlpineComponents.js';

// 🌍 Configuración global
window.gsap = gsap;
window.Alpine = Alpine;

// 🎯 Registrar todos los componentes Alpine ANTES de iniciar
console.log('📦 Registering Alpine components...');
AlpineComponents.registerAll();

// ⏳ Esperar a que el DOM esté listo Y los componentes registrados
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM ready, starting Alpine...');
    
    // 🚀 AHORA sí inicializar Alpine
    Alpine.start();
    
    // 📡 Emitir evento de app lista DESPUÉS de Alpine.start()
    setTimeout(() => {
        document.dispatchEvent(new CustomEvent('app:ready', {
            detail: {
                timestamp: new Date().toISOString(),
                components: AlpineComponents.getAvailableComponents(),
                gsapVersion: gsap.version,
                alpineVersion: Alpine.version
            }
        }));
        
        console.log('📡 App ready event emitted');
    }, 100);
});

// 🐛 Debug en desarrollo
if (import.meta.env.DEV) {
    window.AlpineComponents = AlpineComponents;
    
    console.log('🎿 Alpine components registered, waiting for DOM...');
    console.log('📦 Available components:', AlpineComponents.getAvailableComponents());
    console.log('✨ GSAP version:', gsap.version);
    
    // Helper para debugging
    window.debugAlpine = () => {
        console.log('🐛 Alpine Debug Info:');
        console.log('Components:', AlpineComponents.getAvailableComponents());
        console.log('GSAP available:', typeof gsap !== 'undefined');
        console.log('Alpine elements:', document.querySelectorAll('[x-data]').length);
        console.log('Alpine started:', Alpine._isStarted || 'unknown');
    };
}

export default AlpineComponents;
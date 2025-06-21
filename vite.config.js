import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import preact from '@preact/preset-vite';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css', 
                'resources/js/app.js',                    
                'resources/js/preact-app.jsx',
                'resources/js/component-preview.js',      
            ],
            refresh: true,
        }),
        tailwindcss(),
        preact(), 
    ],
    resolve: {
        alias: {
            'react': 'preact/compat',
            'react-dom': 'preact/compat',
            '@mdx-system': path.resolve(process.cwd(), './resources/js/mdx-system'),
            '@': path.resolve(process.cwd(), './resources/js'),
            '@libraries': path.resolve(process.cwd(), './resources/js/libraries'), 
        }
    },
    esbuild: {
        jsxFactory: 'h',
        jsxFragment: 'Fragment',
        jsxInject: `import { h, Fragment } from 'preact'`
    },
    
    optimizeDeps: {
        include: [
            'alpinejs', 
            'gsap',
            // Incluir librerías que se usan frecuentemente
        ],
        exclude: [
            // Excluir librerías que se cargan dinámicamente
            'fullcalendar'
        ]
    },
    
    // ✅ Build optimizations
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Separar Alpine y GSAP en chunks separados para mejor caching
                    'alpine': ['alpinejs'],
                    'gsap': ['gsap'],
                    // Librerías del sistema centralizado
                    'app-core': ['./resources/js/libraries/library-manager.js']
                }
            }
        },
        // Optimizar para el sistema de componentes
        chunkSizeWarningLimit: 1000,
    },
    
    // ✅ Dev server configuration
    server: {
        // HMR optimizado para desarrollo de componentes
        hmr: {
            overlay: true
        },
        // Proxy para assets externos en desarrollo
        proxy: {
            // Si necesitas proxear CDNs en desarrollo
        }
    },
    
    // ✅ CSS configuration
    css: {
        devSourcemap: true,
        preprocessorOptions: {
            // Configuraciones adicionales si usas Sass/Less
        }
    }
});
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
                // component-preview.js removido - no necesario
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
            // ❌ Removidos: @libraries, @adapters, @core - ya no existen
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
            // Solo las librerías esenciales
        ],
        exclude: [
            // Librerías que se cargan dinámicamente (si las hay)
        ]
    },
    
    // ✅ Build optimizations simplificado
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Separar librerías principales para mejor caching
                    'alpine': ['alpinejs'],
                    'gsap': ['gsap'],
                    // app-core será automático
                }
            }
        },
        chunkSizeWarningLimit: 1000,
    },
    
    // ✅ Dev server configuration limpio
    server: {
        hmr: {
            overlay: true,
            port: 5174
        },
        proxy: {
            '/preview': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                secure: false
            }
        }
    },
    
    css: {
        devSourcemap: true,
    },
    
    // ✅ Variables globales simplificadas
    define: {
        __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
        __GSAP_VERSION__: JSON.stringify('3.13.0'),
        __ALPINE_VERSION__: JSON.stringify('3.14.9')
    }
});
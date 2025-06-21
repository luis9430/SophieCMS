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
            '@adapters': path.resolve(process.cwd(), './resources/js/libraries/adapters'),
            '@core': path.resolve(process.cwd(), './resources/js/libraries/core'),
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
            // Solo incluir paquetes npm, no archivos locales
        ],
        exclude: [
            // Excluir librerías que se cargan dinámicamente
            'swiper'
        ]
    },
    
    // ✅ Build optimizations mejoradas
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Separar Alpine y GSAP en chunks separados para mejor caching
                    'alpine': ['alpinejs'],
                    'gsap': ['gsap'],
                    // Los archivos locales no van en manualChunks
                }
            }
        },
        // Optimizar para el sistema de componentes
        chunkSizeWarningLimit: 1000,
        
        // Configuración específica para librerías
        target: 'es2015',
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: false, // Mantener console.log en producción para debugging
                drop_debugger: true
            }
        }
    },
    
    // ✅ Dev server configuration optimizado
    server: {
        // HMR optimizado para desarrollo de componentes
        hmr: {
            overlay: true,
            port: 5174 // Puerto diferente para evitar conflictos
        },
        
        // Configuración de proxy para preview
        proxy: {
            // Proxy para assets de componentes en desarrollo
            '/preview': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                secure: false
            }
        },
        
        // Optimización de dependencies
        fs: {
            allow: ['..'] // Permitir acceso a archivos fuera del directorio del proyecto
        }
    },
    
    // ✅ CSS configuration
    css: {
        devSourcemap: true,
        preprocessorOptions: {
            // Configuraciones adicionales si usas Sass/Less
        }
    },
    
    // ✅ Configuración específica para el sistema de librerías
    define: {
        // Variables globales para el sistema
        __LIBRARY_SYSTEM_DEBUG__: JSON.stringify(process.env.NODE_ENV === 'development'),
        __MOONSHINE_COMPATIBLE__: true,
        __GSAP_VERSION__: JSON.stringify('3.13.0'),
        __ALPINE_VERSION__: JSON.stringify('3.14.9')
    }
});
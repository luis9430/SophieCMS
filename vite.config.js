import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import preact from '@preact/preset-vite';
import path from 'path'; // ← ESTA LÍNEA FALTABA

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css', 
                'resources/js/app.js',
                'resources/js/preact-app.jsx' // Nuevo entry point para Preact
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
            '@mdx-system': path.resolve(process.cwd(), './resources/js/mdx-system'), // También mejoré esta línea
            '@': path.resolve(process.cwd(), './resources/js') // Alias adicional útil
        }
    },
    esbuild: {
        jsxFactory: 'h',
        jsxFragment: 'Fragment',
        jsxInject: `import { h, Fragment } from 'preact'`
    }
});
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import preact from '@preact/preset-vite';
import monacoEditorPlugin from 'vite-plugin-monaco-editor'; 

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
        monacoEditorPlugin.default({})

    ],
    resolve: {
        alias: {
            'react': 'preact/compat',
            'react-dom': 'preact/compat'
        }
    },
    esbuild: {
        jsxFactory: 'h',
        jsxFragment: 'Fragment',
        jsxInject: `import { h, Fragment } from 'preact'`
    }
});
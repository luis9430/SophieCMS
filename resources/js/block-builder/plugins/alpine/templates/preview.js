// resources/js/block-builder/plugins/alpine/templates/preview.js

import { alpineScriptsTemplate } from './scripts.js';

/**
 * Genera el HTML completo para el iframe de previsualización.
 */
export function generatePreview(content) {
    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Preview</title>

            <!-- Tailwind CSS desde CDN -->
            <script>
                window.tailwind = {
                    config: {
                        darkMode: 'class',
                        theme: {
                            extend: {
                                colors: {
                                    'custom-blue': '#3B82F6',
                                    'custom-purple': '#8B5CF6'
                                }
                            }
                        }
                    }
                }
            </script>
            <script src="https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio"></script>

            ${alpineScriptsTemplate}

            <style>
                body { 
                    font-family: sans-serif;
                    padding: 1rem;
                    background-color: #fff;
                }
                [x-cloak] { 
                    display: none !important; 
                }
            </style>
        </head>
        <body>
            ${content}
        </body>
        </html>
    `;
}
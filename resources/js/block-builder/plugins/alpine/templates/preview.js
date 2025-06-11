// resources/js/block-builder/plugins/alpine/templates/preview.js

// 1. IMPORTACIÓN CORREGIDA:
//    Cambiamos la importación por defecto por una con nombre, usando llaves {}.
//    El nombre debe coincidir exactamente con la constante exportada en scripts.js.
import { alpineScriptsTemplate } from './scripts.js';


const TAILWIND_CSS_PATH = '../../../../css/app.css';

/**
 * Genera el HTML completo para el iframe de previsualización.
 */
export function generatePreview(content) {
    // 2. USO:
    //    Esto no cambia, ya que el nombre de la variable importada es el mismo.
    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Preview</title>

            <link href="${TAILWIND_CSS_PATH}" rel="stylesheet">

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
// resources/js/block-builder/hooks/useAlpinePreview.js

import { useRef, useCallback } from 'preact/hooks';
import { getPlugin } from '../core/PluginManager';

const useAlpinePreview = () => {
    const previewRef = useRef(null);

    const updatePreview = useCallback((content) => {
        if (!previewRef.current) return;

        const alpinePlugin = getPlugin('alpine');
        const tailwindPlugin = getPlugin('tailwind');

        // Base preview template with Alpine.js setup
        const baseTemplate = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                
                <!-- Tailwind Configuration -->
                <script>
                    tailwind = {
                        config: {
                            darkMode: 'class',
                            theme: {
                                extend: {}
                            }
                        }
                    }
                </script>
                <script src="https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio"></script>
                
                <!-- Alpine.js and Dependencies -->
                <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
                
                <!-- Custom Styles -->
                <style>
                    [x-cloak] { display: none !important; }
                    .fade-in { opacity: 0; transition: opacity 0.3s ease-in-out; }
                    .fade-in.visible { opacity: 1; }
                </style>

                <!-- Initialize Alpine.js Data -->
                <script>
                    document.addEventListener('DOMContentLoaded', () => {
                        window.$utils = {
                            isMobile: () => window.innerWidth < 768,
                            formatTime: () => new Date().toLocaleTimeString(),
                            fadeIn: (el) => {
                                el.classList.add('fade-in');
                                setTimeout(() => el.classList.add('visible'), 50);
                            }
                        };
                    });

                    document.addEventListener('alpine:init', () => {
                        Alpine.store('global', {
                            user: {
                                name: 'Guest User',
                                role: 'visitor'
                            },
                            app: {
                                name: 'SophieCMS',
                                version: '1.0.0',
                                env: 'development'
                            },
                            theme: 'light',
                            site: {
                                title: 'My Site',
                                description: 'Welcome to my site'
                            }
                        });
                    });
                </script>

                ${tailwindPlugin?.getPreviewStyles?.() || ''}
            </head>
            <body class="bg-white dark:bg-gray-900">
                <div x-data class="min-h-screen">
                    ${content}
                </div>
            </body>
            </html>
        `;

        // Generate preview using plugins if available
        const previewHtml = alpinePlugin?.generatePreview?.(baseTemplate) || baseTemplate;
            
        const doc = previewRef.current.contentWindow.document;
        doc.open();
        doc.write(previewHtml);
        doc.close();
    }, []);

    return { previewRef, updatePreview };
};

export default useAlpinePreview;
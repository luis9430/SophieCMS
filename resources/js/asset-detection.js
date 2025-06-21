// resources/js/asset-detection.js
// Sistema de auto-detección para el Asset Manager

class AssetDetector {
    constructor() {
        this.debounceTimer = null;
        this.lastDetection = null;
        this.callbacks = [];
    }

    // Detectar assets en tiempo real mientras el usuario escribe
    detectInRealTime(bladeCode, callback) {
        // Debounce para evitar demasiadas requests
        clearTimeout(this.debounceTimer);
        
        this.debounceTimer = setTimeout(() => {
            this.performDetection(bladeCode, callback);
        }, 800); // Esperar 800ms después de que el usuario pare de escribir
    }

    // Realizar detección inmediata
    async performDetection(bladeCode, callback) {
        try {
            const response = await fetch('/admin/page-builder/detect-assets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({ blade_code: bladeCode })
            });

            const result = await response.json();
            
            if (result.success) {
                this.lastDetection = result;
                
                // Notificar a todos los callbacks registrados
                this.callbacks.forEach(cb => cb(result));
                
                // Ejecutar callback específico si se proporciona
                if (callback) callback(result);
                
                console.log('🔍 Assets detectados:', result.detected);
                console.log('💡 Sugerencias:', result.suggestions);
                
            } else {
                console.error('Error en detección:', result.error);
            }
            
        } catch (error) {
            console.error('Error detectando assets:', error);
        }
    }

    // Registrar callback para recibir notificaciones
    onDetection(callback) {
        this.callbacks.push(callback);
    }

    // Obtener última detección
    getLastDetection() {
        return this.lastDetection;
    }

    // Generar sugerencias visuales para el Asset Manager
    generateSuggestions(detectionResult) {
        if (!detectionResult || !detectionResult.suggestions) return [];

        return detectionResult.suggestions.map(suggestion => {
            const icon = this.getIconForLibrary(suggestion.library);
            const badgeClass = suggestion.type === 'strong' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
            
            return {
                library: suggestion.library,
                html: `
                    <div class="suggestion-item p-3 border border-gray-200 rounded-lg mb-2 ${badgeClass}">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <span class="text-2xl mr-3">${icon}</span>
                                <div>
                                    <div class="font-semibold">${suggestion.message}</div>
                                    <div class="text-sm opacity-75">${suggestion.reason}</div>
                                </div>
                            </div>
                            <button class="add-asset-btn px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600" 
                                    data-library="${suggestion.library}">
                                Agregar
                            </button>
                        </div>
                    </div>
                `
            };
        });
    }

    // Iconos para cada librería
    getIconForLibrary(library) {
        const icons = {
            'gsap': '🎭',
            'swiper': '🎠', 
            'fullcalendar': '📅',
            'aos': '✨',
            'chartjs': '📊',
            'dompurify': '🛡️'
        };
        return icons[library] || '📦';
    }

    // Integrar con checkboxes existentes del Asset Manager
    updateAssetManager(detectionResult) {
        if (!detectionResult) return;

        const detected = detectionResult.detected || [];
        const detailed = detectionResult.detailed || {};

        // Actualizar checkboxes
        detected.forEach(library => {
            const checkbox = document.querySelector(`input[name="assets[]"][value="${library}"]`);
            if (checkbox && !checkbox.checked) {
                // Marcar como sugerido (diferente color)
                checkbox.parentElement.classList.add('suggested-asset');
                
                // Agregar badge de "detectado automáticamente"
                if (!checkbox.parentElement.querySelector('.auto-detected-badge')) {
                    const badge = document.createElement('span');
                    badge.className = 'auto-detected-badge ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded';
                    badge.textContent = 'Auto-detectado';
                    checkbox.parentElement.appendChild(badge);
                }
            }
        });

        // Mostrar nivel de confianza para assets detectados
        Object.entries(detailed).forEach(([library, data]) => {
            const checkbox = document.querySelector(`input[name="assets[]"][value="${library}"]`);
            if (checkbox) {
                const confidence = data.confidence;
                const confidenceElement = checkbox.parentElement.querySelector('.confidence-indicator') || 
                                        document.createElement('div');
                
                confidenceElement.className = 'confidence-indicator text-xs mt-1';
                confidenceElement.innerHTML = `
                    <div class="flex items-center">
                        <div class="w-full bg-gray-200 rounded-full h-1.5 mr-2">
                            <div class="bg-blue-600 h-1.5 rounded-full" style="width: ${confidence}%"></div>
                        </div>
                        <span>${confidence}%</span>
                    </div>
                `;
                
                if (!checkbox.parentElement.querySelector('.confidence-indicator')) {
                    checkbox.parentElement.appendChild(confidenceElement);
                }
            }
        });
    }

    // Mostrar panel de sugerencias
    showSuggestionsPanel(detectionResult) {
        const suggestions = this.generateSuggestions(detectionResult);
        
        // Buscar o crear panel de sugerencias
        let panel = document.getElementById('asset-suggestions-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'asset-suggestions-panel';
            panel.className = 'mt-4 p-4 bg-gray-50 rounded-lg border';
            
            // Insertar después del Asset Manager
            const assetManager = document.querySelector('.asset-manager') || 
                    document.querySelector('[data-asset-manager]') ||
                    document.querySelector('#assets-section'); // ← Ajusta según tu HTML
            if (assetManager) {
                assetManager.appendChild(panel);
            }
        }

        if (suggestions.length > 0) {
            panel.innerHTML = `
                <h4 class="font-semibold mb-3 flex items-center">
                    🔍 Sugerencias de Assets
                    <span class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">${suggestions.length}</span>
                </h4>
                ${suggestions.map(s => s.html).join('')}
            `;
            panel.style.display = 'block';
            
            // Agregar event listeners para botones "Agregar"
            panel.querySelectorAll('.add-asset-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const library = e.target.dataset.library;
                    this.addAssetToManager(library);
                    e.target.textContent = '✓ Agregado';
                    e.target.disabled = true;
                });
            });
            
        } else {
            panel.style.display = 'none';
        }
    }

    // Agregar asset al Asset Manager
    addAssetToManager(library) {
        const checkbox = document.querySelector(`input[name="assets[]"][value="${library}"]`);
        if (checkbox) {
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change')); // Trigger cualquier listener existente
            
            // Feedback visual
            checkbox.parentElement.classList.add('recently-added');
            setTimeout(() => {
                checkbox.parentElement.classList.remove('recently-added');
            }, 2000);
        }
    }
}

// Inicializar detector global
window.AssetDetector = new AssetDetector();

// Integración con editor de código (cuando esté disponible)
document.addEventListener('DOMContentLoaded', () => {
    // Buscar editor de código (ajustar selector según tu implementación)
const codeEditor = document.querySelector('[data-code-editor]') || 
                  document.querySelector('.code-editor') ||
                  document.querySelector('textarea[name="blade_template"]') ||
                  document.querySelector('#blade-template-editor'); 
    
    if (codeEditor) {
        console.log('🔗 Asset detector conectado al editor');
        
        // Detectar cambios en el código
        codeEditor.addEventListener('input', (e) => {
            const code = e.target.value;
            window.AssetDetector.detectInRealTime(code, (result) => {
                window.AssetDetector.updateAssetManager(result);
                window.AssetDetector.showSuggestionsPanel(result);
            });
        });
        
        // Detección inicial si ya hay código
        if (codeEditor.value) {
            window.AssetDetector.performDetection(codeEditor.value, (result) => {
                window.AssetDetector.updateAssetManager(result);
                window.AssetDetector.showSuggestionsPanel(result);
            });
        }
    }
});

// CSS adicional para las sugerencias (agregar a tu CSS)
const additionalCSS = `
.suggested-asset {
    background-color: #eff6ff !important;
    border-left: 3px solid #3b82f6;
    padding-left: 8px;
}

.recently-added {
    background-color: #f0fdf4 !important;
    border-left: 3px solid #22c55e;
    transition: all 0.3s ease;
}

.auto-detected-badge {
    animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

.suggestion-item {
    animation: slideIn 0.3s ease;
}

@keyframes slideIn {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
}
`;

// Inyectar CSS si no existe
if (!document.getElementById('asset-detection-styles')) {
    const style = document.createElement('style');
    style.id = 'asset-detection-styles';
    style.textContent = additionalCSS;
    document.head.appendChild(style);
}

console.log('✅ Asset Detection System loaded');
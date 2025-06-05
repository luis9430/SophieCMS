<?php
// app/Services/BlockBuilder/BaseBlock.php

namespace App\Services\BlockBuilder;

use App\Services\BlockBuilder\Contracts\BlockInterface;

abstract class BaseBlock implements BlockInterface
{
    protected array $config = [];
    protected array $styles = [];
    protected string $blockId;

    public function __construct(array $config = [], array $styles = [])
    {
        $this->config = array_merge($this->getDefaultConfig(), $config);
        $this->styles = array_merge($this->getDefaultStyles(), $styles);
        $this->blockId = uniqid('block_');
    }

    // ===================================
    // MÉTODOS ABSTRACTOS
    // ===================================
    abstract public function render(): string;
    abstract public function getMetadata(): array;
    abstract protected function getDefaultConfig(): array;
    abstract protected function getDefaultStyles(): array;

    // ===================================
    // IMPLEMENTACIÓN DE BLOCKINTERFACE
    // ===================================

    /**
     * Obtiene la configuración del bloque
     */
    public function getConfig(): array
    {
        return $this->config;
    }

    /**
     * Establece la configuración del bloque
     */
    public function setConfig(array $config): self
    {
        $this->config = array_merge($this->config, $config);
        return $this;
    }

    /**
     * Valida la configuración del bloque
     */
    public function validate(): bool
    {
        $errors = $this->getValidationErrors();
        return empty($errors);
    }

    /**
     * Obtiene el esquema de configuración para el panel de settings
     */
    public function getSettingsSchema(): array
    {
        return [
            'content' => $this->getContentSchema(),
            'layout' => $this->getLayoutSchema(),
            'style' => $this->getStyleSchema(),
        ];
    }

    /**
     * Obtiene el tipo de bloque
     */
    public function getType(): string
    {
        // Por defecto usa el nombre de la clase sin namespace ni "Block"
        $className = basename(str_replace('\\', '/', static::class));
        return strtolower(str_replace('Block', '', $className));
    }

    /**
     * Obtiene los estilos del bloque
     */
    public function getStyles(): array
    {
        return $this->styles;
    }

    /**
     * Establece los estilos del bloque
     */
    public function setStyles(array $styles): self
    {
        $this->styles = array_merge($this->styles, $styles);
        return $this;
    }

    /**
     * Renderiza solo para preview (por defecto usa el mismo render)
     */
    public function renderPreview(): string
    {
        // Por defecto, el preview es igual al render final
        // Los bloques pueden sobrescribir este método si necesitan un preview diferente
        return $this->render();
    }

    // ===================================
    // MÉTODOS AUXILIARES
    // ===================================

    /**
     * Obtiene el ID único del bloque
     */
    public function getId(): string
    {
        return $this->blockId;
    }

    /**
     * Obtiene los errores de validación en formato array
     */
    public function getValidationErrors(): array
    {
        $errors = [];
        
        // Validaciones comunes
        $errors = array_merge($errors, $this->validateConfig());
        $errors = array_merge($errors, $this->validateStyles());
        $errors = array_merge($errors, $this->validateCustomRules());
        
        return $errors;
    }

    /**
     * Verifica si el bloque es válido (alias de validate)
     */
    public function isValid(): bool
    {
        return $this->validate();
    }

    /**
     * Serializa el bloque a array para export/import
     */
    public function toArray(): array
    {
        return [
            'id' => $this->blockId,
            'type' => $this->getType(),
            'config' => $this->config,
            'styles' => $this->styles,
            'metadata' => $this->getMetadata(),
        ];
    }

    /**
     * Carga un bloque desde array
     */
    public function fromArray(array $data): self
    {
        $this->blockId = $data['id'] ?? $this->blockId;
        $this->config = array_merge($this->getDefaultConfig(), $data['config'] ?? []);
        $this->styles = array_merge($this->getDefaultStyles(), $data['styles'] ?? []);
        
        return $this;
    }

    /**
     * Clona el bloque con nuevo ID
     */
    public function duplicate(): self
    {
        $cloned = clone $this;
        $cloned->blockId = uniqid('block_');
        return $cloned;
    }

    // ===================================
    // MÉTODOS DE VALIDACIÓN
    // ===================================

    /**
     * Valida la configuración específica del bloque
     */
    protected function validateConfig(): array
    {
        $errors = [];

        // Validar URLs si existen
        if (isset($this->config['button_url']) && !empty($this->config['button_url'])) {
            if (!filter_var($this->config['button_url'], FILTER_VALIDATE_URL) && !str_starts_with($this->config['button_url'], '#')) {
                $errors[] = 'La URL del botón no es válida';
            }
        }

        // Validar campos requeridos
        foreach ($this->getRequiredConfigFields() as $field) {
            if (empty($this->config[$field])) {
                $errors[] = "El campo '{$field}' es requerido";
            }
        }

        return $errors;
    }

    /**
     * Valida los estilos del bloque
     */
    protected function validateStyles(): array
    {
        $errors = [];
        
        // Validar valores de estilo válidos
        $validSpacing = ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'];
        if (isset($this->styles['spacing']) && !in_array($this->styles['spacing'], $validSpacing)) {
            $errors[] = 'Valor de espaciado inválido';
        }

        $validContainer = ['full', 'container', 'narrow', 'wide'];
        if (isset($this->styles['container']) && !in_array($this->styles['container'], $validContainer)) {
            $errors[] = 'Valor de contenedor inválido';
        }

        $validTextAlign = ['left', 'center', 'right'];
        if (isset($this->styles['text_align']) && !in_array($this->styles['text_align'], $validTextAlign)) {
            $errors[] = 'Valor de alineación de texto inválido';
        }

        return $errors;
    }

    /**
     * Validaciones personalizadas que cada bloque puede sobrescribir
     */
    protected function validateCustomRules(): array
    {
        return [];
    }

    /**
     * Campos requeridos de configuración (cada bloque puede sobrescribir)
     */
    protected function getRequiredConfigFields(): array
    {
        return [];
    }

    // ===================================
    // ESQUEMAS DE CONFIGURACIÓN
    // ===================================

    /**
     * Esquema de configuración de contenido
     */
    protected function getContentSchema(): array
    {
        return [
            'title' => [
                'type' => 'text',
                'label' => 'Título',
                'default' => '',
                'required' => false,
                'placeholder' => 'Escribe el título...'
            ],
            'subtitle' => [
                'type' => 'textarea',
                'label' => 'Subtítulo',
                'default' => '',
                'required' => false,
                'placeholder' => 'Escribe el subtítulo...'
            ],
            'content' => [
                'type' => 'textarea',
                'label' => 'Contenido',
                'default' => '',
                'required' => false,
                'placeholder' => 'Escribe el contenido...'
            ],
        ];
    }

    /**
     * Esquema de configuración de layout
     */
    protected function getLayoutSchema(): array
    {
        return [
            'spacing' => [
                'type' => 'select',
                'label' => 'Espaciado',
                'options' => [
                    'none' => 'Sin espaciado',
                    'xs' => 'Muy pequeño (4px)',
                    'sm' => 'Pequeño (16px)',
                    'md' => 'Medio (32px)',
                    'lg' => 'Grande (64px)',
                    'xl' => 'Muy grande (96px)',
                    '2xl' => 'Extra grande (128px)',
                ],
                'default' => 'md',
            ],
            'margin' => [
                'type' => 'select',
                'label' => 'Margen',
                'options' => [
                    'none' => 'Sin margen',
                    'xs' => 'Muy pequeño',
                    'sm' => 'Pequeño',
                    'md' => 'Medio',
                    'lg' => 'Grande',
                    'xl' => 'Muy grande',
                ],
                'default' => 'none',
            ],
            'container' => [
                'type' => 'select',
                'label' => 'Ancho del contenedor',
                'options' => [
                    'full' => 'Ancho completo',
                    'container' => 'Contenedor estándar (1280px)',
                    'narrow' => 'Estrecho (768px)',
                    'wide' => 'Amplio (1400px)',
                ],
                'default' => 'container',
            ],
            'text_align' => [
                'type' => 'select',
                'label' => 'Alineación del texto',
                'options' => [
                    'left' => 'Izquierda',
                    'center' => 'Centro',
                    'right' => 'Derecha',
                ],
                'default' => 'left',
            ],
        ];
    }

    /**
     * Esquema de configuración de estilos
     */
    protected function getStyleSchema(): array
    {
        return [
            'background' => [
                'type' => 'select',
                'label' => 'Color de fondo',
                'options' => [
                    'transparent' => 'Transparente',
                    'white' => 'Blanco',
                    'gray-50' => 'Gris muy claro',
                    'gray-100' => 'Gris claro',
                    'blue-500' => 'Azul',
                    'blue-600' => 'Azul oscuro',
                    'green-500' => 'Verde',
                    'green-600' => 'Verde oscuro',
                    'purple-500' => 'Morado',
                    'purple-600' => 'Morado oscuro',
                    'red-500' => 'Rojo',
                    'yellow-500' => 'Amarillo',
                ],
                'default' => 'transparent',
            ],
            'text_color' => [
                'type' => 'select',
                'label' => 'Color del texto',
                'options' => [
                    'inherit' => 'Heredado',
                    'black' => 'Negro',
                    'white' => 'Blanco',
                    'gray-600' => 'Gris',
                    'gray-800' => 'Gris oscuro',
                    'blue-600' => 'Azul',
                    'green-600' => 'Verde',
                    'purple-600' => 'Morado',
                    'red-600' => 'Rojo',
                ],
                'default' => 'inherit',
            ],
            'title_size' => [
                'type' => 'select',
                'label' => 'Tamaño del título',
                'options' => [
                    'text-xl' => 'Muy pequeño',
                    'text-2xl' => 'Pequeño',
                    'text-3xl' => 'Medio',
                    'text-4xl' => 'Grande',
                    'text-5xl' => 'Muy grande',
                    'text-6xl' => 'Extra grande',
                ],
                'default' => 'text-3xl',
            ],
            'font_weight' => [
                'type' => 'select',
                'label' => 'Peso de la fuente',
                'options' => [
                    'font-normal' => 'Normal',
                    'font-medium' => 'Medio',
                    'font-semibold' => 'Semi-negrita',
                    'font-bold' => 'Negrita',
                    'font-extrabold' => 'Extra negrita',
                ],
                'default' => 'font-bold',
            ],
            'shadow' => [
                'type' => 'select',
                'label' => 'Sombra',
                'options' => [
                    'none' => 'Sin sombra',
                    'shadow-sm' => 'Sombra pequeña',
                    'shadow' => 'Sombra normal',
                    'shadow-lg' => 'Sombra grande',
                    'shadow-xl' => 'Sombra extra grande',
                ],
                'default' => 'none',
            ],
            'rounded' => [
                'type' => 'select',
                'label' => 'Bordes redondeados',
                'options' => [
                    'rounded-none' => 'Sin redondeo',
                    'rounded-sm' => 'Pequeño',
                    'rounded' => 'Normal',
                    'rounded-lg' => 'Grande',
                    'rounded-xl' => 'Muy grande',
                    'rounded-full' => 'Circular',
                ],
                'default' => 'rounded-none',
            ],
        ];
    }

    // ===================================
    // MÉTODOS DE ESTILOS CSS
    // ===================================

    protected function getCssClasses(): string
    {
        return implode(' ', array_filter([
            $this->getSpacingClasses(),
            $this->getMarginClasses(),
            $this->getContainerClasses(),
            $this->getBackgroundClasses(),
            $this->getTextClasses(),
            $this->getShadowClasses(),
            $this->getRoundedClasses(),
            $this->getBorderClasses(),
        ]));
    }

    protected function getSpacingClasses(): string
    {
        $spacing = $this->styles['spacing'] ?? 'md';
        $spacingMap = [
            'none' => 'py-0',
            'xs' => 'py-1',
            'sm' => 'py-4',
            'md' => 'py-8',
            'lg' => 'py-16',
            'xl' => 'py-24',
            '2xl' => 'py-32'
        ];

        return $spacingMap[$spacing] ?? 'py-8';
    }

    protected function getMarginClasses(): string
    {
        $margin = $this->styles['margin'] ?? 'none';
        $marginMap = [
            'none' => '',
            'xs' => 'my-1',
            'sm' => 'my-2',
            'md' => 'my-4',
            'lg' => 'my-8',
            'xl' => 'my-16'
        ];

        return $marginMap[$margin] ?? '';
    }

    protected function getContainerClasses(): string
    {
        $container = $this->styles['container'] ?? 'container';
        $containerMap = [
            'full' => 'w-full',
            'container' => 'max-w-7xl mx-auto px-4',
            'narrow' => 'max-w-3xl mx-auto px-4',
            'wide' => 'max-w-7xl mx-auto px-4'
        ];

        return $containerMap[$container] ?? 'max-w-7xl mx-auto px-4';
    }

    protected function getBackgroundClasses(): string
    {
        $background = $this->styles['background'] ?? 'transparent';
        
        if ($background === 'transparent') {
            return '';
        }

        return "bg-{$background}";
    }

    protected function getTextClasses(): string
    {
        $textAlign = $this->styles['text_align'] ?? 'left';
        $textColor = $this->styles['text_color'] ?? 'inherit';
        
        $classes = ["text-{$textAlign}"];

        if ($textColor !== 'inherit') {
            $classes[] = "text-{$textColor}";
        }

        return implode(' ', $classes);
    }

    protected function getTitleClasses(): string
    {
        $titleSize = $this->styles['title_size'] ?? 'text-3xl';
        $fontWeight = $this->styles['font_weight'] ?? 'font-bold';

        return "{$titleSize} {$fontWeight}";
    }

    protected function getShadowClasses(): string
    {
        $shadow = $this->styles['shadow'] ?? 'none';
        return $shadow !== 'none' ? $shadow : '';
    }

    protected function getRoundedClasses(): string
    {
        $rounded = $this->styles['rounded'] ?? 'rounded-none';
        return $rounded !== 'rounded-none' ? $rounded : '';
    }

    protected function getBorderClasses(): string
    {
        $border = $this->styles['border'] ?? 'none';
        return $border !== 'none' ? "border border-gray-200" : '';
    }

    protected function combineClasses(string ...$classes): string
    {
        return implode(' ', array_filter($classes));
    }

    protected function getDefaultBaseStyles(): array
    {
        return [
            'spacing' => 'md',
            'margin' => 'none',
            'container' => 'container',
            'background' => 'transparent',
            'text_color' => 'inherit',
            'text_align' => 'left',
            'title_size' => 'text-3xl',
            'font_weight' => 'font-bold',
            'shadow' => 'none',
            'rounded' => 'rounded-none',
            'border' => 'none',
        ];
    }
}
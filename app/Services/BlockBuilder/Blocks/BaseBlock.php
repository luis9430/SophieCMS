<?php
// app/Services/BlockBuilder/Blocks/BaseBlock.php

namespace App\Services\BlockBuilder\Blocks;

use App\Services\BlockBuilder\Contracts\BlockInterface;
use Illuminate\Support\Facades\View;

abstract class BaseBlock implements BlockInterface
{
    protected array $config = [];
    protected array $styles = [];
    protected string $id;
    protected array $children = [];
    
    public function __construct(array $config = [], array $styles = [])
    {
        $this->id = uniqid('block_');
        $this->setConfig($config);
        $this->setStyles($styles);
    }
    
    public function getConfig(): array
    {
        return $this->config;
    }
    
    public function setConfig(array $config): BlockInterface
    {
        $this->config = array_merge($this->getDefaultConfig(), $config);
        return $this;
    }
    
    public function getStyles(): array
    {
        return $this->styles;
    }
    
    public function setStyles(array $styles): BlockInterface
    {
        $this->styles = array_merge($this->getDefaultStyles(), $styles);
        return $this;
    }
    
    public function validate(): bool
    {
        $rules = $this->getValidationRules();
        
        foreach ($rules as $field => $rule) {
            if ($rule['required'] && empty($this->config[$field])) {
                return false;
            }
        }
        
        return true;
    }
    
    public function render(): string
    {
        if (!$this->validate()) {
            return $this->renderError();
        }
        
        $viewData = [
            'config' => $this->config,
            'styles' => $this->getCompiledStyles(),
            'children' => $this->renderChildren(),
            'id' => $this->id
        ];
        
        return View::make($this->getViewName(), $viewData)->render();
    }
    
    public function renderPreview(): string
    {
        // Por defecto, el preview es igual al render normal
        // Los bloques pueden sobrescribir esto si necesitan preview diferente
        return $this->render();
    }
    
    public function getId(): string
    {
        return $this->id;
    }
    
    public function setId(string $id): self
    {
        $this->id = $id;
        return $this;
    }
    
    public function getChildren(): array
    {
        return $this->children;
    }
    
    public function addChild(BlockInterface $child): self
    {
        $this->children[] = $child;
        return $this;
    }
    
    public function removeChild(string $childId): self
    {
        $this->children = array_filter($this->children, function($child) use ($childId) {
            return $child->getId() !== $childId;
        });
        return $this;
    }
    
    /**
     * Compila los estilos en clases CSS
     */
    protected function getCompiledStyles(): string
    {
        $classes = [];
        $config = config('block-builder.default_styles');
        
        // Espaciado
        if (!empty($this->styles['spacing'])) {
            $classes[] = $config['spacing'][$this->styles['spacing']] ?? '';
        }
        
        // Container
        if (!empty($this->styles['container'])) {
            $classes[] = $config['containers'][$this->styles['container']] ?? '';
        }
        
        // Background
        if (!empty($this->styles['background'])) {
            $classes[] = $config['backgrounds'][$this->styles['background']] ?? '';
        }
        
        // Text color
        if (!empty($this->styles['text_color'])) {
            $classes[] = $config['text_colors'][$this->styles['text_color']] ?? '';
        }
        
        // Responsive styles
        if (!empty($this->styles['responsive'])) {
            foreach ($this->styles['responsive'] as $breakpoint => $responsiveStyles) {
                $prefix = config('block-builder.responsive_breakpoints')[$breakpoint] ?? '';
                foreach ($responsiveStyles as $property => $value) {
                    if (isset($config[$property . 's'][$value])) {
                        $classes[] = $prefix . $config[$property . 's'][$value];
                    }
                }
            }
        }
        
        return implode(' ', array_filter($classes));
    }
    
    /**
     * Renderiza los bloques hijos
     */
    protected function renderChildren(): string
    {
        $output = '';
        foreach ($this->children as $child) {
            $output .= $child->render();
        }
        return $output;
    }
    
    /**
     * Renderiza mensaje de error
     */
    protected function renderError(): string
    {
        return '<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    Error en bloque: ' . $this->getType() . '
                </div>';
    }
    
    // Métodos abstractos que deben implementar las clases hijas
    abstract protected function getDefaultConfig(): array;
    abstract protected function getDefaultStyles(): array;
    abstract protected function getValidationRules(): array;
    abstract protected function getViewName(): string;
    abstract public function getType(): string;
    abstract public function getMetadata(): array;
}
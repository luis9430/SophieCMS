<?php
// app/Services/BlockBuilder/Contracts/BlockInterface.php

namespace App\Services\BlockBuilder\Contracts;

interface BlockInterface
{
    /**
     * Renderiza el bloque como HTML
     */
    public function render(): string;
    
    /**
     * Obtiene la configuración actual del bloque
     */
    public function getConfig(): array;
    
    /**
     * Establece la configuración del bloque
     */
    public function setConfig(array $config): self;
    
    /**
     * Valida la configuración del bloque
     */
    public function validate(): bool;
    
    /**
     * Obtiene el esquema de configuración para el builder
     * (define qué campos mostrar en el panel de settings)
     */
    public function getSettingsSchema(): array;
    
    /**
     * Obtiene el tipo del bloque
     */
    public function getType(): string;
    
    /**
     * Obtiene los estilos aplicados
     */
    public function getStyles(): array;
    
    /**
     * Establece los estilos del bloque
     */
    public function setStyles(array $styles): self;
    
    /**
     * Renderiza solo para preview (puede ser diferente al render final)
     */
    public function renderPreview(): string;
    
    /**
     * Obtiene metadata del bloque (nombre, icono, categoría, etc.)
     */
    public function getMetadata(): array;
}
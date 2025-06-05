<?php
// app/Services/BlockBuilder/Blocks/HeroBlock.php

namespace App\Services\BlockBuilder\Blocks;

use App\Services\BlockBuilder\BaseBlock;

class HeroBlock extends BaseBlock
{
    public function render(): string
    {
        $cssClasses = $this->getCssClasses();
        $titleClasses = $this->getTitleClasses();

        return view('blocks.hero', [
            'config' => $this->config,
            'styles' => $this->styles,
            'cssClasses' => $cssClasses,
            'titleClasses' => $titleClasses
        ])->render();
    }

    public function getMetadata(): array
    {
        return [
            'name' => 'Hero Section',
            'description' => 'Sección principal con título, subtítulo y botón',
            'icon' => '🦸',
            'category' => 'layout',
            'preview_image' => '/images/blocks/hero-preview.jpg'
        ];
    }

    protected function getDefaultConfig(): array
    {
        return [
            'title' => 'Título Principal',
            'subtitle' => 'Subtítulo descriptivo',
            'button_text' => 'Botón de Acción',
            'button_url' => '#',
            'show_button' => true,
        ];
    }

    protected function getDefaultStyles(): array
    {
        return array_merge($this->getDefaultBaseStyles(), [
            'spacing' => 'xl',
            'container' => 'wide',
            'background' => 'blue-500',
            'text_color' => 'white',
            'text_align' => 'center',
            'title_size' => 'text-4xl',
            'font_weight' => 'font-bold',
        ]);
    }

    // Campos requeridos específicos del Hero
    protected function getRequiredConfigFields(): array
    {
        return ['title']; // Solo el título es requerido
    }

    // Validaciones personalizadas para Hero
    protected function validateCustomRules(): array
    {
        $errors = [];
        
        if ($this->config['show_button'] && empty($this->config['button_text'])) {
            $errors[] = 'Si el botón está habilitado, debe tener texto';
        }
        
        return $errors;
    }
}
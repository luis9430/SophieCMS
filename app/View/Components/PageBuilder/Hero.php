<?php

// app/View/Components/PageBuilder/Hero.php
namespace App\View\Components\PageBuilder;

use Illuminate\View\Component;

class Hero extends Component
{
    public function __construct(
        public string $title = 'Hero Title',
        public string $subtitle = 'Hero Subtitle',
        public string $image = '',
        public string $buttonText = 'Get Started',
        public string $buttonUrl = '#',
        public string $alignment = 'center',
        public string $theme = 'default'
    ) {}

    public function render()
    {
        return view('components.page-builder.hero');
    }
}
<?php
// app/View/Components/PageBuilder/Button.php
namespace App\View\Components\PageBuilder;

use Illuminate\View\Component;

class Button extends Component
{
    public function __construct(
        public string $text = 'Button',
        public string $url = '#',
        public string $variant = 'primary',
        public string $size = 'md',
        public string $icon = '',
        public bool $fullWidth = false
    ) {}

    public function render()
    {
        return view('components.page-builder.button');
    }
}
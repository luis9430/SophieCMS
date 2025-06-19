<?php
// app/View/Components/PageBuilder/Card.php
namespace App\View\Components\PageBuilder;

use Illuminate\View\Component;

class Card extends Component
{
    public function __construct(
        public string $title = 'Card Title',
        public string $description = 'Card description',
        public string $image = '',
        public string $link = '',
        public string $linkText = 'Read More',
        public string $variant = 'default'
    ) {}

    public function render()
    {
        return view('components.page-builder.card');
    }
}
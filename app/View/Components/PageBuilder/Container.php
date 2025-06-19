<?php
// app/View/Components/PageBuilder/Container.php
namespace App\View\Components\PageBuilder;

use Illuminate\View\Component;

class Container extends Component
{
    public function __construct(
        public string $maxWidth = '7xl',
        public string $padding = '8'
    ) {}

    public function render()
    {
        return view('components.page-builder.container');
    }
}
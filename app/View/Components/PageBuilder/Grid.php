<?php
// app/View/Components/PageBuilder/Grid.php
namespace App\View\Components\PageBuilder;

use Illuminate\View\Component;

class Grid extends Component
{
    public function __construct(
        public int $columns = 3,
        public string $gap = '6',
        public string $responsive = 'true'
    ) {}

    public function render()
    {
        return view('components.page-builder.grid');
    }
}
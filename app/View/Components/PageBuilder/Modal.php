<?php
// app/View/Components/PageBuilder/Modal.php
namespace App\View\Components\PageBuilder;

use Illuminate\View\Component;

class Modal extends Component
{
    public function __construct(
        public string $id = 'modal',
        public string $title = 'Modal Title',
        public string $triggerText = 'Open Modal',
        public string $size = 'md'
    ) {}

    public function render()
    {
        return view('components.page-builder.modal');
    }
}
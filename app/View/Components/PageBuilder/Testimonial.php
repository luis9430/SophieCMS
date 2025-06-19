<?php
// app/View/Components/PageBuilder/Testimonial.php
namespace App\View\Components\PageBuilder;

use Illuminate\View\Component;

class Testimonial extends Component
{
    public function __construct(
        public string $quote = 'Amazing testimonial',
        public string $author = 'Client Name',
        public string $position = 'CEO',
        public string $company = 'Company',
        public string $avatar = '',
        public int $rating = 5
    ) {}

    public function render()
    {
        return view('components.page-builder.testimonial');
    }
}
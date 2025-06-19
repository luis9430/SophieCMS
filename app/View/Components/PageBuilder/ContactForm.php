<?php 
// app/View/Components/PageBuilder/ContactForm.php
namespace App\View\Components\PageBuilder;

use Illuminate\View\Component;

class ContactForm extends Component
{
    public function __construct(
        public string $title = 'Contact Us',
        public string $description = 'Get in touch with us',
        public array $fields = ['name', 'email', 'message'],
        public string $action = '/contact',
        public string $submitText = 'Send Message'
    ) {}

    public function render()
    {
        return view('components.page-builder.contact-form');
    }
}



<?php

// Crear este archivo: database/seeders/ComponentBuilderTestSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Component;
use Illuminate\Support\Facades\Auth;

class ComponentBuilderTestSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        // Crear algunos componentes de prueba
        $components = [
            [
                'name' => 'Hero Animado GSAP',
                'identifier' => 'hero-gsap',
                'category' => 'interactive',
                'description' => 'Hero section con animaciones GSAP',
                'blade_template' => '<div x-data="heroGsap()" class="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
    <div class="container mx-auto text-center">
        <h1 class="text-5xl font-bold mb-4" id="hero-title">{{ $title ?? "Bienvenido" }}</h1>
        <p class="text-xl mb-8" id="hero-subtitle">{{ $subtitle ?? "Una experiencia increíble te espera" }}</p>
        <button class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors" id="hero-cta">
            {{ $cta ?? "Comenzar" }}
        </button>
    </div>
</div>

<script>
function heroGsap() {
    return {
        init() {
            if (typeof gsap !== "undefined") {
                gsap.from("#hero-title", {duration: 1, y: -50, opacity: 0});
                gsap.from("#hero-subtitle", {duration: 1, y: 30, opacity: 0, delay: 0.3});
                gsap.from("#hero-cta", {duration: 1, scale: 0.8, opacity: 0, delay: 0.6});
            }
        }
    }
}
</script>',
                'external_assets' => ['gsap'],
                'communication_config' => [
                    'emits' => [
                        ['name' => 'hero-loaded', 'type' => 'broadcast']
                    ],
                    'listens' => [],
                    'state' => []
                ],
                'is_advanced' => true,
                'created_by_user_id' => 1, // Asume que existe un usuario con ID 1
                'version' => '1.0.0'
            ],
            [
                'name' => 'Carousel Swiper',
                'identifier' => 'carousel-swiper',
                'category' => 'interactive',
                'description' => 'Carousel responsive con Swiper.js',
                'blade_template' => '<div x-data="swiperCarousel()" class="swiper-container mx-auto max-w-4xl">
    <div class="swiper-wrapper">
        <div class="swiper-slide bg-red-500 text-white p-20 text-center">
            <h2 class="text-3xl font-bold">Slide 1</h2>
            <p>{{ $slide1_content ?? "Contenido del primer slide" }}</p>
        </div>
        <div class="swiper-slide bg-green-500 text-white p-20 text-center">
            <h2 class="text-3xl font-bold">Slide 2</h2>
            <p>{{ $slide2_content ?? "Contenido del segundo slide" }}</p>
        </div>
        <div class="swiper-slide bg-blue-500 text-white p-20 text-center">
            <h2 class="text-3xl font-bold">Slide 3</h2>
            <p>{{ $slide3_content ?? "Contenido del tercer slide" }}</p>
        </div>
    </div>
    <div class="swiper-pagination"></div>
    <div class="swiper-button-next"></div>
    <div class="swiper-button-prev"></div>
</div>

<script>
function swiperCarousel() {
    return {
        init() {
            if (typeof Swiper !== "undefined") {
                new Swiper(".swiper-container", {
                    loop: true,
                    pagination: {
                        el: ".swiper-pagination",
                        clickable: true,
                    },
                    navigation: {
                        nextEl: ".swiper-button-next",
                        prevEl: ".swiper-button-prev",
                    },
                });
            }
        }
    }
}
</script>',
                'external_assets' => ['swiper'],
                'communication_config' => [
                    'emits' => [
                        ['name' => 'slide-changed', 'type' => 'broadcast']
                    ],
                    'listens' => [
                        ['name' => 'hero-loaded', 'callback' => 'startCarousel']
                    ],
                    'state' => [
                        ['key' => 'currentSlide', 'defaultValue' => '0', 'persist' => true]
                    ]
                ],
                'is_advanced' => true,
                'created_by_user_id' => 1,
                'version' => '1.0.0'
            ],
            [
                'name' => 'Card Animada AOS',
                'identifier' => 'card-aos',
                'category' => 'content',
                'description' => 'Tarjeta con animaciones de scroll AOS',
                'blade_template' => '<div class="max-w-sm mx-auto bg-white rounded-lg shadow-lg overflow-hidden" 
     data-aos="fade-up" 
     data-aos-duration="1000">
    <img src="https://via.placeholder.com/400x200" alt="Card Image" class="w-full h-48 object-cover">
    <div class="p-6">
        <h3 class="text-xl font-bold mb-2">{{ $title ?? "Título de la Card" }}</h3>
        <p class="text-gray-600 mb-4">{{ $description ?? "Descripción de la tarjeta con animación AOS" }}</p>
        <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
            {{ $button_text ?? "Leer más" }}
        </button>
    </div>
</div>

<script>
document.addEventListener("DOMContentLoaded", function() {
    if (typeof AOS !== "undefined") {
        AOS.init();
    }
});
</script>',
                'external_assets' => ['aos'],
                'communication_config' => [
                    'emits' => [],
                    'listens' => [],
                    'state' => []
                ],
                'is_advanced' => true,
                'created_by_user_id' => 1,
                'version' => '1.0.0'
            ]
        ];

        foreach ($components as $componentData) {
            Component::create($componentData);
        }

        $this->command->info('✅ Componentes de prueba creados exitosamente!');
    }
}
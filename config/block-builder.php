<?php
// config/block-builder.php

return [
    'default_styles' => [
        'spacing' => [
            'none' => '',
            'xs' => 'py-2',
            'sm' => 'py-4',
            'md' => 'py-8', 
            'lg' => 'py-16',
            'xl' => 'py-24',
            '2xl' => 'py-32'
        ],
        'containers' => [
            'full' => 'w-full',
            'container' => 'container mx-auto px-4',
            'narrow' => 'max-w-4xl mx-auto px-4',
            'wide' => 'max-w-7xl mx-auto px-4'
        ],
        'backgrounds' => [
            'transparent' => 'bg-transparent',
            'white' => 'bg-white',
            'gray-50' => 'bg-gray-50',
            'gray-100' => 'bg-gray-100',
            'blue-500' => 'bg-blue-500',
            'blue-600' => 'bg-blue-600',
            'green-500' => 'bg-green-500',
            'red-500' => 'bg-red-500',
            'purple-500' => 'bg-purple-500'
        ],
        'text_colors' => [
            'inherit' => 'text-inherit',
            'black' => 'text-black',
            'white' => 'text-white',
            'gray-600' => 'text-gray-600',
            'gray-800' => 'text-gray-800',
            'blue-600' => 'text-blue-600'
        ]
    ],
    'responsive_breakpoints' => [
        'sm' => 'sm:',
        'md' => 'md:',
        'lg' => 'lg:',
        'xl' => 'xl:',
        '2xl' => '2xl:'
    ],
    
    // Bloques registrados por defecto
    'default_blocks' => [
        'hero' => \App\Services\BlockBuilder\Blocks\HeroBlock::class,
       // 'text' => \App\Services\BlockBuilder\Blocks\TextBlock::class,
        //'image' => \App\Services\BlockBuilder\Blocks\ImageBlock::class,
        //'button' => \App\Services\BlockBuilder\Blocks\ButtonBlock::class,
        //'columns' => \App\Services\BlockBuilder\Blocks\ColumnsBlock::class,
        //'card' => \App\Services\BlockBuilder\Blocks\CardBlock::class,
    ]
];
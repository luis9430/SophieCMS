{{-- resources/views/page-builder/partials/assets.blade.php --}}

@php
    $config = config('pagebuilder.assets', []);
    $useLocalAssets = $config['local_assets_enabled'] ?? false;
@endphp

{{-- Tailwind CSS --}}
@if($useLocalAssets)
    <link href="{{ asset('css/tailwind.min.css') }}" rel="stylesheet">
@else
    <script src="{{ $config['cdn']['tailwind'] ?? 'https://cdn.tailwindcss.com' }}"></script>
@endif

{{-- Alpine.js --}}
@if($useLocalAssets)
    <script src="{{ asset('js/alpine.min.js') }}" defer></script>
@else
    <script defer src="{{ $config['cdn']['alpine'] ?? 'https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js' }}"></script>
@endif

{{-- Configuración de Tailwind --}}
@push('scripts')
<script>
    // Configuración personalizada de Tailwind si es necesario
    @if(!$useLocalAssets)
    tailwind.config = {
        theme: {
            extend: {
                // Configuraciones personalizadas aquí
                animation: {
                    'fade-in': 'fadeIn 0.3s ease-in-out',
                    'slide-up': 'slideUp 0.3s ease-out',
                },
                keyframes: {
                    fadeIn: {
                        '0%': { opacity: '0' },
                        '100%': { opacity: '1' },
                    },
                    slideUp: {
                        '0%': { transform: 'translateY(10px)', opacity: '0' },
                        '100%': { transform: 'translateY(0)', opacity: '1' },
                    }
                }
            }
        }
    }
    @endif
</script>
@endpush
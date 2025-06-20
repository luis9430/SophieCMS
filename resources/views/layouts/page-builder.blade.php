{{-- resources/views/layouts/page-builder.blade.php --}}
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Page Builder')</title>
    
    {{-- CSRF Token --}}
    <meta name="csrf-token" content="{{ csrf_token() }}">
    
    {{-- Favicon --}}
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
    
    {{-- Styles Section --}}
    @stack('styles')
    
    {{-- Page Builder Assets --}}
    @include('page-builder.partials.assets')
    
    {{-- Custom styles para esta vista --}}
    @yield('custom-styles')
</head>
<body class="{{ $bodyClass ?? 'bg-gray-50' }}">
    {{-- Pre-load scripts --}}
    @stack('pre-scripts')
    
    {{-- Main content --}}
    @yield('content')
    
    {{-- Scripts Section --}}
    @stack('scripts')
    
    {{-- Custom scripts para esta vista --}}
    @yield('custom-scripts')
</body>
</html>
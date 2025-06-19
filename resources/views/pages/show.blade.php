{{-- resources/views/pages/show.blade.php --}}
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $page->meta_title ?: $page->title }} - {{ $website->name }}</title>
    
    {{-- Meta tags SEO --}}
    <meta name="description" content="{{ $page->meta_description ?: Str::limit(strip_tags($content), 160) }}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="{{ url()->current() }}">
    
    {{-- Open Graph --}}
    <meta property="og:type" content="website">
    <meta property="og:title" content="{{ $page->meta_title ?: $page->title }}">
    <meta property="og:description" content="{{ $page->meta_description ?: Str::limit(strip_tags($content), 160) }}">
    <meta property="og:url" content="{{ url()->current() }}">
    <meta property="og:site_name" content="{{ $website->name }}">
    
    {{-- Twitter Card --}}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ $page->meta_title ?: $page->title }}">
    <meta name="twitter:description" content="{{ $page->meta_description ?: Str::limit(strip_tags($content), 160) }}">
    
    {{-- Favicon --}}
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
    
    {{-- Styles --}}
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
    
    {{-- Custom CSS si está configurado en el website --}}
    @if(isset($website->settings['custom_css']))
        <style>
            {!! $website->settings['custom_css'] !!}
        </style>
    @endif
    
    {{-- Analytics --}}
    @if(isset($website->settings['google_analytics_id']))
        <!-- Google Analytics -->
        <script async src="https://www.googletagmanager.com/gtag/js?id={{ $website->settings['google_analytics_id'] }}"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '{{ $website->settings['google_analytics_id'] }}');
        </script>
    @endif
</head>
<body class="min-h-screen bg-white">
    {{-- Navigation si está configurada --}}
    @if(isset($website->settings['show_navigation']) && $website->settings['show_navigation'])
        @include('partials.navigation')
    @endif
    
    {{-- Contenido principal de la página --}}
    <main>
        {!! $content !!}
    </main>
    
    {{-- Footer si está configurado --}}
    @if(isset($website->settings['show_footer']) && $website->settings['show_footer'])
        @include('partials.footer')
    @endif
    
    {{-- Scripts adicionales del website --}}
    @if(isset($website->settings['custom_js']))
        <script>
            {!! $website->settings['custom_js'] !!}
        </script>
    @endif
    
    {{-- Schema.org structured data --}}
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "{{ $page->title }}",
        "description": "{{ $page->meta_description ?: Str::limit(strip_tags($content), 160) }}",
        "url": "{{ url()->current() }}",
        "isPartOf": {
            "@type": "WebSite",
            "name": "{{ $website->name }}",
            "url": "{{ url('/') }}"
        }
    }
    </script>
</body>
</html>

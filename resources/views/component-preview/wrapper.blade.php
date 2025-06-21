<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Component Preview</title>
    
    {{-- CSP dinámico basado en entorno --}}
    <meta http-equiv="Content-Security-Policy" content="{{ $csp }}">
    
    {{-- Assets dinámicos --}}
    {!! $assetTags !!}
    
    <style>
        body { 
            font-family: system-ui, -apple-system, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f8fafc;
        }
        .preview-container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 8px; 
            padding: 20px; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        /* Estilos de fallback */
        .swiper-fallback {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 8px;
            text-align: center;
            margin: 1rem 0;
        }
        
        .error-container {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 1rem;
            border-radius: 6px;
            margin: 1rem 0;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        {!! $content !!}
    </div>
    
    {{-- Component System JavaScript --}}
    {!! $componentSystemJS !!}
    
    <script nonce="{{ $nonce }}">
        // Debug info
        console.log('🛡️ Component Preview Loaded');
        console.log('📦 Available libraries:', {
            Swiper: typeof window.Swiper !== 'undefined' ? '✅ Loaded' : '❌ Not loaded',
            GSAP: typeof window.gsap !== 'undefined' ? '✅ Loaded' : '❌ Not loaded',
            AOS: typeof window.AOS !== 'undefined' ? '✅ Loaded' : '❌ Not loaded',
            Alpine: typeof window.Alpine !== 'undefined' ? '✅ Loaded' : '❌ Not loaded'
        });
        
        // Mostrar stats cuando esté listo
        setTimeout(() => {
            if (window.ComponentManager) {
                console.log('📊 ComponentManager Stats:', window.ComponentManager.getStats());
            }
        }, 1000);
    </script>
</body>
</html>
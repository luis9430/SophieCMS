{{-- ===================================================================
resources/views/page-builder/index.blade.php
Migración completa de Alpine.js a Preact/Mantine
=================================================================== --}}

@extends('layouts.app')

@section('title', 'Page Builder - Preact & Mantine')

@section('head')
    <meta name="csrf-token" content="{{ csrf_token() }}">
    
    {{-- Preact será cargado por Vite --}}
    @vite(['resources/js/preact-app.jsx'])
    
    {{-- Estilos adicionales si necesarios --}}
    <style>
        /* Estilos específicos para el page builder */
        .page-builder-container {
            height: 100vh;
            overflow: hidden;
        }
        
        /* Personalización de scrollbars */
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #a1a1a1;
        }

        /* Animaciones suaves */
        .page-builder-container * {
            transition: all 0.2s ease;
        }

        /* Fix para drag and drop */
        .dragging {
            opacity: 0.8;
            transform: rotate(2deg);
        }
    </style>
@endsection

@section('content')
<div class="page-builder-container">
    {{-- 
        CONTENEDOR PRINCIPAL PARA PREACT 
        Aquí se montará toda la aplicación Preact
    --}}
    <div 
        id="preact-page-builder" 
        data-initial-blocks="{{ json_encode($initialBlocks ?? []) }}"
        data-available-blocks="{{ json_encode($availableBlocks ?? []) }}"
        data-api-endpoints="{{ json_encode([
            'preview' => route('page-builder.preview'),
            'save' => route('page-builder.save'),
            'load' => route('page-builder.load'),
            'block-template' => route('page-builder.block-template')
        ]) }}"
        data-config="{{ json_encode([
            'csrf_token' => csrf_token(),
            'debug_mode' => config('app.debug'),
            'enable_autosave' => true,
            'autosave_interval' => 30000
        ]) }}"
    >
        {{-- Loading fallback mientras carga Preact --}}
        <div style="
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8f9fa;
            flex-direction: column;
            gap: 1rem;
        ">
            <div style="
                width: 40px;
                height: 40px;
                border: 4px solid #e9ecef;
                border-top: 4px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
            <p style="color: #6c757d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                Loading Page Builder...
            </p>
        </div>
    </div>
</div>

{{-- Keyframe para el loading spinner --}}
<style>
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style>

{{-- Script para inicializar Preact --}}
<script type="module">
    // Esperar a que Preact esté disponible
    document.addEventListener('DOMContentLoaded', () => {
        // Función para inicializar cuando Preact esté listo
        const initPageBuilder = () => {
            if (window.initPreactPageBuilder) {
                try {
                    // Obtener datos del DOM
                    const container = document.getElementById('preact-page-builder');
                    const initialBlocks = JSON.parse(container.dataset.initialBlocks || '[]');
                    const availableBlocks = JSON.parse(container.dataset.availableBlocks || '[]');
                    const apiEndpoints = JSON.parse(container.dataset.apiEndpoints || '{}');
                    const config = JSON.parse(container.dataset.config || '{}');

                    // Configurar datos globales para Preact
                    window.pageBuilderData = {
                        initialBlocks,
                        availableBlocks,
                        apiEndpoints,
                        config
                    };

                    // Inicializar Preact
                    window.initPreactPageBuilder();
                    
                    console.log('✅ Page Builder initialized successfully');
                } catch (error) {
                    console.error('❌ Error initializing Page Builder:', error);
                    
                    // Mostrar error en el contenedor
                    const container = document.getElementById('preact-page-builder');
                    container.innerHTML = `
                        <div style="
                            height: 100vh;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            flex-direction: column;
                            gap: 1rem;
                            color: #dc3545;
                            text-align: center;
                            padding: 2rem;
                        ">
                            <h3>Error loading Page Builder</h3>
                            <p>Please refresh the page or contact support if the problem persists.</p>
                            <button onclick="location.reload()" style="
                                padding: 0.5rem 1rem;
                                background: #3b82f6;
                                color: white;
                                border: none;
                                border-radius: 6px;
                                cursor: pointer;
                            ">
                                Reload Page
                            </button>
                        </div>
                    `;
                }
            } else {
                // Reintentar después de 100ms si Preact no está listo
                setTimeout(initPageBuilder, 100);
            }
        };

        // Iniciar el proceso
        initPageBuilder();
    });

    // Debug helpers (solo en desarrollo)
    @if(config('app.debug'))
    window.pageBuilderDebug = {
        reload: () => location.reload(),
        getData: () => window.pageBuilderData,
        getBlocks: () => window.pageBuilderInstance?.getBlocks?.() || [],
        addTestBlock: () => {
            if (window.pageBuilderInstance?.addBlock) {
                window.pageBuilderInstance.addBlock('hero');
            }
        }
    };
    
    console.log('🛠️ Debug helpers available:', Object.keys(window.pageBuilderDebug));
    @endif
</script>

{{-- Fallback CSS para casos extremos --}}
<noscript>
    <div style="
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 1rem;
        color: #dc3545;
        text-align: center;
        padding: 2rem;
    ">
        <h3>JavaScript Required</h3>
        <p>The Page Builder requires JavaScript to function properly.</p>
        <p>Please enable JavaScript in your browser settings.</p>
    </div>
</noscript>
@endsection

@section('scripts')
{{-- Scripts adicionales si necesarios --}}
@parent

{{-- Configuración global para error handling --}}
<script>
    // Error handler global para Preact
    window.addEventListener('error', (event) => {
        if (event.error && event.error.message && event.error.message.includes('preact')) {
            console.error('🔴 Preact Error:', event.error);
            
            // Opcional: reportar error a servicio externo
            // fetch('/api/log-error', { ... });
        }
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('🔴 Unhandled Promise Rejection:', event.reason);
    });
</script>
@endsection
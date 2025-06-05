{{-- resources/views/page-builder/index.blade.php --}}
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Builder - SophieCMS</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <meta name="csrf-token" content="{{ csrf_token() }}">
    
    <style>
        [x-cloak] { display: none !important; }
        
        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(156, 163, 175, 0.3);
            border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(156, 163, 175, 0.5);
        }
        
        /* Glassmorphism */
        .glass {
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }
        
        /* Smooth animations */
        .smooth-bounce {
            animation: smoothBounce 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        @keyframes smoothBounce {
            0% { transform: scale(0.8) rotate(-5deg); opacity: 0; }
            50% { transform: scale(1.05) rotate(2deg); }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        
        /* Hover effects */
        .hover-lift {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hover-lift:hover {
            transform: translateY(-2px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        /* Block item animations */
        .block-item {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .block-item:hover {
            transform: translateY(-1px) scale(1.02);
        }
        
        /* Canvas block styling */
        .canvas-block {
            transition: all 0.2s ease;
            position: relative;
        }
        .canvas-block:hover .block-overlay {
            opacity: 1;
        }
        .canvas-block.selected {
            outline: 2px solid #6366f1;
            outline-offset: 4px;
        }
        
        /* Drop zone styling */
        .drop-zone {
            transition: all 0.3s ease;
        }
        .drop-zone.drag-over {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1));
            border: 2px dashed #6366f1;
            transform: scale(1.02);
        }
        
        /* Modern toggle */
        .toggle-bg {
            transition: all 0.3s ease;
        }
    </style>
</head>
<body class="bg-gray-50 text-gray-900 antialiased" x-data="pageBuilder()" x-cloak>
    <!-- Top Navigation -->
    <nav class="bg-white/80 glass border-b border-gray-200/50 sticky top-0 z-50">
        <div class="flex items-center justify-between px-6 py-3">
            <!-- Left: Logo & Title -->
            <div class="flex items-center space-x-4">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span class="text-white text-sm font-bold">PB</span>
                    </div>

    <!-- Delete Confirmation Modal -->
    <div 
        x-show="showModal" 
        x-cloak
        class="fixed inset-0 z-50 overflow-y-auto" 
        x-transition:enter="transition ease-out duration-300"
        x-transition:enter-start="opacity-0"
        x-transition:enter-end="opacity-100"
        x-transition:leave="transition ease-in duration-200"
        x-transition:leave-start="opacity-100"
        x-transition:leave-end="opacity-0">
        
        <!-- Backdrop -->
        <div 
            class="fixed inset-0 bg-black/50 glass"
            @click="cancelDelete()"></div>
        
        <!-- Modal -->
        <div class="relative min-h-screen flex items-center justify-center p-4">
            <div 
                class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
                x-transition:enter="transition ease-out duration-300"
                x-transition:enter-start="opacity-0 scale-95 rotate-3"
                x-transition:enter-end="opacity-100 scale-100 rotate-0"
                x-transition:leave="transition ease-in duration-200"
                x-transition:leave-start="opacity-100 scale-100 rotate-0"
                x-transition:leave-end="opacity-0 scale-95 -rotate-3">
                
                <!-- Icon -->
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </div>
                
                <!-- Content -->
                <div class="text-center mb-6">
                    <h3 class="text-xl font-semibold text-gray-900 mb-2" x-text="modalConfig.title"></h3>
                    <p class="text-gray-600 text-sm leading-relaxed" x-text="modalConfig.message"></p>
                </div>
                
                <!-- Buttons -->
                <div class="flex space-x-3">
                    <button 
                        @click="cancelDelete()"
                        class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors duration-200">
                        <span x-text="modalConfig.cancelText"></span>
                    </button>
                    
                    <button 
                        @click="confirmDelete()"
                        class="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95">
                        <span x-text="modalConfig.confirmText"></span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Notifications Container -->
    <div class="fixed top-4 right-4 z-50 space-y-2" style="pointer-events: none;">
        <template x-for="notification in notifications" :key="notification.id">
            <div 
                x-show="notification.show"
                x-transition:enter="transition ease-out duration-300"
                x-transition:enter-start="transform translate-x-full opacity-0 scale-95"
                x-transition:enter-end="transform translate-x-0 opacity-100 scale-100"
                x-transition:leave="transition ease-in duration-300"
                x-transition:leave-start="transform translate-x-0 opacity-100 scale-100"
                x-transition:leave-end="transform translate-x-full opacity-0 scale-95"
                :class="{
                    'bg-emerald-500 text-white border-emerald-600': notification.type === 'success',
                    'bg-red-500 text-white border-red-600': notification.type === 'error',
                    'bg-blue-500 text-white border-blue-600': notification.type === 'info'
                }"
                class="flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg border backdrop-blur-sm max-w-sm"
                style="pointer-events: auto;">
                
                <!-- Icon -->
                <div class="flex-shrink-0">
                    <template x-if="notification.type === 'success'">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                    </template>
                    <template x-if="notification.type === 'error'">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </template>
                    <template x-if="notification.type === 'info'">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </template>
                </div>
                
                <!-- Message -->
                <div class="flex-1 text-sm font-medium" x-text="notification.message"></div>
                
                <!-- Close Button -->
                <button 
                    @click="removeNotification(notification.id)"
                    class="flex-shrink-0 p-1 hover:bg-white/20 rounded-md transition-colors duration-200">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        </template>
    </div>
                    <h1 class="text-xl font-semibold text-gray-900">Page Builder</h1>
                </div>
                
                <!-- Mode Toggle -->
                <div class="flex items-center bg-gray-100 rounded-lg p-1">
                    <button 
                        @click="previewMode = false"
                        :class="!previewMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'"
                        class="px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200">
                        <span class="flex items-center space-x-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                            <span>Edit</span>
                        </span>
                    </button>
                    <button 
                        @click="previewMode = true"
                        :class="previewMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'"
                        class="px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200">
                        <span class="flex items-center space-x-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                            <span>Preview</span>
                        </span>
                    </button>
                </div>
            </div>
            
            <!-- Right: Actions -->
            <div class="flex items-center space-x-3">
                <button 
                    @click="exportJson()"
                    class="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover-lift">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <span>Export</span>
                </button>
                
                <button 
                    @click="saveBlocks()"
                    class="flex items-center space-x-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover-lift">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                    <span>Save</span>
                </button>
            </div>
        </div>
    </nav>

    <!-- Main Layout -->
    <div class="flex h-screen overflow-hidden">
        <!-- Left Sidebar: Blocks -->
        <aside 
            class="w-80 bg-white border-r border-gray-200 flex flex-col"
            x-show="!previewMode"
            x-transition:enter="transition ease-out duration-300"
            x-transition:enter-start="-translate-x-full"
            x-transition:enter-end="translate-x-0"
            x-transition:leave="transition ease-in duration-300"
            x-transition:leave-start="translate-x-0"
            x-transition:leave-end="-translate-x-full">
            
            <!-- Sidebar Header -->
            <div class="p-6 border-b border-gray-100">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">Components</h2>
                
                <!-- Search -->
                <div class="relative">
                    <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    <input 
                        x-model="searchQuery"
                        type="text"
                        placeholder="Search components..."
                        class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200">
                </div>
                
                <!-- Stats -->
                <div class="mt-4 text-xs text-gray-500">
                    <span x-text="availableBlocks.length"></span> components available
                </div>
            </div>
            
            <!-- Components List -->
            <div class="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div class="space-y-3">
                    <template x-for="(block, index) in filteredBlocks" :key="index">
                        <div 
                            class="block-item group relative p-4 bg-white border border-gray-200 rounded-xl cursor-move hover:border-indigo-300 hover:shadow-lg transition-all duration-200"
                            draggable="true"
                            @dragstart="dragStart($event, block.type)">
                            
                            <!-- Component Preview -->
                            <div class="flex items-start space-x-3">
                                <div class="w-10 h-10 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:from-indigo-100 group-hover:to-purple-100 transition-colors duration-200">
                                    <span class="text-lg" x-text="block.metadata?.icon || '📄'"></span>
                                </div>
                                
                                <div class="flex-1 min-w-0">
                                    <h3 class="text-sm font-medium text-gray-900 group-hover:text-indigo-700 transition-colors duration-200" x-text="block.metadata?.name || block.type"></h3>
                                    <p class="text-xs text-gray-500 mt-1 line-clamp-2" x-text="block.metadata?.description || 'Component description'"></p>
                                    
                                    <!-- Category Badge -->
                                    <template x-if="block.metadata?.category">
                                        <span class="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md" x-text="block.metadata.category"></span>
                                    </template>
                                </div>
                            </div>
                            
                            <!-- Drag Indicator -->
                            <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                                </svg>
                            </div>
                        </div>
                    </template>
                    
                    <!-- Empty State -->
                    <div x-show="filteredBlocks.length === 0" class="text-center py-12">
                        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-4h-2M9 13h1m0 0V9m0 4h1m4-1h1M9 13v3"/>
                            </svg>
                        </div>
                        <p class="text-sm text-gray-500">No components found</p>
                    </div>
                </div>
            </div>
        </aside>

        <!-- Center: Canvas -->
        <main class="flex-1 flex flex-col overflow-hidden bg-gray-50">
            <!-- Canvas Header -->
            <div class="bg-white border-b border-gray-200 px-6 py-4" x-show="!previewMode">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <h3 class="text-lg font-semibold text-gray-900">Canvas</h3>
                        <div class="flex items-center space-x-2 text-sm text-gray-500">
                            <span x-text="blocks.length"></span>
                            <span>components</span>
                        </div>
                    </div>
                    
                    <button 
                        @click="clearCanvas()"
                        x-show="blocks.length > 0"
                        class="flex items-center space-x-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                        <span>Clear All</span>
                    </button>
                </div>
            </div>
            
            <!-- Canvas Area -->
            <div class="flex-1 overflow-y-auto custom-scrollbar p-8" :class="previewMode ? 'p-0' : 'p-8'">
                <div 
                    class="drop-zone min-h-full rounded-2xl border-2 border-dashed border-gray-300 bg-white/50 relative"
                    :class="previewMode ? 'border-none bg-transparent rounded-none' : ''"
                    @dragover.prevent
                    @drop.prevent="dropBlock($event)"
                    @dragenter.prevent="$event.currentTarget.classList.add('drag-over')"
                    @dragleave.prevent="if(!$event.currentTarget.contains($event.relatedTarget)) $event.currentTarget.classList.remove('drag-over')">
                    
                    <!-- Empty State -->
                    <div 
                        x-show="blocks.length === 0 && !previewMode" 
                        class="absolute inset-0 flex items-center justify-center">
                        <div class="text-center">
                            <div class="w-24 h-24 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <svg class="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                                </svg>
                            </div>
                            <h3 class="text-xl font-semibold text-gray-700 mb-2">Start Building</h3>
                            <p class="text-gray-500 mb-6 max-w-sm">Drag components from the sidebar to start creating your page</p>
                            <div class="inline-flex items-center space-x-2 text-sm text-indigo-600">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"/>
                                </svg>
                                <span>Drag & Drop Components</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Blocks Container -->
                    <div x-show="blocks.length > 0" class="space-y-6" :class="previewMode ? 'space-y-0' : 'p-8'">
                        <template x-for="(block, index) in blocks" :key="block.id">
                            <div 
                                class="canvas-block group"
                                :class="{'selected': selectedBlockId === block.id && !previewMode}"
                                @click.stop="!previewMode && selectBlock(block.id)">
                                
                                <!-- Block Overlay (Edit Mode) -->
                                <div 
                                    class="block-overlay absolute inset-0 bg-indigo-500/5 border-2 border-indigo-200 rounded-lg opacity-0 transition-all duration-200 pointer-events-none z-10"
                                    x-show="!previewMode && selectedBlockId !== block.id"></div>
                                
                                <!-- Block Controls -->
                                <div 
                                    class="absolute top-3 right-3 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20"
                                    x-show="!previewMode">
                                    
                                    <div class="flex items-center bg-white/90 glass rounded-lg shadow-lg p-1">
                                        <button 
                                            @click.stop="selectBlock(block.id)"
                                            :class="selectedBlockId === block.id ? 'bg-indigo-500 text-white' : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'"
                                            class="p-2 rounded-md transition-all duration-200"
                                            title="Configure">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                            </svg>
                                        </button>
                                        
                                        <button 
                                            @click.stop="duplicateBlock(index)"
                                            class="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all duration-200"
                                            title="Duplicate">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                                            </svg>
                                        </button>
                                        
                                        <button 
                                            @click.stop="removeBlock(index)"
                                            class="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200"
                                            title="Delete">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Block Content -->
                                <div x-html="block.rendered" class="relative"></div>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </main>

        <!-- Right Sidebar: Properties -->
        <aside 
            class="w-96 bg-white border-l border-gray-200 flex flex-col"
            x-show="!previewMode && selectedBlock"
            x-transition:enter="transition ease-out duration-300"
            x-transition:enter-start="translate-x-full"
            x-transition:enter-end="translate-x-0"
            x-transition:leave="transition ease-in duration-300"
            x-transition:leave-start="translate-x-0"
            x-transition:leave-end="translate-x-full">
            
            <!-- Properties Header -->
            <div class="p-6 border-b border-gray-100">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-semibold text-gray-900">Properties</h2>
                    <button 
                        @click="selectedBlockId = null" 
                        class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <template x-if="selectedBlock">
                    <div class="p-3 bg-gray-50 rounded-lg">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg flex items-center justify-center">
                                <span class="text-sm" x-text="selectedBlock.metadata?.icon || '📄'"></span>
                            </div>
                            <div>
                                <h3 class="font-medium text-gray-900" x-text="selectedBlock.metadata?.name || selectedBlock.type"></h3>
                                <p class="text-xs text-gray-500" x-text="selectedBlock.id"></p>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
            
            <!-- Properties Tabs -->
            <div class="border-b border-gray-100">
                <nav class="flex">
                    <button 
                        @click="configTab = 'content'"
                        :class="configTab === 'content' ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
                        class="flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-all duration-200">
                        Content
                    </button>
                    <button 
                        @click="configTab = 'layout'"
                        :class="configTab === 'layout' ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
                        class="flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-all duration-200">
                        Layout
                    </button>
                    <button 
                        @click="configTab = 'style'"
                        :class="configTab === 'style' ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
                        class="flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-all duration-200">
                        Style
                    </button>
                </nav>
            </div>
            
            <!-- Properties Content -->
            <div class="flex-1 overflow-y-auto custom-scrollbar">
                <template x-if="selectedBlock">
                    <div class="p-6 space-y-6">
                        
                        <!-- CONTENT TAB -->
                        <div x-show="configTab === 'content'" x-transition>
                            <template x-if="selectedBlock.type === 'hero'">
                                <div class="space-y-6">
                                    <!-- Text Section -->
                                    <div class="space-y-4">
                                        <h4 class="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                                            <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/>
                                            </svg>
                                            <span>Text Content</span>
                                        </h4>
                                        
                                        <div class="space-y-4">
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-2">Title</label>
                                                <input 
                                                    type="text"
                                                    x-model="selectedBlock.config.title"
                                                    @input="updateBlockConfig()"
                                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                                                    placeholder="Enter title...">
                                            </div>
                                            
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                                                <textarea 
                                                    x-model="selectedBlock.config.subtitle"
                                                    @input="updateBlockConfig()"
                                                    rows="3"
                                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 resize-none"
                                                    placeholder="Enter subtitle..."></textarea>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Button Section -->
                                    <div class="space-y-4">
                                        <div class="flex items-center justify-between">
                                            <h4 class="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                                                <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"/>
                                                </svg>
                                                <span>Call to Action</span>
                                            </h4>
                                            
                                            <!-- Toggle Button -->
                                            <button 
                                                @click="selectedBlock.config.show_button = !selectedBlock.config.show_button; updateBlockConfig()"
                                                :class="selectedBlock.config.show_button ? 'bg-indigo-500' : 'bg-gray-300'"
                                                class="toggle-bg relative inline-flex items-center h-6 w-11 rounded-full">
                                                <span 
                                                    :class="selectedBlock.config.show_button ? 'translate-x-6' : 'translate-x-1'"
                                                    class="inline-block w-4 h-4 bg-white rounded-full transition-transform duration-200"></span>
                                            </button>
                                        </div>
                                        
                                        <template x-if="selectedBlock.config.show_button">
                                            <div class="space-y-4 pl-6 border-l-2 border-indigo-100">
                                                <div>
                                                    <label class="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
                                                    <input 
                                                        type="text"
                                                        x-model="selectedBlock.config.button_text"
                                                        @input="updateBlockConfig()"
                                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                                                        placeholder="Button text...">
                                                </div>
                                                
                                                <div>
                                                    <label class="block text-sm font-medium text-gray-700 mb-2">Button URL</label>
                                                    <input 
                                                        type="url"
                                                        x-model="selectedBlock.config.button_url"
                                                        @input="updateBlockConfig()"
                                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                                                        placeholder="https://example.com">
                                                </div>
                                            </div>
                                        </template>
                                    </div>
                                </div>
                            </template>
                        </div>
                        
                        <!-- LAYOUT TAB -->
                        <div x-show="configTab === 'layout'" x-transition>
                            <div class="space-y-6">
                                <!-- Spacing Section -->
                                <div class="space-y-4">
                                    <h4 class="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                                        <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                                        </svg>
                                        <span>Spacing</span>
                                    </h4>
                                    
                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Padding</label>
                                            <select 
                                                x-model="selectedBlock.styles.spacing" 
                                                @change="updateBlockStyles()" 
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200">
                                                <option value="none">None</option>
                                                <option value="xs">XS</option>
                                                <option value="sm">Small</option>
                                                <option value="md">Medium</option>
                                                <option value="lg">Large</option>
                                                <option value="xl">XL</option>
                                                <option value="2xl">2XL</option>
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Margin</label>
                                            <select 
                                                x-model="selectedBlock.styles.margin" 
                                                @change="updateBlockStyles()" 
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200">
                                                <option value="none">None</option>
                                                <option value="xs">XS</option>
                                                <option value="sm">Small</option>
                                                <option value="md">Medium</option>
                                                <option value="lg">Large</option>
                                                <option value="xl">XL</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Container Section -->
                                <div class="space-y-4">
                                    <h4 class="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                                        <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
                                        </svg>
                                        <span>Container</span>
                                    </h4>
                                    
                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Width</label>
                                            <select 
                                                x-model="selectedBlock.styles.container" 
                                                @change="updateBlockStyles()" 
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200">
                                                <option value="full">Full Width</option>
                                                <option value="container">Container</option>
                                                <option value="narrow">Narrow</option>
                                                <option value="wide">Wide</option>
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Alignment</label>
                                            <select 
                                                x-model="selectedBlock.styles.text_align" 
                                                @change="updateBlockStyles()" 
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200">
                                                <option value="left">Left</option>
                                                <option value="center">Center</option>
                                                <option value="right">Right</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- STYLE TAB -->
                        <div x-show="configTab === 'style'" x-transition>
                            <div class="space-y-6">
                                <!-- Colors Section -->
                                <div class="space-y-4">
                                    <h4 class="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                                        <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"/>
                                        </svg>
                                        <span>Colors</span>
                                    </h4>
                                    
                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Background</label>
                                            <select 
                                                x-model="selectedBlock.styles.background" 
                                                @change="updateBlockStyles()" 
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200">
                                                <option value="transparent">Transparent</option>
                                                <option value="white">White</option>
                                                <option value="gray-50">Gray 50</option>
                                                <option value="blue-500">Blue</option>
                                                <option value="green-500">Green</option>
                                                <option value="purple-500">Purple</option>
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                                            <select 
                                                x-model="selectedBlock.styles.text_color" 
                                                @change="updateBlockStyles()" 
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200">
                                                <option value="inherit">Inherit</option>
                                                <option value="black">Black</option>
                                                <option value="white">White</option>
                                                <option value="gray-600">Gray</option>
                                                <option value="blue-600">Blue</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Typography Section -->
                                <div class="space-y-4">
                                    <h4 class="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                                        <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z"/>
                                        </svg>
                                        <span>Typography</span>
                                    </h4>
                                    
                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Title Size</label>
                                            <select 
                                                x-model="selectedBlock.styles.title_size" 
                                                @change="updateBlockStyles()" 
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200">
                                                <option value="text-2xl">Small</option>
                                                <option value="text-3xl">Medium</option>
                                                <option value="text-4xl">Large</option>
                                                <option value="text-5xl">XL</option>
                                                <option value="text-6xl">2XL</option>
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Font Weight</label>
                                            <select 
                                                x-model="selectedBlock.styles.font_weight" 
                                                @change="updateBlockStyles()" 
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200">
                                                <option value="font-normal">Normal</option>
                                                <option value="font-medium">Medium</option>
                                                <option value="font-semibold">Semibold</option>
                                                <option value="font-bold">Bold</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                </template>
            </div>
        </aside>
    </div>

    <script>
        function pageBuilder() {
            return {
                blocks: [],
                selectedBlockId: null,
                previewMode: false,
                configTab: 'content',
                searchQuery: '',
                availableBlocks: @json($availableBlocks ?? []),
                
                // Modal confirmation state
                showModal: false,
                modalConfig: {
                    title: 'Delete Component?',
                    message: 'This action cannot be undone. The component will be permanently deleted.',
                    confirmText: 'Delete',
                    cancelText: 'Cancel'
                },
                modalCallback: null,
                
                // Notification state
                notifications: [],
                
                get filteredBlocks() {
                    if (!this.searchQuery) return this.availableBlocks;
                    return this.availableBlocks.filter(block => 
                        (block.metadata?.name || block.type).toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                        (block.metadata?.description || '').toLowerCase().includes(this.searchQuery.toLowerCase())
                    );
                },
                
                get selectedBlock() {
                    return this.blocks.find(block => block.id === this.selectedBlockId);
                },
                
                init() {
                    console.log('🎨 Modern Page Builder initialized');
                    console.log('📦 Available blocks:', this.availableBlocks);
                    
                    // Show welcome notification
                    setTimeout(() => {
                        this.showNotification('Page Builder loaded successfully! 🚀', 'success');
                    }, 500);
                },
                
                dragStart(event, blockType) {
                    console.log('🔄 Drag start:', blockType);
                    event.dataTransfer.setData('text/plain', blockType);
                    event.dataTransfer.effectAllowed = 'copy';
                },
                
                async dropBlock(event) {
                    event.currentTarget.classList.remove('drag-over');
                    
                    try {
                        const blockType = event.dataTransfer.getData('text/plain');
                        console.log('🎯 Dropping block:', blockType);
                        
                        if (blockType) {
                            await this.addBlock(blockType);
                        }
                    } catch (e) {
                        console.error('❌ Error dropping block:', e);
                    }
                },
                
                async addBlock(blockType) {
                    console.log('➕ Adding block:', blockType);
                    
                    const blockData = {
                        id: 'block_' + Date.now(),
                        type: blockType,
                        config: this.getDefaultConfig(blockType),
                        styles: this.getDefaultStyles(blockType),
                        order: this.blocks.length
                    };
                    
                    try {
                        const rendered = await this.renderBlock(blockData);
                        blockData.rendered = rendered;
                        
                        const blockInfo = this.availableBlocks.find(b => b.type === blockType);
                        blockData.metadata = blockInfo?.metadata || {};
                        
                        this.blocks.push(blockData);
                        
                        // Auto-select the new block
                        this.$nextTick(() => {
                            this.selectBlock(blockData.id);
                        });
                        
                        // Show success notification
                        const blockName = blockInfo?.metadata?.name || blockType;
                        this.showNotification(`${blockName} added successfully! ✨`, 'success');
                        
                        console.log('✅ Block added successfully:', blockData);
                    } catch (e) {
                        console.error('❌ Error adding block:', e);
                        this.showNotification(`Error adding component: ${e.message}`, 'error');
                    }
                },
                
                async renderBlock(blockData) {
                    try {
                        const response = await fetch('{{ route("page-builder.preview") }}', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                            },
                            body: JSON.stringify({ blocks: [blockData] })
                        });
                        
                        const result = await response.json();
                        
                        if (!response.ok) {
                            throw new Error(result.error || 'Error rendering block');
                        }
                        
                        return result.html || '<div class="error">Error rendering block</div>';
                    } catch (e) {
                        console.error('🔴 Render error:', e);
                        return `<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            <strong>Render Error:</strong> ${e.message}
                        </div>`;
                    }
                },
                
                getDefaultConfig(blockType) {
                    const defaults = {
                        hero: {
                            title: 'Amazing Title',
                            subtitle: 'Beautiful subtitle that describes your content perfectly',
                            button_text: 'Get Started',
                            button_url: '#',
                            show_button: true,
                        }
                    };
                    return defaults[blockType] || {};
                },
                
                getDefaultStyles(blockType) {
                    const defaults = {
                        hero: {
                            spacing: 'xl',
                            margin: 'none',
                            container: 'wide',
                            background: 'blue-500',
                            text_color: 'white',
                            text_align: 'center',
                            title_size: 'text-4xl',
                            font_weight: 'font-bold',
                        }
                    };
                    return defaults[blockType] || {};
                },
                
                selectBlock(blockId) {
                    this.selectedBlockId = blockId;
                    this.configTab = 'content';
                },
                
                async updateBlockConfig() {
                    if (!this.selectedBlock) return;
                    
                    try {
                        const rendered = await this.renderBlock(this.selectedBlock);
                        this.selectedBlock.rendered = rendered;
                    } catch (e) {
                        console.error('❌ Error updating block config:', e);
                        this.showNotification('Error updating component', 'error');
                    }
                },
                
                async updateBlockStyles() {
                    if (!this.selectedBlock) return;
                    
                    try {
                        const rendered = await this.renderBlock(this.selectedBlock);
                        this.selectedBlock.rendered = rendered;
                    } catch (e) {
                        console.error('❌ Error updating block styles:', e);
                        this.showNotification('Error updating styles', 'error');
                    }
                },
                
                removeBlock(index) {
                    this.showDeleteConfirmation(() => {
                        this.blocks.splice(index, 1);
                        this.selectedBlockId = null;
                        this.showNotification('Component deleted successfully 🗑️', 'success');
                    });
                },
                
                duplicateBlock(index) {
                    const originalBlock = this.blocks[index];
                    const duplicatedBlock = {
                        ...JSON.parse(JSON.stringify(originalBlock)),
                        id: 'block_' + Date.now()
                    };
                    
                    this.blocks.splice(index + 1, 0, duplicatedBlock);
                    
                    // Show success notification
                    const blockName = originalBlock.metadata?.name || originalBlock.type;
                    this.showNotification(`${blockName} duplicated successfully! 📋`, 'success');
                },
                
                clearCanvas() {
                    this.showDeleteConfirmation(() => {
                        this.blocks = [];
                        this.selectedBlockId = null;
                        this.showNotification('Canvas cleared successfully 🧹', 'success');
                    }, {
                        title: 'Clear Entire Canvas?',
                        message: 'This will permanently delete all components from your page.',
                        confirmText: 'Clear All',
                        cancelText: 'Keep Components'
                    });
                },
                
                exportJson() {
                    const exportData = {
                        version: '1.0',
                        timestamp: new Date().toISOString(),
                        blocks: this.blocks.map(block => ({
                            id: block.id,
                            type: block.type,
                            config: block.config,
                            styles: block.styles,
                            order: block.order
                        }))
                    };
                    
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                        type: 'application/json'
                    });
                    
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `page-builder-${new Date().getTime()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    
                    // Show success notification
                    this.showNotification('Page exported successfully! 📁', 'success');
                },
                
                async saveBlocks() {
                    try {
                        const response = await fetch('{{ route("page-builder.save") }}', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                            },
                            body: JSON.stringify({
                                blocks: this.blocks.map(block => ({
                                    id: block.id,
                                    type: block.type,
                                    config: block.config,
                                    styles: block.styles,
                                    order: block.order
                                }))
                            })
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            // Show success notification
                            this.showNotification('Page saved successfully! 🎉', 'success');
                        } else {
                            this.showNotification('Error saving page', 'error');
                        }
                    } catch (e) {
                        console.error('❌ Save error:', e);
                        this.showNotification(`Error saving page: ${e.message}`, 'error');
                    }
                },
                
                showNotification(message, type = 'info') {
                    const id = Date.now();
                    const notification = {
                        id,
                        message,
                        type,
                        show: false
                    };
                    
                    this.notifications.push(notification);
                    
                    // Show with delay for animation
                    this.$nextTick(() => {
                        const notif = this.notifications.find(n => n.id === id);
                        if (notif) notif.show = true;
                    });
                    
                    // Auto remove after 4 seconds
                    setTimeout(() => {
                        this.removeNotification(id);
                    }, 4000);
                },
                
                removeNotification(id) {
                    const index = this.notifications.findIndex(n => n.id === id);
                    if (index > -1) {
                        this.notifications[index].show = false;
                        // Remove from array after animation
                        setTimeout(() => {
                            const newIndex = this.notifications.findIndex(n => n.id === id);
                            if (newIndex > -1) {
                                this.notifications.splice(newIndex, 1);
                            }
                        }, 300);
                    }
                },
                
                showDeleteConfirmation(callback, customConfig = {}) {
                    this.modalConfig = {
                        title: 'Delete Component?',
                        message: 'This action cannot be undone. The component will be permanently deleted.',
                        confirmText: 'Delete',
                        cancelText: 'Cancel',
                        ...customConfig
                    };
                    this.modalCallback = callback;
                    this.showModal = true;
                },
                
                confirmDelete() {
                    if (this.modalCallback) {
                        this.modalCallback();
                        this.modalCallback = null;
                    }
                    this.showModal = false;
                },
                
                cancelDelete() {
                    this.modalCallback = null;
                    this.showModal = false;
                }
            }
        }
    </script>
</body>
</html>
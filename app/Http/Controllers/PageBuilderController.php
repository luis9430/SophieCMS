<?php
// app/Http/Controllers/PageBuilderController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\BlockBuilder\BlockRegistry;
use App\Services\BlockBuilder\BlockRenderer;

class PageBuilderController extends Controller
{
    public function index()
    {
        $availableBlocks = BlockRegistry::getBlocksInfo();
        
        // DEBUG: Verificar qué datos estamos enviando
        \Log::info('Available blocks:', $availableBlocks);
        
        return view('page-builder.index', compact('availableBlocks'));
    }
    
    public function preview(Request $request)
    {
        $blockData = $request->input('blocks.0'); // Solo el primer bloque para preview
        
        try {
            // Crear el bloque manualmente para preview
            $block = BlockRegistry::create(
                $blockData['type'], 
                $blockData['config'] ?? [], 
                $blockData['styles'] ?? []
            );
            
            $html = $block->render();
            return response()->json(['html' => $html]);
        } catch (\Exception $e) {
            \Log::error('Preview error:', ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
    
    public function save(Request $request)
    {
        $blocksData = $request->input('blocks', []);
        $pageId = $request->input('page_id');
        
        return response()->json(['success' => true, 'message' => 'Página guardada']);
    }
}
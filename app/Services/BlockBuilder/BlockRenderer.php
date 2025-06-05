<?php
// app/Services/BlockBuilder/BlockRenderer.php

namespace App\Services\BlockBuilder;

use App\Services\BlockBuilder\Contracts\BlockInterface;

class BlockRenderer
{
    /**
     * Renderiza un array de datos de bloques
     */
    public static function renderFromJson(string $json): string
    {
        $data = json_decode($json, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return '<div class="error">JSON inválido</div>';
        }
        
        return self::renderFromArray($data);
    }
    
    /**
     * Renderiza desde array de datos
     */
    public static function renderFromArray(array $data): string
    {
        $blocks = $data['blocks'] ?? [];
        $output = '';
        
        // Ordenar bloques por orden
        usort($blocks, function($a, $b) {
            return ($a['order'] ?? 0) <=> ($b['order'] ?? 0);
        });
        
        foreach ($blocks as $blockData) {
            try {
                $block = BlockRegistry::createFromArray($blockData);
                $output .= $block->render();
            } catch (\Exception $e) {
                $output .= self::renderError($e->getMessage());
            }
        }
        
        return $output;
    }
    
    /**
     * Renderiza una colección de bloques
     */
    public static function renderBlocks(array $blocks): string
    {
        $output = '';
        
        foreach ($blocks as $block) {
            if ($block instanceof BlockInterface) {
                $output .= $block->render();
            }
        }
        
        return $output;
    }
    
    /**
     * Renderiza preview desde JSON
     */
    public static function renderPreviewFromJson(string $json): string
    {
        $data = json_decode($json, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return '<div class="error">JSON inválido</div>';
        }
        
        return self::renderPreviewFromArray($data);
    }
    
    /**
     * Renderiza preview desde array
     */
    public static function renderPreviewFromArray(array $data): string
    {
        $blocks = $data['blocks'] ?? [];
        $output = '';
        
        // Ordenar bloques por orden
        usort($blocks, function($a, $b) {
            return ($a['order'] ?? 0) <=> ($b['order'] ?? 0);
        });
        
        foreach ($blocks as $blockData) {
            try {
                $block = BlockRegistry::createFromArray($blockData);
                $output .= $block->renderPreview();
            } catch (\Exception $e) {
                $output .= self::renderError($e->getMessage());
            }
        }
        
        return $output;
    }
    
    /**
     * Convierte bloques a array para JSON
     */
    public static function blocksToArray(array $blocks): array
    {
        $result = ['blocks' => []];
        
        foreach ($blocks as $block) {
            if ($block instanceof BlockInterface) {
                $result['blocks'][] = self::blockToArray($block);
            }
        }
        
        return $result;
    }
    
    /**
     * Convierte un bloque a array
     */
    public static function blockToArray(BlockInterface $block): array
    {
        $data = [
            'id' => $block->getId(),
            'type' => $block->getType(),
            'config' => $block->getConfig(),
            'styles' => $block->getStyles(),
            'order' => 1, // Se puede implementar lógica de orden
            'children' => []
        ];
        
        foreach ($block->getChildren() as $child) {
            $data['children'][] = self::blockToArray($child);
        }
        
        return $data;
    }
    
    /**
     * Renderiza mensaje de error
     */
    private static function renderError(string $message): string
    {
        return '<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong>Error:</strong> ' . htmlspecialchars($message) . '
                </div>';
    }
}
<?php
// app/Services/BlockBuilder/BlockRegistry.php

namespace App\Services\BlockBuilder;

use App\Services\BlockBuilder\Contracts\BlockInterface;
use App\Services\BlockBuilder\Exceptions\BlockNotFoundException;
use App\Services\BlockBuilder\Exceptions\InvalidBlockException;

class BlockRegistry
{
    private static array $blocks = [];
    private static bool $initialized = false;
    
    /**
     * Inicializa el registry con los bloques por defecto
     */
    public static function initialize(): void
    {
        if (self::$initialized) {
            return;
        }
        
        $defaultBlocks = config('block-builder.default_blocks', []);
        
        foreach ($defaultBlocks as $type => $class) {
            self::register($type, $class);
        }
        
        self::$initialized = true;
    }
    
    /**
     * Registra un nuevo tipo de bloque
     */
    public static function register(string $type, string $class): void
    {
        if (!class_exists($class)) {
            throw new InvalidBlockException("La clase {$class} no existe");
        }
        
        if (!is_subclass_of($class, BlockInterface::class)) {
            throw new InvalidBlockException("La clase {$class} debe implementar BlockInterface");
        }
        
        self::$blocks[$type] = $class;
    }
    
    /**
     * Crea una instancia de un bloque
     */
    public static function create(string $type, array $config = [], array $styles = []): BlockInterface
    {
        self::initialize();
        
        if (!isset(self::$blocks[$type])) {
            throw new BlockNotFoundException("Bloque tipo '{$type}' no encontrado");
        }
        
        $class = self::$blocks[$type];
        return new $class($config, $styles);
    }
    
    /**
     * Crea un bloque desde estructura JSON
     */
    public static function createFromArray(array $data): BlockInterface
    {
        $type = $data['type'] ?? null;
        $config = $data['config'] ?? [];
        $styles = $data['styles'] ?? [];
        $id = $data['id'] ?? null;
        
        if (!$type) {
            throw new InvalidBlockException("Tipo de bloque requerido");
        }
        
        $block = self::create($type, $config, $styles);
        
        if ($id) {
            $block->setId($id);
        }
        
        // Crear bloques hijos recursivamente
        if (!empty($data['children'])) {
            foreach ($data['children'] as $childData) {
                $childBlock = self::createFromArray($childData);
                $block->addChild($childBlock);
            }
        }
        
        return $block;
    }
    
    /**
     * Obtiene todos los tipos de bloques disponibles
     */
    public static function getAvailable(): array
    {
        self::initialize();
        return array_keys(self::$blocks);
    }
    
    /**
     * Obtiene información de todos los bloques registrados
     */
    public static function getBlocksInfo(): array
    {
        self::initialize();
        $info = [];
        
        foreach (self::$blocks as $type => $class) {
            try {
                $instance = new $class();
                $info[] = [
                    'type' => $type,
                    'class' => $class,
                    'metadata' => $instance->getMetadata(),
                    'settings_schema' => method_exists($instance, 'getSettingsSchema') ? $instance->getSettingsSchema() : []
                ];
            } catch (\Exception $e) {
                \Log::error("Error getting info for block {$type}: " . $e->getMessage());
            }
        }
        
        return $info;
    }
    
    /**
     * Verifica si existe un tipo de bloque
     */
    public static function exists(string $type): bool
    {
        self::initialize();
        return isset(self::$blocks[$type]);
    }
    
    /**
     * Desregistra un tipo de bloque
     */
    public static function unregister(string $type): void
    {
        unset(self::$blocks[$type]);
    }
    
    /**
     * Limpia todos los bloques registrados
     */
    public static function clear(): void
    {
        self::$blocks = [];
        self::$initialized = false;
    }
    
    /**
     * Obtiene la clase de un tipo de bloque
     */
    public static function getClass(string $type): ?string
    {
        self::initialize();
        return self::$blocks[$type] ?? null;
    }
}
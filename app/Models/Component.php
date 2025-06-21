<?php

// app/Models/Component.php - Reemplazar completamente

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Component extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'identifier',
        'category',
        'description',
        'blade_template',
        'default_config',
        'external_assets',
        'communication_config',
        'props_schema',
        'preview_config',
        'is_advanced',
        'is_active',
        'created_by_user_id',
        'preview_image',
        'last_edited_at',
        'version',
        'blade_template',
        'page_builder_template',        
        'auto_generate_short',        
        'template_config',  
    ];

    protected $casts = [
        'default_config' => 'array',
        'external_assets' => 'array',
        'communication_config' => 'array',
        'props_schema' => 'array',
        'preview_config' => 'array',
        'is_advanced' => 'boolean',
        'is_active' => 'boolean',
        'last_edited_at' => 'datetime',
        'template_config' => 'array',       

        'auto_generate_short' => 'boolean', 
    ];

    protected $dates = [
        'last_edited_at'
    ];

    // Accessors mejorados para manejar datos corruptos
    public function getExternalAssetsAttribute($value)
    {
        if (is_null($value)) {
            return [];
        }
        
        if (is_array($value)) {
            return $value;
        }
        
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            return is_array($decoded) ? $decoded : [];
        }
        
        return [];
    }

    public function getCommunicationConfigAttribute($value)
    {
        $default = ['emits' => [], 'listens' => [], 'state' => []];
        
        if (is_null($value)) {
            return $default;
        }
        
        if (is_array($value)) {
            return array_merge($default, $value);
        }
        
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (is_array($decoded)) {
                return array_merge($default, $decoded);
            }
        }
        
        return $default;
    }

    public function getPropsSchemaAttribute($value)
    {
        if (is_null($value)) {
            return [];
        }
        
        if (is_array($value)) {
            return $value;
        }
        
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            return is_array($decoded) ? $decoded : [];
        }
        
        return [];
    }

    public function getPreviewConfigAttribute($value)
    {
        if (is_null($value)) {
            return [];
        }
        
        if (is_array($value)) {
            return $value;
        }
        
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            return is_array($decoded) ? $decoded : [];
        }
        
        return [];
    }

    public function getDefaultConfigAttribute($value)
    {
        if (is_null($value)) {
            return [];
        }
        
        if (is_array($value)) {
            return $value;
        }
        
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            return is_array($decoded) ? $decoded : [];
        }
        
        return [];
    }

    // Mutators para asegurar que se guardan como JSON
    public function setExternalAssetsAttribute($value)
    {
        $this->attributes['external_assets'] = is_array($value) ? json_encode($value) : $value;
    }

    public function setCommunicationConfigAttribute($value)
    {
        $this->attributes['communication_config'] = is_array($value) ? json_encode($value) : $value;
    }

    public function setPropsSchemaAttribute($value)
    {
        $this->attributes['props_schema'] = is_array($value) ? json_encode($value) : $value;
    }

    public function setPreviewConfigAttribute($value)
    {
        $this->attributes['preview_config'] = is_array($value) ? json_encode($value) : $value;
    }

    public function setDefaultConfigAttribute($value)
    {
        $this->attributes['default_config'] = is_array($value) ? json_encode($value) : $value;
    }

    // Relationship con el usuario que lo creó
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    // Scope para componentes avanzados
    public function scopeAdvanced($query)
    {
        return $query->where('is_advanced', true);
    }

    // Scope para componentes activos
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }


        public function getTemplateForContext(string $context = 'page-builder'): string
    {
        switch ($context) {
            case 'page-builder':
                return $this->page_builder_template ?? $this->blade_template;
            case 'component-builder':
            case 'preview':
            default:
                return $this->blade_template;
        }
    }

        public function hasShortTemplate(): bool
        {
            return !empty($this->page_builder_template);
        }

        public function shouldAutoGenerate(): bool
        {
            return $this->auto_generate_short ?? true;
        }

}
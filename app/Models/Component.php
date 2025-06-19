<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Component extends Model
{
    protected $fillable = [
        'name',
        'identifier', 
        'category',
        'description',
        'blade_template',
        'default_config',
        'preview_image',
        'is_active'
    ];

    protected $casts = [
        'default_config' => 'array',
        'is_active' => 'boolean',
    ];

    // Mutator: cuando se guarda (string -> array)
    public function setDefaultConfigAttribute($value)
    {
        if (is_string($value)) {
            // Si es string, intentar decodificar JSON
            $decoded = json_decode($value, true);
            $this->attributes['default_config'] = json_encode($decoded ?: []);
        } else {
            // Si ya es array, encodear
            $this->attributes['default_config'] = json_encode($value ?: []);
        }
    }

    // Accessor: cuando se lee (array -> string para mostrar en form)
    public function getDefaultConfigAttribute($value)
    {
        if (is_null($value)) {
            return '';
        }
        
        // Si es string JSON, devolverlo formateado
        $decoded = json_decode($value, true);
        return $decoded ? json_encode($decoded, JSON_PRETTY_PRINT) : '';
    }
}
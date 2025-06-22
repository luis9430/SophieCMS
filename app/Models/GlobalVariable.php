<?php

// app/Models/GlobalVariable.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GlobalVariable extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'value',
        'type',
        'description',
        'created_by_user_id',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Relationship con el usuario que creó la variable
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /**
     * Scope para variables activas
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Obtener el valor parseado según el tipo
     */
    public function getParsedValueAttribute()
    {
        switch ($this->type) {
            case 'number':
                return (float) $this->value;
            case 'boolean':
                return filter_var($this->value, FILTER_VALIDATE_BOOLEAN);
            case 'array':
                return $this->parseArrayValue($this->value);
            default:
                return $this->value;
        }
    }

    /**
     * Parsear valor de array
     */
    protected function parseArrayValue($arrayString)
    {
        // Si está vacío, devolver array vacío
        if (empty($arrayString)) {
            return [];
        }

        try {
            // Intentar parsear como JSON
            if (str_starts_with(trim($arrayString), '[') && str_ends_with(trim($arrayString), ']')) {
                $decoded = json_decode($arrayString, true);
                return is_array($decoded) ? $decoded : [];
            }

            // Si no es JSON, dividir por comas
            return array_map('trim', explode(',', $arrayString));
        } catch (\Exception $e) {
            // En caso de error, dividir por comas
            return array_map('trim', explode(',', $arrayString));
        }
    }

    /**
     * Validar nombre de variable
     */
    public static function validateVariableName($name)
    {
        // Solo letras, números y underscore, no puede empezar con número
        return preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $name);
    }

    /**
     * Obtener todas las variables como array asociativo para Blade
     */
    public static function getAllForBlade()
    {
        return static::active()
            ->get()
            ->pluck('parsed_value', 'name')
            ->toArray();
    }

    /**
     * Crear o actualizar variable
     */
    public static function createOrUpdate($name, $value, $type = 'string', $userId = null)
    {
        // Validar nombre
        if (!static::validateVariableName($name)) {
            throw new \InvalidArgumentException('Invalid variable name format');
        }

        return static::updateOrCreate(
            ['name' => $name],
            [
                'value' => $value,
                'type' => $type,
                'created_by_user_id' => $userId ?: auth()->id(),
                'is_active' => true
            ]
        );
    }
}
<?php
// app/Models/Variable.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class Variable extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'type',
        'category',
        'description',
        'cache_ttl',
        'refresh_strategy',
        'config',
        'is_active',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'config' => 'json',
        'cache_ttl' => 'integer',
        'is_active' => 'boolean',
        'last_refreshed_at' => 'datetime'
    ];

    // ===================================================================
    // RELATIONSHIPS
    // ===================================================================

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // ===================================================================
    // SCOPES
    // ===================================================================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeNeedsRefresh($query)
    {
        return $query->whereNotNull('cache_ttl')
            ->where(function ($q) {
                $q->whereNull('last_refreshed_at')
                  ->orWhereRaw('last_refreshed_at < DATE_SUB(NOW(), INTERVAL cache_ttl SECOND)');
            });
    }

    // ===================================================================
    // ACCESSORS & MUTATORS
    // ===================================================================

    public function getValueAttribute($value)
    {
        // Try to decode JSON, return as-is if not JSON
        $decoded = json_decode($value, true);
        return json_last_error() === JSON_ERROR_NONE ? $decoded : $value;
    }

    public function setValueAttribute($value)
    {
        // Encode arrays/objects as JSON
        $this->attributes['value'] = is_array($value) || is_object($value) 
            ? json_encode($value) 
            : $value;
    }

    public function getCacheKeyAttribute()
    {
        return "variable:{$this->key}";
    }

    public function getIsExpiredAttribute()
    {
        if (is_null($this->cache_ttl)) {
            return false; // Never expires
        }

        if (is_null($this->last_refreshed_at)) {
            return true; // Never refreshed
        }

        return $this->last_refreshed_at->addSeconds($this->cache_ttl)->isPast();
    }

    // ===================================================================
    // VARIABLE RESOLUTION METHODS
    // ===================================================================

    /**
     * Resolve variable value with caching
     */
    public function resolve($force = false)
    {
        try {
            // Check cache first (unless forced)
            if (!$force && !$this->is_expired) {
                $cached = Cache::get($this->cache_key);
                if ($cached !== null) {
                    return $cached;
                }
            }

            // Resolve based on type
            $value = match($this->type) {
                'static' => $this->resolveStatic(),
                'dynamic' => $this->resolveDynamic(),
                'external' => $this->resolveExternal(),
                'computed' => $this->resolveComputed(),
                default => $this->value
            };

            // Cache the result
            $this->cacheValue($value);

            // Update refresh timestamp
            $this->update([
                'last_refreshed_at' => now(),
                'last_error' => null
            ]);

            return $value;

        } catch (\Exception $e) {
            // Log error and return cached value if available
            $this->update(['last_error' => $e->getMessage()]);
            
            $cached = Cache::get($this->cache_key);
            if ($cached !== null) {
                return $cached;
            }

            throw $e;
        }
    }

    /**
     * Resolve static variable (just return stored value)
     */
    protected function resolveStatic()
    {
        return $this->value;
    }

    /**
     * Resolve dynamic variable (database query)
     */
    protected function resolveDynamic()
    {
        $config = $this->config ?? [];
        
        if (isset($config['query'])) {
            // Raw SQL query
            $result = DB::select($config['query'], $config['params'] ?? []);
            return count($result) === 1 ? $result[0] : $result;
        }

        if (isset($config['model']) && isset($config['method'])) {
            // Model method call
            $model = app($config['model']);
            $method = $config['method'];
            $params = $config['params'] ?? [];
            
            return $model->$method(...$params);
        }

        return $this->value;
    }

    /**
     * Resolve external variable (API call)
     */
    protected function resolveExternal()
    {
        $config = $this->config ?? [];
        
        if (!isset($config['url'])) {
            throw new \Exception('External variable requires URL in config');
        }

        $response = Http::timeout($config['timeout'] ?? 30);

        // Add headers if configured
        if (isset($config['headers'])) {
            $response = $response->withHeaders($config['headers']);
        }

        // Add auth if configured
        if (isset($config['auth'])) {
            if ($config['auth']['type'] === 'bearer') {
                $response = $response->withToken($config['auth']['token']);
            }
        }

        // Make request
        $httpResponse = match($config['method'] ?? 'GET') {
            'GET' => $response->get($config['url'], $config['params'] ?? []),
            'POST' => $response->post($config['url'], $config['data'] ?? []),
            default => throw new \Exception('Unsupported HTTP method')
        };

        if (!$httpResponse->successful()) {
            throw new \Exception("API request failed: {$httpResponse->status()}");
        }

        $data = $httpResponse->json();

        // Apply transformation if configured
        if (isset($config['transform'])) {
            return $this->applyTransform($data, $config['transform']);
        }

        return $data;
    }

    /**
     * Resolve computed variable (custom logic)
     */
    protected function resolveComputed()
    {
        $config = $this->config ?? [];
        
        if (isset($config['class']) && isset($config['method'])) {
            $class = app($config['class']);
            $method = $config['method'];
            $params = $config['params'] ?? [];
            
            return $class->$method(...$params);
        }

        // For simple computed variables, you can add custom logic here
        return $this->value;
    }

    /**
     * Apply transformation to data
     */
    protected function applyTransform($data, $transform)
    {
        // Simple dot notation support
        $keys = explode('.', $transform);
        $result = $data;

        foreach ($keys as $key) {
            if (is_array($result) && isset($result[$key])) {
                $result = $result[$key];
            } elseif (is_object($result) && isset($result->$key)) {
                $result = $result->$key;
            } else {
                return null;
            }
        }

        return $result;
    }

    /**
     * Cache the resolved value
     */
    protected function cacheValue($value)
    {
        if ($this->cache_ttl) {
            Cache::put($this->cache_key, $value, $this->cache_ttl);
        } else {
            Cache::forever($this->cache_key, $value);
        }
    }

    // ===================================================================
    // STATIC HELPER METHODS
    // ===================================================================

    /**
     * Get all variables by category
     */
    public static function getByCategory($category)
    {
        return static::active()->byCategory($category)->get();
    }

    /**
     * Resolve multiple variables at once
     */
    public static function resolveMultiple(array $keys, $force = false)
    {
        $variables = static::active()->whereIn('key', $keys)->get();
        $results = [];

        foreach ($variables as $variable) {
            try {
                $results[$variable->key] = $variable->resolve($force);
            } catch (\Exception $e) {
                $results[$variable->key] = null;
            }
        }

        return $results;
    }

    /**
     * Get all variables for frontend (with resolved values)
     */
    public static function getAllForFrontend()
    {
        $variables = static::active()->get();
        $results = [];

        foreach ($variables as $variable) {
            try {
                $results[$variable->key] = $variable->resolve();
            } catch (\Exception $e) {
                // Skip failed variables
                continue;
            }
        }

        return $results;
    }

    /**
     * Refresh all expired variables
     */
    public static function refreshExpired()
    {
        $expired = static::active()->needsRefresh()->get();
        
        foreach ($expired as $variable) {
            try {
                $variable->resolve(true);
            } catch (\Exception $e) {
                // Continue with other variables
                continue;
            }
        }

        return $expired->count();
    }
}
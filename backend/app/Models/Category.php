<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    /** The sizes every product needs when the category has `requires_size`. */
    public const SIZES = ['Small', 'Medium', 'Large'];

    protected $fillable = [
        'restaurant_id', 'name', 'image', 'description', 'sort_order', 'is_active', 'requires_size',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active' => 'boolean',
            'requires_size' => 'boolean',
        ];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}

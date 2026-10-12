<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A menu item.
 *
 * `is_active` controls whether the kiosk shows it at all; `is_available` is
 * stock — an active but unavailable product is displayed as "Sold out".
 */
class Product extends Model
{
    protected $fillable = [
        'category_id', 'restaurant_id', 'name', 'description', 'image', 'price',
        'sku', 'is_available', 'is_active', 'is_combo',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_available' => 'boolean',
            'is_active' => 'boolean',
            'is_combo' => 'boolean',
        ];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /** Sizes, e.g. Small / Medium / Large, each with its own price. */
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    /** Add-on groups offered with this product. */
    public function modifierGroups(): BelongsToMany
    {
        return $this->belongsToMany(ModifierGroup::class);
    }

    /** For a combo: the products it bundles. */
    public function comboItems(): HasMany
    {
        return $this->hasMany(ComboItem::class, 'combo_id');
    }
}

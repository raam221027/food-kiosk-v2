<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A set of add-ons, e.g. "Extra toppings", with selection limits. */
class ModifierGroup extends Model
{
    protected $fillable = ['restaurant_id', 'name', 'min_selection', 'max_selection', 'is_required'];

    protected function casts(): array
    {
        return [
            'min_selection' => 'integer',
            'max_selection' => 'integer',
            'is_required' => 'boolean',
        ];
    }

    public function modifiers(): HasMany
    {
        return $this->hasMany(Modifier::class);
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class);
    }
}

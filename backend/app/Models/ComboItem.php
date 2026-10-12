<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One component of a combo meal: `quantity` x `product` inside `combo`. */
class ComboItem extends Model
{
    protected $fillable = ['combo_id', 'product_id', 'quantity'];

    protected function casts(): array
    {
        return ['quantity' => 'integer'];
    }

    public function combo(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'combo_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * A customer order. Prices are snapshotted on its items so later menu changes
 * never rewrite order history.
 */
class Order extends Model
{
    protected $fillable = [
        'restaurant_id', 'order_number', 'order_type', 'order_status', 'subtotal', 'tax',
        'tip', 'discount', 'total_amount', 'customer_name', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'tax' => 'decimal:2',
            'tip' => 'decimal:2',
            'discount' => 'decimal:2',
            'total_amount' => 'decimal:2',
        ];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /** The ticket the kitchen display works from. */
    public function kitchenOrder(): HasOne
    {
        return $this->hasOne(KitchenOrder::class);
    }
}

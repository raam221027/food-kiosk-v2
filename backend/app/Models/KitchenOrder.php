<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A kitchen ticket: pending → preparing → ready → completed. Its status is
 * mirrored onto the order so the cashier and reports see the same progress.
 */
class KitchenOrder extends Model
{
    protected $fillable = ['order_id', 'status', 'priority', 'started_at', 'completed_at'];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}

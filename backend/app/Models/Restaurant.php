<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Restaurant extends Model
{
    protected $fillable = [
        'name', 'address', 'city', 'state', 'zip_code', 'phone_number', 'email',
        'tax_id', 'logo', 'website', 'timezone', 'currency', 'language', 'status',
    ];

    protected function casts(): array
    {
        return ['status' => 'boolean'];
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}

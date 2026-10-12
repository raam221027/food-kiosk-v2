<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * categories.requires_size: every regular product in the category must come in
 * Small, Medium and Large, and kiosk customers must pick one.
 *
 * Turns it on for the existing Fries and Drinks categories and gives their
 * products any of the three sizes they are missing, priced from the product's
 * base price (+0.50 for Medium, +1.00 for Large) so the manager can adjust.
 */
return new class extends Migration
{
    private const SIZES = ['Small' => 0, 'Medium' => 0.5, 'Large' => 1];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->boolean('requires_size')->default(false)->after('is_active');
        });

        DB::table('categories')->whereIn('name', ['Fries', 'Drinks'])->update(['requires_size' => true]);

        $products = DB::table('products')
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->where('categories.requires_size', true)
            ->where('products.is_combo', false)
            ->select('products.id', 'products.price')
            ->get();

        foreach ($products as $product) {
            $existing = DB::table('product_variants')
                ->where('product_id', $product->id)
                ->pluck('name')
                ->map(fn ($name) => strtolower(trim($name)));

            foreach (self::SIZES as $name => $extra) {
                if ($existing->contains(strtolower($name))) {
                    continue;
                }
                DB::table('product_variants')->insert([
                    'product_id' => $product->id,
                    'name' => $name,
                    'price' => round($product->price + $extra, 2),
                    'is_available' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations. Sizes added above are left in place.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('requires_size');
        });
    }
};

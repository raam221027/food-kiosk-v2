<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Columns and tables the manager menu tools need on top of the base schema.
 *
 * - products.is_active: whether the product is shown on the kiosk at all.
 *   `is_available` keeps its existing meaning (in stock), so turning it off
 *   shows the item as "Sold out" instead of hiding it.
 * - products.is_combo + combo_items: a combo is a product made of other products.
 * - modifier_group_product: which add-on groups a product offers.
 * - categories.image becomes optional, since not every category has artwork.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->string('image')->nullable()->change();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('is_available');
            $table->boolean('is_combo')->default(false)->after('is_active');
        });

        Schema::create('combo_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('combo_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->unsignedInteger('quantity')->default(1);
            $table->timestamps();

            $table->unique(['combo_id', 'product_id']);
        });

        Schema::create('modifier_group_product', function (Blueprint $table) {
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('modifier_group_id')->constrained()->cascadeOnDelete();

            $table->primary(['product_id', 'modifier_group_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('modifier_group_product');
        Schema::dropIfExists('combo_items');

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['is_active', 'is_combo']);
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->string('image')->nullable(false)->change();
        });
    }
};

<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\ModifierGroup;
use App\Models\Product;
use App\Models\Restaurant;
use Illuminate\Database\Seeder;

/**
 * A starter menu — Burgers, Fries and Drinks (the last two require Small /
 * Medium / Large sizes), add-ons and a combo — so the manager screens and the
 * kiosk have something to show. Safe to re-run:
 * it does nothing once the restaurant has products.
 */
class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $restaurant = Restaurant::query()->orderBy('id')->firstOrFail();

        if ($restaurant->products()->exists()) {
            return;
        }

        $toppings = ModifierGroup::create([
            'restaurant_id' => $restaurant->id,
            'name' => 'Extra toppings',
            'min_selection' => 0,
            'max_selection' => 3,
        ]);
        $toppings->modifiers()->createMany([
            ['name' => 'Cheese', 'price' => 0.75],
            ['name' => 'Bacon', 'price' => 1.50],
            ['name' => 'Jalapeños', 'price' => 0.50],
        ]);

        $sauces = ModifierGroup::create([
            'restaurant_id' => $restaurant->id,
            'name' => 'Dipping sauce',
            'min_selection' => 0,
            'max_selection' => 2,
        ]);
        $sauces->modifiers()->createMany([
            ['name' => 'Ketchup', 'price' => 0],
            ['name' => 'Garlic mayo', 'price' => 0.50],
            ['name' => 'BBQ', 'price' => 0.50],
        ]);

        $category = fn (string $name, int $order, string $description, bool $requiresSize = false) => Category::create([
            'restaurant_id' => $restaurant->id,
            'name' => $name,
            'description' => $description,
            'sort_order' => $order,
            'requires_size' => $requiresSize,
        ]);
        $burgers = $category('Burgers', 1, 'Flame-grilled patties on brioche');
        $fries = $category('Fries', 2, 'Crispy, salted and hot', true);
        $drinks = $category('Drinks', 3, 'Soft drinks and shakes', true);

        $product = fn (Category $category, string $name, float $price, string $sku, string $description) => Product::create([
            'restaurant_id' => $restaurant->id,
            'category_id' => $category->id,
            'name' => $name,
            'description' => $description,
            'price' => $price,
            'sku' => $sku,
        ]);

        $classic = $product($burgers, 'Classic Burger', 6.49, 'BRG-CLASSIC', 'Beef patty, lettuce, tomato, house sauce.');
        $cheese = $product($burgers, 'Double Cheeseburger', 8.49, 'BRG-DOUBLE', 'Two patties, two slices of cheddar.');
        $classic->modifierGroups()->attach($toppings);
        $cheese->modifierGroups()->attach($toppings);

        $regularFries = $product($fries, 'Fries', 2.99, 'FRY-REGULAR', 'Golden shoestring fries.');
        $regularFries->modifierGroups()->attach($sauces);
        $regularFries->variants()->createMany([
            ['name' => 'Small', 'price' => 2.99],
            ['name' => 'Medium', 'price' => 3.49],
            ['name' => 'Large', 'price' => 3.99],
        ]);

        $cola = $product($drinks, 'Cola', 1.99, 'DRK-COLA', 'Ice-cold fountain cola.');
        $cola->variants()->createMany([
            ['name' => 'Small', 'price' => 1.99],
            ['name' => 'Medium', 'price' => 2.49],
            ['name' => 'Large', 'price' => 2.99],
        ]);
        $shake = $product($drinks, 'Chocolate Shake', 4.49, 'DRK-SHAKE', 'Thick, hand-spun chocolate shake.');
        $shake->variants()->createMany([
            ['name' => 'Small', 'price' => 4.49],
            ['name' => 'Medium', 'price' => 4.99],
            ['name' => 'Large', 'price' => 5.49],
        ]);

        $combo = Product::create([
            'restaurant_id' => $restaurant->id,
            'category_id' => $burgers->id,
            'name' => 'Classic Combo',
            'description' => 'Classic Burger, Fries and a Cola.',
            'price' => 9.99,
            'sku' => 'CMB-CLASSIC',
            'is_combo' => true,
        ]);
        $combo->comboItems()->createMany([
            ['product_id' => $classic->id, 'quantity' => 1],
            ['product_id' => $regularFries->id, 'quantity' => 1],
            ['product_id' => $cola->id, 'quantity' => 1],
        ]);
    }
}

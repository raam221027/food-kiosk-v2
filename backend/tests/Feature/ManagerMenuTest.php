<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\ModifierGroup;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\MenuSeeder;
use Database\Seeders\RestaurantSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ManagerMenuTest extends TestCase
{
    use RefreshDatabase;

    private User $manager;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([RoleSeeder::class, RestaurantSeeder::class, MenuSeeder::class]);

        $this->manager = User::factory()->create();
        $this->manager->assignRole('manager');
    }

    public function test_only_managers_and_admins_can_manage_the_menu(): void
    {
        $this->getJson('/api/manager/products')->assertUnauthorized();

        $cashier = User::factory()->create();
        $cashier->assignRole('cashier');
        $this->actingAs($cashier)->getJson('/api/manager/products')->assertForbidden();

        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $this->actingAs($admin)->getJson('/api/manager/products')->assertOk();
    }

    public function test_manager_can_create_a_product_with_sizes_and_add_ons(): void
    {
        $category = Category::where('name', 'Fries')->first();
        $sauces = ModifierGroup::where('name', 'Dipping sauce')->first();

        $response = $this->actingAs($this->manager)->postJson('/api/manager/products', [
            'category_id' => $category->id,
            'name' => 'Curly Fries',
            'description' => 'Seasoned spirals.',
            'price' => 3.29,
            'is_active' => true,
            'is_available' => true,
            'variants' => [
                ['name' => 'large', 'price' => 4.29],
                ['name' => 'Small', 'price' => 3.29],
                ['name' => 'Medium', 'price' => 3.79],
            ],
            'modifier_group_ids' => [$sauces->id],
        ]);

        // Sizes come back in Small / Medium / Large order with the price taken from Small.
        $response->assertCreated()
            ->assertJsonPath('data.name', 'Curly Fries')
            ->assertJsonPath('data.price', '3.29')
            ->assertJsonPath('data.variants.*.name', ['Small', 'Medium', 'Large'])
            ->assertJsonPath('data.modifier_groups.0.id', $sauces->id);

        $this->assertStringStartsWith('SKU-', $response->json('data.sku'));
    }

    public function test_fries_and_drinks_require_small_medium_and_large(): void
    {
        $drinks = Category::where('name', 'Drinks')->first();
        $this->assertTrue($drinks->requires_size);

        $post = fn (array $variants) => $this->actingAs($this->manager)->postJson('/api/manager/products', [
            'category_id' => $drinks->id,
            'name' => 'Lemonade',
            'price' => 2,
            'variants' => $variants,
        ]);

        $post([])->assertUnprocessable()->assertJsonValidationErrors('variants');
        $post([
            ['name' => 'Small', 'price' => 2],
            ['name' => 'Large', 'price' => 3],
        ])->assertUnprocessable()->assertJsonValidationErrors('variants');
        $post([
            ['name' => 'Small', 'price' => 2],
            ['name' => 'Small', 'price' => 2],
            ['name' => 'Large', 'price' => 3],
        ])->assertUnprocessable()->assertJsonValidationErrors('variants');

        // Burgers do not require sizes.
        $this->actingAs($this->manager)->postJson('/api/manager/products', [
            'category_id' => Category::where('name', 'Burgers')->value('id'),
            'name' => 'Veggie Burger',
            'price' => 7,
        ])->assertCreated();

        $kioskShake = collect($this->getJson('/api/products')->json('data'))->firstWhere('sku', 'DRK-SHAKE');
        $this->assertCount(3, $kioskShake['variants']);
        $this->assertTrue($kioskShake['category']['requires_size']);
    }

    public function test_editing_sizes_keeps_ones_used_by_past_orders(): void
    {
        $burger = Product::where('sku', 'BRG-CLASSIC')->first();
        $save = fn (array $variants) => $this->actingAs($this->manager)->putJson("/api/manager/products/{$burger->id}", [
            'category_id' => $burger->category_id,
            'name' => $burger->name,
            'price' => 6.49,
            'variants' => $variants,
        ])->assertOk();

        [$single, $double] = $save([
            ['name' => 'Single', 'price' => 6.49],
            ['name' => 'Double', 'price' => 8.49],
            ['name' => 'Triple', 'price' => 10.49],
        ])->json('data.variants');
        $this->orderItem($burger, $single['id']);

        $save([['id' => $double['id'], 'name' => 'Double', 'price' => 8.99]]);

        $this->assertDatabaseHas('product_variants', ['id' => $single['id'], 'is_available' => false]);
        $this->assertDatabaseHas('product_variants', ['id' => $double['id'], 'price' => 8.99]);
        $this->assertDatabaseMissing('product_variants', ['product_id' => $burger->id, 'name' => 'Triple']);
    }

    public function test_combo_validation(): void
    {
        $combo = Product::where('is_combo', true)->first();
        $burger = Product::where('sku', 'BRG-CLASSIC')->first();

        // A combo cannot contain another combo.
        $this->actingAs($this->manager)->postJson('/api/manager/products', [
            'category_id' => $combo->category_id,
            'name' => 'Mega Combo',
            'price' => 15,
            'is_combo' => true,
            'combo_items' => [['product_id' => $combo->id, 'quantity' => 1]],
        ])->assertUnprocessable()->assertJsonValidationErrors('combo_items.0.product_id');

        // A product inside a combo cannot itself become a combo.
        $this->actingAs($this->manager)->putJson("/api/manager/products/{$burger->id}", [
            'category_id' => $burger->category_id,
            'name' => $burger->name,
            'price' => 6.49,
            'is_combo' => true,
            'combo_items' => [['product_id' => Product::where('sku', 'DRK-SHAKE')->value('id'), 'quantity' => 1]],
        ])->assertUnprocessable()->assertJsonValidationErrors('is_combo');
    }

    public function test_hidden_products_leave_the_kiosk_and_sold_out_ones_stay_greyed_out(): void
    {
        $cola = Product::where('sku', 'DRK-COLA')->first();
        $shake = Product::where('sku', 'DRK-SHAKE')->first();

        $this->actingAs($this->manager)->patchJson("/api/manager/products/{$cola->id}/status", ['is_active' => false])->assertOk();
        $this->actingAs($this->manager)->patchJson("/api/manager/products/{$shake->id}/status", ['is_available' => false])->assertOk();

        $menu = collect($this->getJson('/api/products')->assertOk()->json('data'));

        $this->assertFalse($menu->contains('id', $cola->id));
        $this->assertFalse($menu->firstWhere('id', $shake->id)['is_available']);
    }

    public function test_product_image_upload(): void
    {
        Storage::fake('public');
        $burger = Product::where('sku', 'BRG-CLASSIC')->first();

        $path = $this->actingAs($this->manager)
            ->post("/api/manager/products/{$burger->id}/image", [
                // A real 1x1 PNG, so the test does not depend on the GD extension.
                'image' => UploadedFile::fake()->createWithContent(
                    'burger.png',
                    base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='),
                ),
            ], ['Accept' => 'application/json'])
            ->assertOk()
            ->json('data.image');

        Storage::disk('public')->assertExists($path);
    }

    public function test_ordered_products_cannot_be_deleted_and_categories_with_products_are_protected(): void
    {
        $burger = Product::where('sku', 'BRG-CLASSIC')->first();
        $this->orderItem($burger);

        $this->actingAs($this->manager)->deleteJson("/api/manager/products/{$burger->id}")->assertConflict();
        $this->actingAs($this->manager)->deleteJson("/api/manager/categories/{$burger->category_id}")->assertUnprocessable();

        $empty = $this->actingAs($this->manager)->postJson('/api/manager/categories', ['name' => 'Desserts'])
            ->assertCreated()->json('data.id');
        $this->actingAs($this->manager)->deleteJson("/api/manager/categories/{$empty}")->assertNoContent();
    }

    public function test_manager_can_save_an_add_on_group(): void
    {
        $this->actingAs($this->manager)->postJson('/api/manager/modifier-groups', [
            'name' => 'Size up',
            'min_selection' => 2,
            'max_selection' => 1,
        ])->assertUnprocessable()->assertJsonValidationErrors('max_selection');

        $this->actingAs($this->manager)->postJson('/api/manager/modifier-groups', [
            'name' => 'Sauces',
            'min_selection' => 0,
            'max_selection' => 2,
            'modifiers' => [['name' => 'Ranch', 'price' => 0.5]],
        ])->assertCreated()->assertJsonPath('data.modifiers.0.name', 'Ranch');
    }

    public function test_sales_report(): void
    {
        $burger = Product::where('sku', 'BRG-CLASSIC')->first();
        $this->orderItem($burger, null, 2);
        $this->orderItem($burger, null, 1, 'cancelled');

        $this->actingAs($this->manager)->getJson('/api/manager/reports/sales')
            ->assertOk()
            ->assertJsonPath('data.summary.orders', 1)
            ->assertJsonPath('data.summary.cancelled', 1)
            ->assertJsonPath('data.top_products.0.name', 'Classic Burger')
            ->assertJsonPath('data.top_products.0.sold', 2)
            ->assertJsonPath('data.by_category.0.name', 'Burgers')
            ->assertJsonCount(7, 'data.daily')
            ->assertJsonCount(24, 'data.hourly');
    }

    private function orderItem (Product $product, ?int $variantId = null, int $quantity = 1, string $status = 'completed'): void
    {
        $total = $product->price * $quantity;

        $orderId = DB::table('orders')->insertGetId([
            'restaurant_id' => $product->restaurant_id,
            'order_number' => 'T-'.uniqid(),
            'order_status' => $status,
            'subtotal' => $total,
            'tax' => 0,
            'total_amount' => $total,
            'customer_name' => 'Test',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('order_items')->insert([
            'order_id' => $orderId,
            'product_id' => $product->id,
            'variant_id' => $variantId,
            'product_name' => $product->name,
            'quantity' => $quantity,
            'price' => $product->price,
            'total_price' => $total,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}

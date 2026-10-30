<?php

namespace Tests\Feature;

use App\Models\KitchenOrder;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\MenuSeeder;
use Database\Seeders\RestaurantSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KioskOrderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([RoleSeeder::class, RestaurantSeeder::class, MenuSeeder::class]);
    }

    private function product(string $sku): Product
    {
        return Product::where('sku', $sku)->with('variants')->firstOrFail();
    }

    private function placeBurgerOrder(): int
    {
        return $this->postJson('/api/orders', [
            'order_type' => 'take-out',
            'items' => [['product_id' => $this->product('BRG-CLASSIC')->id, 'quantity' => 1]],
        ])->assertCreated()->json('data.id');
    }

    public function test_kiosk_order_is_priced_by_the_server_and_sent_to_the_kitchen(): void
    {
        $burger = $this->product('BRG-CLASSIC');
        $cola = $this->product('DRK-COLA');
        $large = $cola->variants->firstWhere('name', 'Large');

        $response = $this->postJson('/api/orders', [
            'order_type' => 'dine-in',
            // Client-side money is ignored entirely.
            'subtotal' => 0.01,
            'total_amount' => 0.01,
            'items' => [
                ['product_id' => $burger->id, 'quantity' => 2, 'price' => 0.01],
                ['product_id' => $cola->id, 'variant_id' => $large->id, 'quantity' => 1],
            ],
        ]);

        // 2 × 6.49 + 2.99 = 15.97; tax 8.63% = 1.38
        $response->assertCreated()
            ->assertJsonPath('data.subtotal', '15.97')
            ->assertJsonPath('data.tax', '1.38')
            ->assertJsonPath('data.total_amount', '17.35')
            ->assertJsonPath('data.order_status', 'pending')
            ->assertJsonPath('data.items.1.product_name', 'Cola (Large)');

        $orderId = $response->json('data.id');
        $this->assertSame(str_pad((string) $orderId, 3, '0', STR_PAD_LEFT), $response->json('data.order_number'));
        $this->assertDatabaseHas('kitchen_orders', ['order_id' => $orderId, 'status' => 'pending']);
    }

    public function test_orders_with_unavailable_items_are_rejected(): void
    {
        $this->postJson('/api/orders', ['order_type' => 'dine-in', 'items' => []])
            ->assertUnprocessable()->assertJsonValidationErrors('items');

        // Fries need a size.
        $this->postJson('/api/orders', [
            'order_type' => 'dine-in',
            'items' => [['product_id' => $this->product('FRY-REGULAR')->id, 'quantity' => 1]],
        ])->assertUnprocessable()->assertJsonValidationErrors('items.0');

        $shake = $this->product('DRK-SHAKE');
        $shake->update(['is_available' => false]);
        $this->postJson('/api/orders', [
            'order_type' => 'dine-in',
            'items' => [['product_id' => $shake->id, 'variant_id' => $shake->variants->first()->id, 'quantity' => 1]],
        ])->assertUnprocessable()->assertJsonValidationErrors('items.0');

        // Another product's size cannot be borrowed.
        $this->postJson('/api/orders', [
            'order_type' => 'dine-in',
            'items' => [[
                'product_id' => $this->product('DRK-COLA')->id,
                'variant_id' => $this->product('FRY-REGULAR')->variants->first()->id,
                'quantity' => 1,
            ]],
        ])->assertUnprocessable()->assertJsonValidationErrors('items.0');

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_only_kitchen_roles_can_see_the_kitchen_display(): void
    {
        $this->getJson('/api/kitchen')->assertUnauthorized();

        $cashier = User::factory()->create();
        $cashier->assignRole('cashier');
        $this->actingAs($cashier)->getJson('/api/kitchen')->assertForbidden();
    }

    public function test_kitchen_staff_can_move_a_ticket_through_the_pass(): void
    {
        $orderId = $this->placeBurgerOrder();
        $cook = User::factory()->create();
        $cook->assignRole('kitchen staff');
        $this->actingAs($cook);

        $ticket = $this->getJson('/api/kitchen')
            ->assertOk()
            ->assertJsonPath('data.0.order.items.0.product_name', 'Classic Burger')
            ->json('data.0');

        $this->patchJson("/api/kitchen/{$ticket['id']}/status", ['status' => 'preparing'])->assertOk();
        $this->assertNotNull(KitchenOrder::find($ticket['id'])->started_at);
        $this->assertDatabaseHas('orders', ['id' => $orderId, 'order_status' => 'preparing']);

        $this->patchJson("/api/kitchen/{$ticket['id']}/status", ['status' => 'completed'])->assertOk();
        $this->assertNotNull(KitchenOrder::find($ticket['id'])->completed_at);
        $this->assertDatabaseHas('orders', ['id' => $orderId, 'order_status' => 'completed']);

        // Finished today, so it stays on the board for the "Served today" count.
        $this->getJson('/api/kitchen')->assertJsonPath('data.0.status', 'completed');

        $this->patchJson("/api/kitchen/{$ticket['id']}/status", ['status' => 'burnt'])->assertUnprocessable();
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\Tax;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Orders placed from the customer kiosk.
 *
 * The kiosk has no login, so nothing it sends about money is trusted: every
 * price, the tax and the total are recomputed from the menu here. The order
 * lands on the kitchen display as a pending ticket in the same transaction.
 */
class OrderController extends Controller
{
    public function store (Request $request): JsonResponse
    {
        $data = $request->validate([
            'order_type' => 'required|in:dine-in,take-out',
            'customer_name' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:500',
            'items' => 'required|array|min:1|max:50',
            'items.*.product_id' => 'required|integer',
            'items.*.variant_id' => 'nullable|integer',
            // Matches MAX_QUANTITY in the kiosk's useOrder store.
            'items.*.quantity' => 'required|integer|min:1|max:20',
        ]);

        $restaurantId = $this->restaurantId();
        $lines = $this->priceLines($data['items'], $restaurantId);

        $subtotal = round(array_sum(array_column($lines, 'total_price')), 2);
        // Every active tax applies to a kiosk order; rates are stored as percents.
        $taxRate = Tax::where('restaurant_id', $restaurantId)->where('is_active', true)->sum('rate') / 100;
        $tax = round($subtotal * $taxRate, 2);

        $order = DB::transaction(function () use ($data, $restaurantId, $lines, $subtotal, $tax) {
            $order = Order::create([
                'restaurant_id' => $restaurantId,
                // Unique placeholder until the id is known; replaced just below.
                'order_number' => 'pending-'.uniqid(),
                'order_type' => $data['order_type'],
                'order_status' => 'pending',
                'subtotal' => $subtotal,
                'tax' => $tax,
                'total_amount' => round($subtotal + $tax, 2),
                'customer_name' => $data['customer_name'] ?? 'Kiosk customer',
                'notes' => $data['notes'] ?? null,
            ]);

            // Short enough to call out at the counter, unique because the id is.
            $order->update(['order_number' => str_pad((string) $order->id, 3, '0', STR_PAD_LEFT)]);
            $order->items()->createMany($lines);
            $order->kitchenOrder()->create(['status' => 'pending', 'priority' => 'medium']);

            return $order;
        });

        return response()->json(['data' => $order->load('items')], 201);
    }

    /**
     * Resolves each requested line against the live menu.
     *
     * @param  array<int, array{product_id: int, variant_id?: int|null, quantity: int}>  $items
     * @return array<int, array<string, mixed>>
     */
    private function priceLines (array $items, int $restaurantId): array
    {
        $products = Product::query()
            ->where('restaurant_id', $restaurantId)
            ->whereIn('id', array_column($items, 'product_id'))
            ->with(['category:id,is_active,requires_size', 'variants'])
            ->get()
            ->keyBy('id');

        $errors = [];
        $lines = [];

        foreach ($items as $index => $item) {
            $key = "items.$index";
            $product = $products->get($item['product_id']);

            if (! $product || ! $product->is_active || ! $product->category?->is_active) {
                $errors[$key] = 'This item is no longer on the menu.';
                continue;
            }
            if (! $product->is_available) {
                $errors[$key] = "Sorry, {$product->name} is sold out.";
                continue;
            }

            $variant = null;
            if (! empty($item['variant_id'])) {
                $variant = $product->variants->firstWhere('id', $item['variant_id']);
                if (! $variant || ! $variant->is_available) {
                    $errors[$key] = "That size of {$product->name} is not available.";
                    continue;
                }
            } elseif ($product->category->requires_size && ! $product->is_combo) {
                $errors[$key] = "Please choose a size for {$product->name}.";
                continue;
            }

            $price = (float) ($variant?->price ?? $product->price);

            $lines[] = [
                'product_id' => $product->id,
                'variant_id' => $variant?->id,
                'product_name' => $variant ? "{$product->name} ({$variant->name})" : $product->name,
                'quantity' => $item['quantity'],
                'price' => $price,
                'total_price' => round($price * $item['quantity'], 2),
            ];
        }

        if ($errors) {
            throw ValidationException::withMessages($errors);
        }

        return $lines;
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\KitchenOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Tickets for the kitchen display, and moving them along the pass. */
class KitchenController extends Controller
{
    public function index (): JsonResponse
    {
        $tickets = KitchenOrder::query()
            ->whereHas('order', fn ($query) => $query->where('restaurant_id', $this->restaurantId()))
            // Everything still in the kitchen, plus today's finished tickets for the "Served today" count.
            ->where(fn ($query) => $query
                ->where('status', '!=', 'completed')
                ->orWhere('completed_at', '>=', now()->startOfDay()))
            ->with('order.items')
            ->oldest()
            ->get();

        return response()->json(['data' => $tickets]);
    }

    public function updateStatus (Request $request, KitchenOrder $kitchenOrder): JsonResponse
    {
        $status = $request->validate([
            'status' => ['required', Rule::in(['pending', 'preparing', 'ready', 'completed'])],
        ])['status'];

        $kitchenOrder->status = $status;
        if ($status === 'preparing' && ! $kitchenOrder->started_at) {
            $kitchenOrder->started_at = now();
        }
        if ($status === 'completed') {
            $kitchenOrder->completed_at = now();
        }
        $kitchenOrder->save();

        // The order statuses use the same words, so the order simply follows its ticket.
        $kitchenOrder->order()->update(['order_status' => $status]);

        return response()->json(['data' => $kitchenOrder->load('order.items')]);
    }
}

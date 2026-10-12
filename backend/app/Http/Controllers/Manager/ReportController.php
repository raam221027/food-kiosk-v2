<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Carbon\CarbonImmutable;
use Carbon\CarbonPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Sales and operational report for a date range.
 *
 * "Sales" means every order that was not cancelled — kiosk orders are paid up
 * front, so a pending or preparing order is already revenue.
 *
 * Orders are grouped in PHP rather than with date functions in SQL so the
 * report works the same on MySQL and on SQLite in tests.
 */
class ReportController extends Controller
{
    public function sales (Request $request): JsonResponse
    {
        $request->validate([
            'from' => 'nullable|date',
            'to' => 'nullable|date|after_or_equal:from',
        ]);

        $to = CarbonImmutable::parse($request->input('to', 'today'))->endOfDay();
        $from = CarbonImmutable::parse($request->input('from', $to->subDays(6)))->startOfDay();
        $restaurantId = $this->restaurantId();

        $orders = DB::table('orders')
            ->where('restaurant_id', $restaurantId)
            ->whereBetween('created_at', [$from, $to])
            ->get(['id', 'order_type', 'order_status', 'subtotal', 'tax', 'discount', 'total_amount', 'created_at']);

        $sales = $orders->where('order_status', '!=', 'cancelled');
        $revenue = (float) $sales->sum('total_amount');

        return response()->json(['data' => [
            'range' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'summary' => [
                'revenue' => round($revenue, 2),
                'net_sales' => round((float) $sales->sum('subtotal') - (float) $sales->sum('discount'), 2),
                'tax' => round((float) $sales->sum('tax'), 2),
                'discounts' => round((float) $sales->sum('discount'), 2),
                'orders' => $sales->count(),
                'average_ticket' => $sales->isEmpty() ? 0 : round($revenue / $sales->count(), 2),
                'cancelled' => $orders->count() - $sales->count(),
                'cancel_rate' => $orders->isEmpty() ? 0 : round(($orders->count() - $sales->count()) / $orders->count() * 100, 1),
            ],
            'daily' => $this->daily($sales, $from, $to),
            'hourly' => $this->hourly($sales),
            'by_order_type' => $sales->groupBy('order_type')
                ->map(fn ($group, $type) => [
                    'order_type' => $type,
                    'orders' => $group->count(),
                    'revenue' => round((float) $group->sum('total_amount'), 2),
                ])->values(),
            'by_status' => $orders->countBy('order_status'),
            'top_products' => $this->topProducts($restaurantId, $from, $to),
            'by_category' => $this->byCategory($restaurantId, $from, $to),
            'payment_methods' => $this->paymentMethods($restaurantId, $from, $to),
            'kitchen' => $this->kitchen($restaurantId, $from, $to),
            'menu' => [
                'total' => Product::where('restaurant_id', $restaurantId)->count(),
                'hidden' => Product::where('restaurant_id', $restaurantId)->where('is_active', false)->count(),
                'sold_out' => Product::where('restaurant_id', $restaurantId)->where('is_active', true)->where('is_available', false)->count(),
            ],
        ]]);
    }

    /**
     * One row per day in the range, including days with no orders.
     *
     * @return array<int, array<string, mixed>>
     */
    private function daily ($sales, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $byDay = $sales->groupBy(fn ($order) => substr((string) $order->created_at, 0, 10));

        return collect(CarbonPeriod::create($from, $to->startOfDay()))
            ->map(function ($day) use ($byDay) {
                $group = $byDay->get($day->toDateString(), collect());

                return [
                    'date' => $day->toDateString(),
                    'orders' => $group->count(),
                    'revenue' => round((float) $group->sum('total_amount'), 2),
                ];
            })->all();
    }

    /**
     * Orders per hour of the day (0-23), for spotting the rush.
     *
     * @return array<int, array<string, int>>
     */
    private function hourly ($sales): array
    {
        $byHour = $sales->countBy(fn ($order) => (int) substr((string) $order->created_at, 11, 2));

        return collect(range(0, 23))
            ->map(fn ($hour) => ['hour' => $hour, 'orders' => $byHour->get($hour, 0)])
            ->all();
    }

    private function salesItems (int $restaurantId, CarbonImmutable $from, CarbonImmutable $to)
    {
        return DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.restaurant_id', $restaurantId)
            ->where('orders.order_status', '!=', 'cancelled')
            ->whereBetween('orders.created_at', [$from, $to]);
    }

    private function topProducts (int $restaurantId, CarbonImmutable $from, CarbonImmutable $to)
    {
        return $this->salesItems($restaurantId, $from, $to)
            ->groupBy('order_items.product_id', 'order_items.product_name')
            ->selectRaw('order_items.product_id, order_items.product_name as name, SUM(order_items.quantity) as sold, SUM(order_items.total_price) as revenue')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'product_id' => $row->product_id,
                'name' => $row->name,
                'sold' => (int) $row->sold,
                'revenue' => round((float) $row->revenue, 2),
            ]);
    }

    private function byCategory (int $restaurantId, CarbonImmutable $from, CarbonImmutable $to)
    {
        return $this->salesItems($restaurantId, $from, $to)
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->groupBy('categories.id', 'categories.name')
            ->selectRaw('categories.id as category_id, categories.name, SUM(order_items.quantity) as sold, SUM(order_items.total_price) as revenue')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($row) => [
                'category_id' => $row->category_id,
                'name' => $row->name,
                'sold' => (int) $row->sold,
                'revenue' => round((float) $row->revenue, 2),
            ]);
    }

    private function paymentMethods (int $restaurantId, CarbonImmutable $from, CarbonImmutable $to)
    {
        return DB::table('payments')
            ->join('orders', 'orders.id', '=', 'payments.order_id')
            ->join('payment_methods', 'payment_methods.id', '=', 'payments.payment_method_id')
            ->where('orders.restaurant_id', $restaurantId)
            ->where('payments.status', 'completed')
            ->whereBetween('orders.created_at', [$from, $to])
            ->groupBy('payment_methods.id', 'payment_methods.name', 'payment_methods.type')
            ->selectRaw('payment_methods.name, payment_methods.type, COUNT(*) as payments, SUM(payments.amount) as amount')
            ->orderByDesc('amount')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->name,
                'type' => $row->type,
                'payments' => (int) $row->payments,
                'amount' => round((float) $row->amount, 2),
            ]);
    }

    /**
     * Kitchen throughput: average and slowest prep time for finished tickets.
     *
     * @return array<string, mixed>
     */
    private function kitchen (int $restaurantId, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $minutes = DB::table('kitchen_orders')
            ->join('orders', 'orders.id', '=', 'kitchen_orders.order_id')
            ->where('orders.restaurant_id', $restaurantId)
            ->whereBetween('orders.created_at', [$from, $to])
            ->whereNotNull('kitchen_orders.started_at')
            ->whereNotNull('kitchen_orders.completed_at')
            ->get(['kitchen_orders.started_at', 'kitchen_orders.completed_at'])
            ->map(fn ($row) => CarbonImmutable::parse($row->started_at)->diffInSeconds(CarbonImmutable::parse($row->completed_at)) / 60);

        return [
            'tickets' => $minutes->count(),
            'average_prep_minutes' => $minutes->isEmpty() ? null : round($minutes->avg(), 1),
            'longest_prep_minutes' => $minutes->isEmpty() ? null : round($minutes->max(), 1),
        ];
    }
}

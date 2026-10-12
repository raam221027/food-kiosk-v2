<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\Restaurant;
use App\Models\Tax;
use Illuminate\Http\JsonResponse;

/**
 * Public, read-only menu for the customer kiosk.
 *
 * Only what a customer may see: active categories and products the manager
 * has not hidden. Sold-out products are still listed (`is_available: false`)
 * so the kiosk can show them greyed out.
 */
class MenuController extends Controller
{
    public function restaurants (): JsonResponse
    {
        return response()->json(['data' => Restaurant::where('status', true)->orderBy('id')->get()]);
    }

    public function categories (): JsonResponse
    {
        $categories = Category::query()
            ->where('restaurant_id', $this->restaurantId())
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $categories]);
    }

    public function products (): JsonResponse
    {
        $products = Product::query()
            ->where('restaurant_id', $this->restaurantId())
            ->where('is_active', true)
            ->whereHas('category', fn ($query) => $query->where('is_active', true))
            ->with([
                'category:id,name,requires_size',
                'variants' => fn ($query) => $query->where('is_available', true),
                'modifierGroups.modifiers' => fn ($query) => $query->where('is_available', true),
                'comboItems.product:id,name',
            ])
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $products]);
    }

    public function taxes (): JsonResponse
    {
        return response()->json([
            'data' => Tax::where('restaurant_id', $this->restaurantId())->where('is_active', true)->get(),
        ]);
    }
}

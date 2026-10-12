<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Manager CRUD for menu categories (Burgers, Fries, Drinks, ...).
 */
class CategoryController extends Controller
{
    public function index (): JsonResponse
    {
        $categories = Category::query()
            ->where('restaurant_id', $this->restaurantId())
            ->withCount('products')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $categories]);
    }

    public function store (Request $request): JsonResponse
    {
        $category = Category::create([
            ...$this->validated($request),
            'restaurant_id' => $this->restaurantId(),
        ]);

        return response()->json(['data' => $category->loadCount('products')], 201);
    }

    public function update (Request $request, Category $category): JsonResponse
    {
        $category->update($this->validated($request));

        return response()->json(['data' => $category->loadCount('products')]);
    }

    public function destroy (Category $category): JsonResponse
    {
        // Deleting a category cascades to its products, so refuse rather than
        // silently wiping part of the menu.
        if ($category->products()->exists()) {
            return response()->json([
                'message' => 'Move or delete the products in this category first.',
            ], 422);
        }

        if ($category->image) {
            Storage::disk('public')->delete($category->image);
        }

        $category->delete();

        return response()->json(null, 204);
    }

    /**
     * Replace the category image. Sent separately from the JSON form because
     * PHP only parses multipart bodies on POST.
     */
    public function uploadImage (Request $request, Category $category): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        $old = $category->image;
        $category->update(['image' => $request->file('image')->store('categories', 'public')]);

        if ($old) {
            Storage::disk('public')->delete($old);
        }

        return response()->json(['data' => $category->loadCount('products')]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated (Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
            'requires_size' => 'boolean',
        ]) + ['sort_order' => 0];
    }
}

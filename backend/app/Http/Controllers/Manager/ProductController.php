<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Manager CRUD for menu items, including combo meals, sizes and add-ons.
 *
 * Sizes, add-on groups and combo components travel with the product in one
 * JSON payload so the form saves in a single request; the image goes through
 * its own multipart endpoint.
 */
class ProductController extends Controller
{
    /** Relations returned with every product so the edit form can prefill. */
    private const WITH = [
        'category:id,name,requires_size',
        'variants',
        'modifierGroups:id,name',
        'comboItems.product:id,name,price',
    ];

    public function index (Request $request): JsonResponse
    {
        $products = Product::query()
            ->where('restaurant_id', $this->restaurantId())
            ->with(self::WITH)
            ->when($request->filled('category_id'), fn ($query) => $query->where('category_id', $request->integer('category_id')))
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $products]);
    }

    public function show (Product $product): JsonResponse
    {
        return response()->json(['data' => $product->load(self::WITH)]);
    }

    public function store (Request $request): JsonResponse
    {
        $data = $this->validated($request);

        $product = DB::transaction(function () use ($data) {
            $product = Product::create([
                ...$this->productAttributes($data),
                'restaurant_id' => $this->restaurantId(),
                'sku' => $data['sku'] ?? $this->generateSku(),
            ]);
            $this->syncRelations($product, $data);

            return $product;
        });

        return response()->json(['data' => $product->load(self::WITH)], 201);
    }

    public function update (Request $request, Product $product): JsonResponse
    {
        $data = $this->validated($request, $product);

        DB::transaction(function () use ($product, $data) {
            $product->update([
                ...$this->productAttributes($data),
                'sku' => $data['sku'] ?? $product->sku,
            ]);
            $this->syncRelations($product, $data);
        });

        return response()->json(['data' => $product->load(self::WITH)]);
    }

    public function destroy (Product $product): JsonResponse
    {
        // Order history references products and must stay intact for reports.
        if (DB::table('order_items')->where('product_id', $product->id)->exists()) {
            return response()->json([
                'message' => 'This product has been ordered before, so it cannot be deleted. Hide it from the kiosk instead.',
            ], 409);
        }

        if ($product->image) {
            Storage::disk('public')->delete($product->image);
        }

        $product->delete();

        return response()->json(null, 204);
    }

    /**
     * Quick toggles used from the product list: show/hide on the kiosk and
     * mark sold out / back in stock.
     */
    public function updateStatus (Request $request, Product $product): JsonResponse
    {
        $product->update($request->validate([
            'is_active' => 'sometimes|boolean',
            'is_available' => 'sometimes|boolean',
        ]));

        return response()->json(['data' => $product->load(self::WITH)]);
    }

    /**
     * Replace the product image. Sent separately from the JSON form because
     * PHP only parses multipart bodies on POST.
     */
    public function uploadImage (Request $request, Product $product): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        $old = $product->image;
        $product->update(['image' => $request->file('image')->store('products', 'public')]);

        if ($old) {
            Storage::disk('public')->delete($old);
        }

        return response()->json(['data' => $product->load(self::WITH)]);
    }

    public function destroyImage (Product $product): JsonResponse
    {
        if ($product->image) {
            Storage::disk('public')->delete($product->image);
            $product->update(['image' => null]);
        }

        return response()->json(['data' => $product->load(self::WITH)]);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function productAttributes (array $data): array
    {
        return collect($data)->only([
            'category_id', 'name', 'description', 'price', 'is_available', 'is_active', 'is_combo',
        ])->all();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function syncRelations (Product $product, array $data): void
    {
        $this->syncVariants($product, $data['variants'] ?? []);

        $product->modifierGroups()->sync($data['modifier_group_ids'] ?? []);

        $product->comboItems()->delete();
        if ($data['is_combo'] ?? false) {
            $product->comboItems()->createMany($data['combo_items'] ?? []);
        }
    }

    /**
     * Sizes with an id are updated, new ones created. Sizes dropped from the
     * form are deleted, unless an order already used them, in which case they
     * are only marked unavailable so order history keeps its reference.
     *
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function syncVariants (Product $product, array $rows): void
    {
        $keep = [];

        foreach ($rows as $row) {
            $attributes = [
                'name' => $row['name'],
                'price' => $row['price'],
                'is_available' => $row['is_available'] ?? true,
            ];

            $variant = isset($row['id'])
                ? tap($product->variants()->findOrFail($row['id']))->update($attributes)
                : $product->variants()->create($attributes);

            $keep[] = $variant->id;
        }

        $removed = $product->variants()->whereNotIn('id', $keep)->pluck('id');
        $ordered = DB::table('order_items')->whereIn('variant_id', $removed)->distinct()->pluck('variant_id');

        $product->variants()->whereIn('id', $ordered)->update(['is_available' => false]);
        $product->variants()->whereIn('id', $removed->diff($ordered))->delete();
    }

    private function generateSku (): string
    {
        do {
            $sku = 'SKU-'.Str::upper(Str::random(8));
        } while (Product::where('sku', $sku)->exists());

        return $sku;
    }

    /**
     * @return array<string, mixed>
     */
    private function validated (Request $request, ?Product $product = null): array
    {
        $restaurantId = $this->restaurantId();

        $data = $request->validate([
            'category_id' => ['required', 'integer', Rule::exists('categories', 'id')->where('restaurant_id', $restaurantId)],
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'price' => 'required|numeric|min:0|max:99999999',
            'sku' => ['nullable', 'string', 'max:64', Rule::unique('products', 'sku')->ignore($product?->id)],
            'is_available' => 'boolean',
            'is_active' => 'boolean',
            'is_combo' => 'boolean',

            'variants' => 'array',
            'variants.*.id' => 'nullable|integer',
            'variants.*.name' => 'required|string|max:255',
            'variants.*.price' => 'required|numeric|min:0',
            'variants.*.is_available' => 'boolean',

            'modifier_group_ids' => 'array',
            'modifier_group_ids.*' => ['integer', 'distinct', Rule::exists('modifier_groups', 'id')->where('restaurant_id', $restaurantId)],

            'combo_items' => 'array',
            'combo_items.*.product_id' => ['required', 'integer', 'distinct', Rule::exists('products', 'id')->where('restaurant_id', $restaurantId)->where('is_combo', 0)],
            'combo_items.*.quantity' => 'required|integer|min:1|max:20',
        ], [
            'combo_items.*.product_id.exists' => 'Combo items must be regular products, not other combos.',
        ]);

        if ($data['is_combo'] ?? false) {
            $items = collect($data['combo_items'] ?? []);

            if ($items->isEmpty()) {
                throw ValidationException::withMessages(['combo_items' => 'A combo needs at least one item.']);
            }
            if ($product && $items->contains('product_id', $product->id)) {
                throw ValidationException::withMessages(['combo_items' => 'A combo cannot contain itself.']);
            }
            // A product that other combos use cannot turn into a combo itself.
            if ($product && DB::table('combo_items')->where('product_id', $product->id)->exists()) {
                throw ValidationException::withMessages(['is_combo' => 'This product is part of another combo, so it cannot become a combo.']);
            }
        }

        $category = Category::find($data['category_id']);
        if ($category->requires_size && ! ($data['is_combo'] ?? false)) {
            $data = $this->withRequiredSizes($data, $category);
        }

        return $data;
    }

    /**
     * Products in a category such as Fries or Drinks must offer exactly
     * Small, Medium and Large. Names are normalised to that spelling and the
     * product price becomes the Small price, which the kiosk shows as "from".
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function withRequiredSizes (array $data, Category $category): array
    {
        $required = collect(Category::SIZES)->keyBy(fn ($name) => strtolower($name));
        $variants = collect($data['variants'] ?? []);
        $names = $variants->map(fn ($row) => strtolower(trim($row['name'])));

        if ($names->count() !== $required->count() || $names->diff($required->keys())->isNotEmpty() || $names->unique()->count() !== $names->count()) {
            throw ValidationException::withMessages([
                'variants' => "Products in {$category->name} need exactly these sizes: ".implode(', ', Category::SIZES).'.',
            ]);
        }

        $data['variants'] = $variants
            ->map(fn ($row) => ['name' => $required[strtolower(trim($row['name']))]] + $row)
            ->sortBy(fn ($row) => array_search($row['name'], Category::SIZES, true))
            ->values()
            ->all();
        $data['price'] = $data['variants'][0]['price'];

        return $data;
    }
}

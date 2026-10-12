<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\ModifierGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Manager CRUD for add-on groups ("Extra toppings", "Sauces") and the add-ons
 * inside them. Add-ons are saved together with their group.
 */
class ModifierGroupController extends Controller
{
    public function index (): JsonResponse
    {
        $groups = ModifierGroup::query()
            ->where('restaurant_id', $this->restaurantId())
            ->with('modifiers')
            ->withCount('products')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $groups]);
    }

    public function store (Request $request): JsonResponse
    {
        $data = $this->validated($request);

        $group = DB::transaction(function () use ($data) {
            $group = ModifierGroup::create([
                ...collect($data)->except('modifiers')->all(),
                'restaurant_id' => $this->restaurantId(),
            ]);
            $this->syncModifiers($group, $data['modifiers'] ?? []);

            return $group;
        });

        return response()->json(['data' => $group->load('modifiers')->loadCount('products')], 201);
    }

    public function update (Request $request, ModifierGroup $modifierGroup): JsonResponse
    {
        $data = $this->validated($request);

        DB::transaction(function () use ($modifierGroup, $data) {
            $modifierGroup->update(collect($data)->except('modifiers')->all());
            $this->syncModifiers($modifierGroup, $data['modifiers'] ?? []);
        });

        return response()->json(['data' => $modifierGroup->load('modifiers')->loadCount('products')]);
    }

    public function destroy (ModifierGroup $modifierGroup): JsonResponse
    {
        $modifierGroup->delete();

        return response()->json(null, 204);
    }

    /**
     * Rows with an id are updated, rows without are created, and add-ons
     * missing from the payload are removed.
     *
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function syncModifiers (ModifierGroup $group, array $rows): void
    {
        $keep = [];

        foreach ($rows as $row) {
            $attributes = [
                'name' => $row['name'],
                'price' => $row['price'],
                'is_available' => $row['is_available'] ?? true,
            ];

            $modifier = isset($row['id'])
                ? tap($group->modifiers()->findOrFail($row['id']))->update($attributes)
                : $group->modifiers()->create($attributes);

            $keep[] = $modifier->id;
        }

        $group->modifiers()->whereNotIn('id', $keep)->delete();
    }

    /**
     * @return array<string, mixed>
     */
    private function validated (Request $request): array
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'min_selection' => 'required|integer|min:0',
            'max_selection' => 'required|integer|min:0',
            'is_required' => 'boolean',
            'modifiers' => 'array',
            'modifiers.*.id' => 'nullable|integer',
            'modifiers.*.name' => 'required|string|max:255',
            'modifiers.*.price' => 'required|numeric|min:0',
            'modifiers.*.is_available' => 'boolean',
        ]);

        // 0 means "no limit"; otherwise the maximum cannot be below the minimum.
        if ($data['max_selection'] > 0 && $data['max_selection'] < $data['min_selection']) {
            throw ValidationException::withMessages([
                'max_selection' => 'Maximum selection cannot be lower than the minimum.',
            ]);
        }

        return $data;
    }
}

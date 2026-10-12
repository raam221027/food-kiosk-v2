<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;

abstract class Controller
{
    /**
     * The restaurant the current request acts on.
     *
     * The app runs one restaurant per install (the kiosk makes the same
     * assumption), so this is simply the first one. Swap this out if users are
     * ever tied to a specific restaurant.
     */
    protected function restaurantId(): int
    {
        $id = Restaurant::query()->orderBy('id')->value('id');

        abort_if($id === null, 409, 'No restaurant is set up yet. Run `php artisan db:seed --class=RestaurantSeeder`.');

        return $id;
    }
}

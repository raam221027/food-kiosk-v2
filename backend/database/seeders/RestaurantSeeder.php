<?php

namespace Database\Seeders;

use App\Models\Restaurant;
use App\Models\Tax;
use Illuminate\Database\Seeder;

/**
 * The single restaurant this install serves, plus its sales tax. Menu
 * management and the kiosk both need it to exist.
 */
class RestaurantSeeder extends Seeder
{
    public function run(): void
    {
        $restaurant = Restaurant::firstOrCreate(
            ['email' => 'hello@kiosk-kitchen.test'],
            [
                'name' => 'Kiosk Kitchen',
                'address' => '221 Market Street',
                'city' => 'San Francisco',
                'state' => 'CA',
                'zip_code' => '94105',
                'phone_number' => '+1 (415) 555-0142',
                'tax_id' => 'US-84-1927364',
                'timezone' => 'America/Los_Angeles',
                'currency' => 'USD',
            ]
        );

        Tax::firstOrCreate(
            ['restaurant_id' => $restaurant->id, 'name' => 'Sales tax'],
            ['rate' => 8.63, 'is_active' => true]
        );
    }
}

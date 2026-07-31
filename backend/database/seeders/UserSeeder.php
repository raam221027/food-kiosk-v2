<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@test.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('password'),
            ]
        );

        $admin->syncRoles('admin');

        
        $manager = User::firstOrCreate(
            ['email' => 'manager@test.com'],
            [
                'name' => 'Manager',
                'password' => Hash::make('password'),
            ]
        );

        $manager->syncRoles('manager');


        $cashier = User::firstOrCreate(
            ['email' => 'cashier@test.com'],
            [
                'name' => 'Cashier',
                'password' => Hash::make('password'),
            ]
        );

        $cashier->syncRoles('cashier');


        $kitchen = User::firstOrCreate(
            ['email' => 'kitchen@test.com'],
            [
                'name' => 'Kitchen Staff',
                'password' => Hash::make('password'),
            ]
        );

        $kitchen->syncRoles('kitchen staff');
    }
}
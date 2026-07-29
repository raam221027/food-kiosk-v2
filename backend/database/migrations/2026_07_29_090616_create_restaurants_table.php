<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('restaurants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('address');
            $table->string('city');
            $table->string('state');
            $table->string('zip_code');
            $table->string('phone_number');
            $table->string('email')->unique();
            $table->string('tax_id')->unique();
            $table->string('logo')->nullable();
            $table->string('website')->nullable();
            $table->string('timzone')->default('UTC');
            $table->string('currency')->default('USD');
            $table->string('language')->default('en');
            $table->boolean('status')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('restaurants');
    }
};

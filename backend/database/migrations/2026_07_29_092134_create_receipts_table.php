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
        Schema::create('receipts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->restrictOnDelete();
            $table->string('receipt_number')->unique();
            
            // Delivery Destinations (Nullable because a user might only choose one method)
            $table->string('email_address')->nullable();
            $table->string('phone_number', 15)->nullable(); 
            
            // Delivery Status Trackers
            $table->boolean('email_sent')->default(false);
            $table->boolean('text_sent')->default(false);
            $table->timestamp('printed_at')->nullable();
    
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('receipts');
    }
};

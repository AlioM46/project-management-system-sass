<?php

declare(strict_types=1);

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
        Schema::create('plans', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            
            // Pricing in cents (e.g., 1500 = $15.00, 15000 = $150.00)
            $table->unsignedInteger('price_monthly')->default(0);
            $table->unsignedInteger('price_yearly')->nullable();

            // Stripe price mapping identifiers
            $table->string('stripe_monthly_price_id')->nullable();
            $table->string('stripe_yearly_price_id')->nullable();

            // Quantity & Resource limits (NULL represents unlimited)
            $table->unsignedInteger('max_members')->nullable();
            $table->unsignedInteger('max_projects')->nullable();
            $table->unsignedInteger('max_tasks_per_project')->nullable();
            $table->unsignedInteger('max_storage_mb')->nullable();
            $table->unsignedInteger('max_file_size_mb')->nullable();
            $table->unsignedInteger('max_custom_roles')->nullable();

            // Feature gates / boolean flags
            $table->boolean('has_audit_logs')->default(false);
            $table->boolean('has_advanced_analytics')->default(false);
            $table->boolean('has_data_export')->default(false);
            $table->boolean('has_priority_support')->default(false);

            // Display & Status
            $table->boolean('is_active')->default(true);
            $table->unsignedTinyInteger('sort_order')->default(0);

            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};

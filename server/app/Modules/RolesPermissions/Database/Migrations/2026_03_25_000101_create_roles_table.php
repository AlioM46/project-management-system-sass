<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Workspace roles.
     *
     * Example rows:
     * - Owner for workspace 1
     * - Admin for workspace 1
     * - Member for workspace 1
     */
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')
                ->constrained('workspaces')
                ->cascadeOnDelete();
            $table->string('name', 150);
            $table->string('slug', 150);
            $table->text('description')->nullable();
            $table->boolean('is_system')->default(false);
            $table->boolean('is_editable')->default(true);
            $table->boolean('is_deletable')->default(true);
            $table->timestamps();

            $table->unique(['workspace_id', 'name']);
            $table->unique(['workspace_id', 'slug']);
        });
    }

    /**
     * Drop the roles table.
     */
    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};

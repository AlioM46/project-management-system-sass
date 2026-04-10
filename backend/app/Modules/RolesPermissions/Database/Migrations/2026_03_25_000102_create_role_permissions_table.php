<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pivot table between workspace roles and global permissions.
     *
     * Example row:
     * - role_id: 3
     * - permission_id: 21
     * - permission_key: "task.assign"
     */
    public function up(): void
    {
        Schema::create('role_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')
                ->constrained('roles')
                ->cascadeOnDelete();
            $table->foreignId('permission_id')
                ->nullable()
                ->constrained('permissions')
                ->nullOnDelete();
            $table->string('permission_key', 150)->nullable();
            $table->timestamps();

            $table->index('permission_key');
            $table->unique(['role_id', 'permission_id']);
            $table->unique(['role_id', 'permission_key']);
        });
    }

    /**
     * Drop the role_permissions table.
     */
    public function down(): void
    {
        Schema::dropIfExists('role_permissions');
    }
};

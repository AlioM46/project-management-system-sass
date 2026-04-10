<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Global permission definitions.
     *
     * Example rows:
     * - workspace.view
     * - task.assign
     * - report.export
     */
    public function up(): void
    {
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('key', 150)->unique();
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Drop the permissions table.
     */
    public function down(): void
    {
        Schema::dropIfExists('permissions');
    }
};

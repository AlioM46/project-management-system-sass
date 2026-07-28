<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')
                ->constrained('workspaces');
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->foreignId('created_by_user_id')
                ->constrained('users');
            $table->string('active_name_key', 150)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('workspace_id');
            $table->index(['workspace_id', 'deleted_at']);
            $table->unique(['workspace_id', 'active_name_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};

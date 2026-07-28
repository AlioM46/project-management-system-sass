<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->string('event_type', 50);
            $table->json('old_value')->nullable();
            $table->json('new_value')->nullable();
            $table->foreignId('actor_user_id')->constrained('users');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['lead_id', 'created_at']);
            $table->index(['workspace_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_history');
    }
};

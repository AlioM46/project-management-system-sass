<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')
                ->constrained('workspaces')
                ->cascadeOnDelete();
            $table->foreignId('actor_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('event_type', 100);
            $table->string('target_type', 100);
            $table->unsignedBigInteger('target_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('occurred_at')->useCurrent();

            // faster lookups for common queries


            //# 1: Indexes for filtering by workspace and time
            $table->index(['workspace_id', 'occurred_at']);
            # 2: Indexes for filtering by workspace and action
            $table->index(['workspace_id', 'event_type']);
            # 3: Indexes for filtering by workspace and target and targetId
            # e.g. -> workspace.5, target_type = 'task', target_id = 123
            $table->index(['workspace_id', 'target_type', 'target_id']);
            // 4: Indexes for filtering by workspace and actor
            $table->index(['workspace_id', 'actor_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};

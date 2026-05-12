<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')
                ->constrained('tasks')
                ->cascadeOnDelete();
            $table->string('event_type', 50);
            $table->json('old_value')->nullable();
            $table->json('new_value')->nullable();
            $table->foreignId('actor_user_id')
                ->constrained('users');
            $table->timestamp('created_at')->useCurrent();

            $table->index('task_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_history');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('conversation_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')
                ->constrained('workspaces')
                ->cascadeOnDelete();

            $table->foreignId('conversation_id')
                ->constrained('conversation')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users') // or your user table name
                ->cascadeOnDelete();

            $table->string('role', 20)->default('participant'); // owner, admin, member
            $table->boolean('is_active')->default(true);
            $table->timestamp('joined_at')->nullable();

            $table->timestamps();

            $table->unique(['conversation_id', 'user_id']); // Prevent duplicate participants
            $table->index(['conversation_id', 'role']);
            $table->index(['user_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conversation_participants');
    }
};

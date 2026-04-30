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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();

            $table->foreignId('workspace_id')->index();
            $table->foreignId('user_id')->index();

            $table->string('type'); // task_assigned, mentioned, chat_message...

            $table->json('data')->nullable();

            $table->timestamp('read_at')->nullable();

            $table->timestamps();

            $table->index(['workspace_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};

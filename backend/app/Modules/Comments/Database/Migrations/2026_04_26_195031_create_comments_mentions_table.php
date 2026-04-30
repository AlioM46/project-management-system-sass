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
        Schema::create('mentions', function (Blueprint $table) {
            $table->id();

            // 👤 Who is mentioned
            $table->foreignId('mentioned_user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // 🏢 Multi-tenant
            $table->foreignId('workspace_id')
                ->constrained()
                ->cascadeOnDelete();

            // 📌 Where mention happened
            $table->string('source_type'); // comment, message, task
            $table->unsignedBigInteger('source_id');

            // 👤 Who mentioned
            $table->foreignId('mentioned_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // 👀 Read tracking
            $table->timestamp('read_at')->nullable();

            $table->timestamps();

            // ⚡ Performance indexes
            $table->index(['mentioned_user_id']);
            $table->index(['workspace_id']);
            $table->index(['source_type', 'source_id']);

            // 🔥 Prevent duplicates
            // $table->unique([
            //     'mentioned_user_id',
            //     'source_type',
            //     'source_id'
            // ], 'unique_user_mention_per_source');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mentions');
    }
};

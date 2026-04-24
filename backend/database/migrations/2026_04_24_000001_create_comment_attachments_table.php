<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('comment_attachments', function (Blueprint $table) {
            $table->id();

            // Foreign key to comments
            $table->foreignId('comment_id')
                ->constrained('comments')
                ->cascadeOnDelete();

            // Object key for Cloudflare R2
            $table->string('object_key');

            // Metadata
            $table->string('file_type');
            $table->unsignedBigInteger('file_size');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('comment_attachments');
    }
};

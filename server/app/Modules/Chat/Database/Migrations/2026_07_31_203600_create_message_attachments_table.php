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
        Schema::create('message_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')
                ->constrained('messages')
                ->cascadeOnDelete();
            // s3 name
            $table->string('object_key');
            // disk file name (on PC)
            $table->string('original_name');
            // pdf, video, image, excel, word
            $table->string('file_type');
            // on Bytes
            $table->unsignedBigInteger('file_size');
            $table->timestamps();

            $table->index('message_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('message_attachments');
    }
};

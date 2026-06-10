<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->unsignedBigInteger('stage_id');
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('source', 100)->default('website');
            $table->text('lost_reason')->nullable();
            $table->foreignId('created_by_user_id')->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            $table->index('workspace_id');
            $table->index(['workspace_id', 'deleted_at']);
            $table->index('course_id');
            $table->index('stage_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};

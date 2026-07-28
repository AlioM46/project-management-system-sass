<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('stages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')
                ->constrained('workspaces')
                ->cascadeOnDelete();
            $table->foreignId('course_id')
                ->constrained('courses')
                ->cascadeOnDelete();
            $table->string('name', 150);
            $table->unsignedInteger('position')->default(0);
            $table->boolean('is_success')->default(false);
            $table->timestamps();

            $table->index(['workspace_id', 'course_id']);
            $table->unique(['course_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stages');
    }
};

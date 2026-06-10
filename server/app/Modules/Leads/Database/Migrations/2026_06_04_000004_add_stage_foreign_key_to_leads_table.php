<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('leads') || ! Schema::hasTable('stages')) {
            return;
        }

        Schema::table('leads', function (Blueprint $table) {
            $table->foreign('stage_id')
                ->references('id')
                ->on('stages')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('leads')) {
            return;
        }

        Schema::table('leads', function (Blueprint $table) {
            $table->dropForeign(['stage_id']);
        });
    }
};

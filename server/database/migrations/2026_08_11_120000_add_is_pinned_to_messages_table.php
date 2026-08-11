<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            if (!Schema::hasColumn('messages', 'is_pinned')) {
                $table->boolean('is_pinned')->default(false)->after('isDeleted');
            }
            if (!Schema::hasColumn('messages', 'pinned_at')) {
                $table->timestamp('pinned_at')->nullable()->after('is_pinned');
            }
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            if (Schema::hasColumn('messages', 'is_pinned')) {
                $table->dropColumn('is_pinned');
            }
            if (Schema::hasColumn('messages', 'pinned_at')) {
                $table->dropColumn('pinned_at');
            }
        });
    }
};

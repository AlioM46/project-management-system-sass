<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Add missing columns expected by the current roles schema for legacy tables.
     */
    public function up(): void
    {
        if (!Schema::hasTable('roles')) {
            return;
        }

        $this->addMissingRoleColumns();

        $this->backfillRoleSlugs();
        $this->backfillRoleMetadataDefaults();

        if (!$this->hasRolesWorkspaceSlugUniqueIndex()) {
            Schema::table('roles', function (Blueprint $table) {
                $table->unique(['workspace_id', 'slug']);
            });
        }
    }

    /**
     * Keep rollback as a no-op because the added columns are now part of the
     * canonical roles schema and may also exist from the base migration.
     */
    public function down(): void
    {
    }

    /**
     * Fill slug for legacy rows using a workspace-scoped unique slugified role name.
     */
    private function backfillRoleSlugs(): void
    {
        $rows = DB::table('roles')
            ->select('id', 'workspace_id', 'name', 'slug')
            ->orderBy('workspace_id')
            ->orderBy('id')
            ->get();

        $usedSlugsByWorkspace = [];

        foreach ($rows as $row) {
            $workspaceId = (int) $row->workspace_id;
            $usedSlugsByWorkspace[$workspaceId] ??= [];

            if (is_string($row->slug) && $row->slug !== '') {
                $usedSlugsByWorkspace[$workspaceId][$row->slug] = true;
                continue;
            }

            $baseSlug = Str::slug((string) $row->name);
            $baseSlug = $baseSlug !== '' ? $baseSlug : 'role';
            $slug = $baseSlug;
            $suffix = 2;

            while (isset($usedSlugsByWorkspace[$workspaceId][$slug])) {
                $slug = $baseSlug.'-'.$suffix;
                $suffix++;
            }

            DB::table('roles')
                ->where('id', $row->id)
                ->update(['slug' => $slug]);

            $usedSlugsByWorkspace[$workspaceId][$slug] = true;
        }
    }

    /**
     * Add any roles columns that may be missing in older databases.
     */
    private function addMissingRoleColumns(): void
    {
        if (!Schema::hasColumn('roles', 'slug')) {
            Schema::table('roles', function (Blueprint $table) {
                $table->string('slug', 150)->nullable()->after('name');
            });
        }

        if (!Schema::hasColumn('roles', 'description')) {
            Schema::table('roles', function (Blueprint $table) {
                $table->text('description')->nullable()->after('slug');
            });
        }

        if (!Schema::hasColumn('roles', 'is_system')) {
            Schema::table('roles', function (Blueprint $table) {
                $table->boolean('is_system')->default(false)->after('description');
            });
        }

        if (!Schema::hasColumn('roles', 'is_editable')) {
            Schema::table('roles', function (Blueprint $table) {
                $table->boolean('is_editable')->default(true)->after('is_system');
            });
        }

        if (!Schema::hasColumn('roles', 'is_deletable')) {
            Schema::table('roles', function (Blueprint $table) {
                $table->boolean('is_deletable')->default(true)->after('is_editable');
            });
        }

        if (!Schema::hasColumn('roles', 'created_at')) {
            Schema::table('roles', function (Blueprint $table) {
                $table->timestamp('created_at')->nullable()->after('is_deletable');
            });
        }

        if (!Schema::hasColumn('roles', 'updated_at')) {
            Schema::table('roles', function (Blueprint $table) {
                $table->timestamp('updated_at')->nullable()->after('created_at');
            });
        }
    }

    /**
     * Normalize nullable legacy columns to the defaults expected by the app.
     */
    private function backfillRoleMetadataDefaults(): void
    {
        if (Schema::hasColumn('roles', 'is_system')) {
            DB::table('roles')
                ->whereNull('is_system')
                ->update(['is_system' => false]);
        }

        if (Schema::hasColumn('roles', 'is_editable')) {
            DB::table('roles')
                ->whereNull('is_editable')
                ->update(['is_editable' => true]);
        }

        if (Schema::hasColumn('roles', 'is_deletable')) {
            DB::table('roles')
                ->whereNull('is_deletable')
                ->update(['is_deletable' => true]);
        }
    }

    /**
     * Detect whether the roles table already has the workspace+slug unique index.
     */
    private function hasRolesWorkspaceSlugUniqueIndex(): bool
    {
        $databaseName = DB::getDatabaseName();

        return DB::table('information_schema.statistics')
            ->select('index_name')
            ->where('table_schema', $databaseName)
            ->where('table_name', 'roles')
            ->where('index_name', 'roles_workspace_id_slug_unique')
            ->exists();
    }
};

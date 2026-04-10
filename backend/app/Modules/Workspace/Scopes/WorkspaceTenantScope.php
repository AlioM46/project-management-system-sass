<?php

namespace App\Modules\Workspace\Scopes;

use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Services\WorkspaceContextService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class WorkspaceTenantScope implements Scope
{
    // Class -> defines a global scope
    // implements Scope -> forces this class to have apply() method
    // Scope interface comes from Laravel Eloquent

    public function apply(Builder $builder, Model $model): void
    {
        // apply -> main function of scope
        // Laravel automatically calls this when query is built
        // NOT when model boots, NOT when saving

        // Builder $builder ->
        // Query builder instance for the model
        // used to build SQL query
        // comes from Illuminate\Database\Eloquent\Builder

        // Model $model ->
        // model class using this scope (eg: Role)
        // Laravel passes it automatically (not manually by you)
        // Extra: used to get table name, column info, etc.

        $workspaceId = app(WorkspaceContextService::class)->currentWorkspaceId();

        // $workspaceId -> local variable
        // app(...) -> Laravel helper to resolve service from container
        // WorkspaceContextService::class -> returns full class name
        // currentWorkspaceId() -> your custom method
        // Extra: gets current active workspace from app context (request/session/etc)

        if ($workspaceId === null) {
            // Check if no workspace context exists

            throw WorkspaceContextException::missingScopedModelContext(class_basename($model));

            // throw -> stops execution
            // WorkspaceContextException -> your custom exception
            // ::missingScopedModelContext(...) -> static method returning exception
            // class_basename($model) -> Laravel helper → returns short model name (eg: "Role")

            // Extra: prevents querying model without workspace context
        }

        $builder->where($model->qualifyColumn('workspace_id'), $workspaceId);

        // $builder->where(...) ->
        // adds WHERE condition to query

        // qualifyColumn('workspace_id') ->
        // prefixes column with table name
        // example: "workspace_id" → "roles.workspace_id"
        // avoids ambiguity in joins

        // $workspaceId ->
        // value used in WHERE condition

        // Final SQL effect:
        // WHERE roles.workspace_id = current_workspace_id

        // Extra: this is the core filtering logic of multi-tenancy
        // Extra: automatically applied to ALL queries of this model
    }
}
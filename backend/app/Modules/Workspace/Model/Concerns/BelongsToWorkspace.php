<?php

namespace App\Modules\Workspace\Model\Concerns;

use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Services\WorkspaceContextService;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;

trait BelongsToWorkspace
{


    /*
    ⚠️ Important
    Scope
    affects READ (queries)
    -
    Trait saving()
    affects WRITE (create/update)
    -
    Scope = "what data you are allowed to SEE"
    Trait saving = "what data you are allowed to WRITE"
    -
    Scope -> automatically adds WHERE workspace_id = current_workspace
    ensures model only reads data from its own workspace

    */

    protected static function bootBelongsToWorkspace(): void
    {
        // Static -> refers to the class the trait being used from, eg: static = Role Model
        // Extra: ** Scope **  = automatic rule added to a query + automatic filter applied to queries
        // Extra: it does NOT run the query now, it only registers the scope (Which Will allow to run on Some events)
        // Extra: later when Role::query(), Role::all(), Role::where() etc run, Laravel auto applies this scope
        // Extra: this method addGlobalScope() comes from Eloquent Model class


        // ***** Boot time only registers behavior
        // It does not do the actual filtering for every query by itself. *****



        static::addGlobalScope(new WorkspaceTenantScope());
        // At boot time, Laravel is basically being told:
        // “for future queries, use this scope”
        // “for future saves, use this saving callback”
        // So boot is like setup time.


        // static -> Again, it refers to the Model Being Called from
        // Saving -> since static is Model, and Model(Role, Workspace, Users) Inherits Model Class from (Eloquent)
        // it provides some event & listeners

        //  YOU ARE REGISTERING LISTENER ****

        // SAVING -> is Event Listener called when (create, Update, save() ) model
        // Extra: more precisely, saving runs BEFORE database write happens
        // Extra: it runs for BOTH create and update
        // Extra: bootBelongsToWorkspace() itself runs at Model boot time, but this callback runs later at save time
        static::saving(function ($model): void {
            // $model is Model Instance Being created or saved
            // eg: Role myRoleInstance = Role::create(["Name":"ABC"]);
            // Extra: in PHP syntax example would be:
            // Role $myRoleInstance(this is the $model) = Role::create(["name" => "ABC"]);
            // Extra: $model here is the actual instance currently being saved inside this callback

            $workspaceId = $model->getAttribute('workspace_id');
            // since $model is instance of Model class (Eloquent), it has methods like get-set(attributes)
            // Extra: getAttribute('workspace_id') reads current value from model object
            // Extra: if workspace_id not set yet, this may return null
            // Extra: getAttribute() also comes from Eloquent Model base class

            $currentWorkspaceId = app(WorkspaceContextService::class)->currentWorkspaceId();
            // Extra: app(...) is Laravel helper function
            // Extra: it asks Laravel Service Container to give instance of WorkspaceContextService

            if ($currentWorkspaceId !== null) {
                // Extra: means app currently knows what active workspace is
                // Extra: !== null means strict check, not loose check

                if ($workspaceId === null) {
                    // Extra: model has no workspace_id yet
                    // Extra: so trait auto fills it using current active workspace id

                    $model->setAttribute('workspace_id', $currentWorkspaceId);
                    // Extra: setAttribute() also comes from Eloquent Model class
                    // Extra: similar idea to $model->workspace_id = $currentWorkspaceId;

                    return;
                    // Extra: stop callback here because model is now valid
                }

                if ((int) $workspaceId !== (int) $currentWorkspaceId) {
                    // Extra: both values casted to int first
                    // Extra: this avoids problem like "5" and 5 being treated differently
                    // Extra: if provided workspace_id on model is different from current app workspace, reject save

                    throw WorkspaceContextException::workspaceMismatch(
                        providedWorkspaceId: (int) $workspaceId,
                        currentWorkspaceId: (int) $currentWorkspaceId
                    );
                    // Extra: throw = stop execution and raise exception
                    // Extra: workspaceMismatch(...) is static method on your custom exception class
                    // Extra: providedWorkspaceId: and currentWorkspaceId: are named arguments in PHP 8+
                }

                return;
                // Extra: if code reaches here, workspace exists and matches correctly
                // Extra: so save is allowed
            }

            if ($workspaceId === null) {
                throw WorkspaceContextException::missingScopedModelContext(class_basename($model));
                // Extra: this means no current workspace context exists AND model also has no workspace_id
                // Extra: class_basename($model) is Laravel helper, returns short class name only
                // Extra: example -> if full class is App\Modules\RolesPermissions\Model\Role, result is just "Role"
            }
        });
    }
}

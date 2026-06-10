<?php

namespace Database\Factories;

use App\Models\User;
use App\Modules\Workspace\Model\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Workspace>
 */
class WorkspaceFactory extends Factory
{
    protected $model = Workspace::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company().' Workspace',
            'created_by_user_id' => User::factory(),
        ];
    }
}

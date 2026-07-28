<?php

namespace Database\Factories;

use App\Models\User;
use App\Modules\Courses\Model\Course;
use App\Modules\Workspace\Model\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Course>
 */
class CourseFactory extends Factory
{
    protected $model = Course::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return [
            'workspace_id' => Workspace::factory(),
            'name' => ucwords($name),
            'description' => fake()->sentence(),
            'price' => fake()->randomFloat(2, 250, 3500),
            'duration_hours' => fake()->numberBetween(4, 60),
            'created_by_user_id' => fn (array $attributes): int => Workspace::query()
                ->findOrFail($attributes['workspace_id'])
                ->created_by_user_id ?? User::factory()->create()->id,
            'active_name_key' => mb_strtolower($name),
        ];
    }
}

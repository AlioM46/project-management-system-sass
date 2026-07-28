<?php

namespace Database\Factories;

use App\Modules\Courses\Model\Course;
use App\Modules\Courses\Model\Stage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Stage>
 */
class StageFactory extends Factory
{
    protected $model = Stage::class;

    public function definition(): array
    {
        return [
            'course_id' => Course::factory(),
            'workspace_id' => fn (array $attributes): ?int => Course::query()
                ->find($attributes['course_id'])
                ?->workspace_id,
            'name' => fake()->randomElement(['New Inquiry', 'Qualified', 'Consultation', 'Enrollment Complete']),
            'position' => fake()->numberBetween(1, 10),
            'is_success' => false,
        ];
    }
}

<?php

namespace Database\Factories;

use App\Models\User;
use App\Modules\Courses\Model\Course;
use App\Modules\Courses\Model\Stage;
use App\Modules\Leads\Model\Lead;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Lead>
 */
class LeadFactory extends Factory
{
    protected $model = Lead::class;

    public function definition(): array
    {
        return [
            'course_id' => Course::factory(),
            'workspace_id' => fn (array $attributes): ?int => Course::query()
                ->find($attributes['course_id'])
                ?->workspace_id,
            'stage_id' => function (array $attributes): int {
                $course = Course::query()->findOrFail($attributes['course_id']);

                return Stage::factory()->create([
                    'workspace_id' => $course->workspace_id,
                    'course_id' => $course->id,
                ])->id;
            },
            'title' => fake()->name(),
            'description' => fake()->sentence(),
            'phone' => '+9665'.fake()->numerify('########'),
            'source' => fake()->randomElement(['website', 'whatsapp', 'referral', 'instagram']),
            'lost_reason' => null,
            'created_by_user_id' => fn (array $attributes): int => Course::query()
                ->findOrFail($attributes['course_id'])
                ->created_by_user_id ?? User::factory()->create()->id,
        ];
    }
}

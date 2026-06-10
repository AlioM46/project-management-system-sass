<?php

namespace Database\Factories;

use App\Modules\Leads\Model\Lead;
use App\Modules\Leads\Model\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Student>
 */
class StudentFactory extends Factory
{
    protected $model = Student::class;

    public function definition(): array
    {
        return [
            'lead_id' => Lead::factory(),
            'workspace_id' => fn (array $attributes): ?int => Lead::query()
                ->find($attributes['lead_id'])
                ?->workspace_id,
            'student_code' => 'HYPRO-'.now()->format('Y').'-'.fake()->unique()->numerify('####'),
            'academic_status' => fake()->randomElement(['active', 'graduated', 'dropped_out']),
        ];
    }
}

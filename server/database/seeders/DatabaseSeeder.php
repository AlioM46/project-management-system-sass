<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Comments\Model\Comment;
use App\Modules\Courses\Model\Course;
use App\Modules\Courses\Model\Stage;
use App\Modules\Leads\Model\Lead;
use App\Modules\Leads\Model\Student;
use App\Modules\Notifications\Enums\NotificationType;
use App\Modules\Notifications\Services\NotificationService;
use App\Modules\RolesPermissions\Model\Role;
use App\Modules\Workspace\Actions\WorkspaceActions\CreateWorkspace;
use App\Modules\Workspace\Model\Workspace_Members;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        DB::transaction(function (): void {
            $owner = User::factory()->create([
                'name' => 'Academy Owner',
                'username' => 'academyowner',
                'email' => 'owner@hyprocrm.test',
            ]);

            $advisor = User::factory()->create([
                'name' => 'Admissions Advisor',
                'username' => 'admadvisor',
                'email' => 'advisor@hyprocrm.test',
            ]);

            $workspace = app(CreateWorkspace::class)->execute([
                'name' => 'HyPro Automotive Academy',
            ], $owner);

            Workspace_Members::query()->create([
                'workspace_id' => $workspace->id,
                'user_id' => $advisor->id,
                'role_id' => Role::query()
                    ->withoutGlobalScope(WorkspaceTenantScope::class)
                    ->where('workspace_id', $workspace->id)
                    ->where('slug', 'member')
                    ->value('id'),
                'joined_at' => now(),
            ]);

            $courses = collect([
                [
                    'name' => 'Defensive Driving Mastery',
                    'description' => 'Safety-first academy program for new and returning drivers.',
                    'price' => 1499.00,
                    'duration_hours' => 24,
                ],
                [
                    'name' => 'Fleet Operations Certification',
                    'description' => 'Driver operations and compliance training for fleet teams.',
                    'price' => 2299.00,
                    'duration_hours' => 36,
                ],
            ])->map(function (array $attributes) use ($workspace, $owner): Course {
                return Course::query()->create([
                    'workspace_id' => $workspace->id,
                    'name' => $attributes['name'],
                    'description' => $attributes['description'],
                    'price' => $attributes['price'],
                    'duration_hours' => $attributes['duration_hours'],
                    'created_by_user_id' => $owner->id,
                    'active_name_key' => mb_strtolower($attributes['name']),
                ]);
            });

            $pipelineByCourse = $courses->mapWithKeys(function (Course $course) use ($workspace): array {
                $stages = collect([
                    ['name' => 'New Inquiry', 'position' => 1, 'is_success' => false],
                    ['name' => 'Contacted', 'position' => 2, 'is_success' => false],
                    ['name' => 'Qualified', 'position' => 3, 'is_success' => false],
                    ['name' => 'Test Drive Session', 'position' => 4, 'is_success' => false],
                    ['name' => 'Deposit Paid', 'position' => 5, 'is_success' => false],
                    ['name' => 'Won', 'position' => 6, 'is_success' => true],
                    ['name' => 'Lost', 'position' => 7, 'is_success' => false],
                ])->map(fn (array $stage) => Stage::query()->create([
                    'workspace_id' => $workspace->id,
                    'course_id' => $course->id,
                    'name' => $stage['name'],
                    'position' => $stage['position'],
                    'is_success' => $stage['is_success'],
                ]));

                return [$course->id => $stages];
            });

            $leadDefinitions = [
                ['name' => 'Ahmed Salem', 'course_index' => 0, 'stage_position' => 1, 'source' => 'website'],
                ['name' => 'Noura Alotaibi', 'course_index' => 0, 'stage_position' => 3, 'source' => 'instagram'],
                ['name' => 'Faisal Harbi', 'course_index' => 0, 'stage_position' => 6, 'source' => 'referral'],
                ['name' => 'Mona Rashid', 'course_index' => 1, 'stage_position' => 4, 'source' => 'whatsapp'],
                ['name' => 'Khaled Saad', 'course_index' => 1, 'stage_position' => 6, 'source' => 'website'],
            ];

            $leads = collect($leadDefinitions)->map(function (array $definition, int $index) use ($courses, $pipelineByCourse, $workspace, $owner): Lead {
                $course = $courses[$definition['course_index']];
                $stage = $pipelineByCourse[$course->id]->firstWhere('position', $definition['stage_position']);

                return Lead::query()->create([
                    'workspace_id' => $workspace->id,
                    'course_id' => $course->id,
                    'stage_id' => $stage->id,
                    'title' => $definition['name'],
                    'description' => 'Imported academy CRM demo lead.',
                    'phone' => '+96650000'.str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT),
                    'source' => $definition['source'],
                    'lost_reason' => null,
                    'created_by_user_id' => $owner->id,
                ]);
            });

            $leads->each(function (Lead $lead) use ($advisor): void {
                $lead->assignments()->create([
                    'user_id' => $advisor->id,
                    'assigned_by_user_id' => $lead->created_by_user_id,
                    'created_at' => now(),
                ]);
            });

            $convertedLeads = $leads->filter(function (Lead $lead) use ($pipelineByCourse): bool {
                return (bool) optional($pipelineByCourse[$lead->course_id]->firstWhere('id', $lead->stage_id))->is_success;
            })->values();

            $convertedLeads->each(function (Lead $lead, int $index) use ($workspace): void {
                Student::query()->create([
                    'workspace_id' => $workspace->id,
                    'lead_id' => $lead->id,
                    'student_code' => sprintf('HYPRO-%s-%04d', now()->format('Y'), $index + 1),
                    'academic_status' => 'active',
                ]);
            });

            $comments = [
                ['lead' => $leads[0], 'author_id' => $owner->id, 'content' => 'Requested evening schedule details.'],
                ['lead' => $leads[2], 'author_id' => $advisor->id, 'content' => 'Enrollment confirmed and welcome message queued.'],
                ['lead' => $leads[3], 'author_id' => $advisor->id, 'content' => 'Follow up after the practical session tomorrow.'],
            ];

            foreach ($comments as $comment) {
                Comment::query()->create([
                    'lead_id' => $comment['lead']->id,
                    'author_id' => $comment['author_id'],
                    'parent_id' => null,
                    'content' => $comment['content'],
                ]);
            }

            $notificationService = app(NotificationService::class);

            $notificationService->send($workspace->id, $advisor->id, NotificationType::LEAD_ASSIGNED, [
                'lead_id' => $leads[0]->id,
                'message' => 'Ahmed Salem was assigned to you for qualification.',
            ]);

            $notificationService->send($workspace->id, $owner->id, NotificationType::LEAD_CONVERTED, [
                'lead_id' => $convertedLeads[0]->id,
                'student_id' => Student::query()
                    ->withoutGlobalScope(WorkspaceTenantScope::class)
                    ->where('lead_id', $convertedLeads[0]->id)
                    ->value('id'),
                'message' => 'A lead was converted into a student in the academy pipeline.',
            ]);
        });
    }
}

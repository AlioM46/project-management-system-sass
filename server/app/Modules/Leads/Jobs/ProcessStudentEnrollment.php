<?php

namespace App\Modules\Leads\Jobs;

use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Enums\AuditMetadataKey;
use App\Modules\Audit\Enums\AuditTargetType;
use App\Modules\Audit\Services\AuditLogger;
use App\Modules\Leads\Model\OutboundMessage;
use App\Modules\Leads\Model\Student;
use App\Modules\Leads\Services\MessagingService;
use App\Modules\Notifications\Enums\NotificationType;
use App\Modules\Notifications\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessStudentEnrollment implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly int $studentId,
        public readonly int $leadId,
        public readonly int $workspaceId
    ) {
    }

    public function handle(
        MessagingService $messagingService,
        AuditLogger $auditLogger,
        NotificationService $notificationService
    ): void
    {
        $student = Student::query()
            ->with(['lead.course', 'lead.assignments', 'workspace'])
            ->where('workspace_id', $this->workspaceId)
            ->whereKey($this->studentId)
            ->first();

        if ($student === null || $student->lead === null) {
            return;
        }

        $lead = $student->lead;
        $recipientPhone = $lead->phone;

        if ($recipientPhone === null || trim($recipientPhone) === '') {
            return;
        }

        $templateKey = (string) config('messaging.templates.student_enrollment', 'student_enrollment');
        $payload = [
            'student_code' => $student->student_code,
            'student_name' => $lead->title,
            'course_name' => $lead->course?->name,
            'academic_status' => $student->academic_status,
        ];

        $message = OutboundMessage::query()->create([
            'workspace_id' => $this->workspaceId,
            'lead_id' => $lead->id,
            'student_id' => $student->id,
            'provider' => $messagingService->providerName(),
            'template_key' => $templateKey,
            'recipient_phone' => $recipientPhone,
            'status' => 'queued',
            'payload' => $payload,
            'queued_at' => now(),
        ]);

        $auditLogger->record(
            workspace: $student->workspace,
            action: AuditAction::WhatsAppMessageQueued,
            targetType: AuditTargetType::OutboundMessage,
            targetId: $message->id,
            newValues: [
                'status' => $message->status,
                'recipient_phone' => $message->recipient_phone,
            ],
            metadata: [
                AuditMetadataKey::LeadId->value => $lead->id,
                AuditMetadataKey::StudentId->value => $student->id,
                AuditMetadataKey::OutboundMessageId->value => $message->id,
                AuditMetadataKey::Provider->value => $message->provider,
                AuditMetadataKey::TemplateKey->value => $templateKey,
                AuditMetadataKey::RecipientPhone->value => $message->recipient_phone,
            ]
        );

        $result = $messagingService->sendTemplate(
            recipientPhone: $recipientPhone,
            templateKey: $templateKey,
            templateData: $payload,
            context: [
                'workspace_id' => $this->workspaceId,
                'lead_id' => $lead->id,
                'student_id' => $student->id,
            ]
        );

        if ($result->successful) {
            $message->forceFill([
                'status' => 'sent',
                'provider_message_id' => $result->providerMessageId,
                'response_payload' => $result->responsePayload,
                'sent_at' => now(),
                'failed_at' => null,
                'error_message' => null,
            ])->save();

            $auditLogger->record(
                workspace: $student->workspace,
                action: AuditAction::WhatsAppMessageSent,
                targetType: AuditTargetType::OutboundMessage,
                targetId: $message->id,
                oldValues: ['status' => 'queued'],
                newValues: ['status' => 'sent'],
                metadata: [
                    AuditMetadataKey::LeadId->value => $lead->id,
                    AuditMetadataKey::StudentId->value => $student->id,
                    AuditMetadataKey::OutboundMessageId->value => $message->id,
                    AuditMetadataKey::Provider->value => $message->provider,
                ]
            );

            return;
        }

        $message->forceFill([
            'status' => 'failed',
            'response_payload' => $result->responsePayload,
            'failed_at' => now(),
            'error_message' => $result->errorMessage,
        ])->save();

        $auditLogger->record(
            workspace: $student->workspace,
            action: AuditAction::WhatsAppMessageFailed,
            targetType: AuditTargetType::OutboundMessage,
            targetId: $message->id,
            oldValues: ['status' => 'queued'],
            newValues: ['status' => 'failed'],
            metadata: [
                AuditMetadataKey::LeadId->value => $lead->id,
                AuditMetadataKey::StudentId->value => $student->id,
                AuditMetadataKey::OutboundMessageId->value => $message->id,
                AuditMetadataKey::Provider->value => $message->provider,
                AuditMetadataKey::RecipientPhone->value => $message->recipient_phone,
            ]
        );

        $recipientIds = collect([$lead->created_by_user_id])
            ->merge($lead->assignments->pluck('user_id'))
            ->filter()
            ->unique();

        foreach ($recipientIds as $userId) {
            $notificationService->send(
                $this->workspaceId,
                (int) $userId,
                NotificationType::WHATSAPP_SEND_FAILED,
                [
                    'lead_id' => $lead->id,
                    'student_id' => $student->id,
                    'outbound_message_id' => $message->id,
                    'message' => sprintf('WhatsApp enrollment message failed for %s.', $lead->title),
                    'error' => $result->errorMessage,
                ]
            );
        }
    }
}

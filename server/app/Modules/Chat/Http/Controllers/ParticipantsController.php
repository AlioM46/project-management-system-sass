<?php

namespace App\Modules\Chat\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Chat\Events\MessageSent;
use App\Modules\Chat\Events\MessageReactionUpdated;
use App\Modules\Chat\Events\MessageUpdated;
use App\Modules\Chat\Events\MessageDeleted;
use App\Modules\Chat\Model\Conversation;
use App\Modules\Chat\Model\ConversationReadState;
use App\Modules\Chat\Model\ConversationParticipant;
use App\Modules\Chat\Model\Message;
use App\Modules\Chat\Model\MessageDeletion;
use App\Modules\Chat\Model\MessageReaction;
use App\Modules\Notifications\Enums\NotificationType;
use App\Modules\Notifications\Model\Notification;
use App\Modules\Notifications\Services\NotificationService;
use App\Modules\Workspace\Services\WorkspaceContextService;
use App\Modules\Chat\Services\MessageAttachmentService;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ParticipantsController extends Controller
{

    private NotificationService $notificationService;
    private WorkspaceContextService $workspaceContextService;

    public function __construct(
        NotificationService $notificationService,
        WorkspaceContextService $workspaceContextService
    ) {
        $this->notificationService = $notificationService;
        $this->workspaceContextService = $workspaceContextService;
    }

    public function AddParticipants(int $conversationId, Request $request)
    {
        $workspaceId = $this->workspaceContextService->currentWorkspaceId();

        $validated = $request->validate([
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'required|integer|exists:users,id',
        ]);

        $conversation = Conversation::findOrFail($conversationId);

        if (!in_array(strtolower($conversation->type), ['group', 'project'])) {
            return ApiResponse::error('Cannot add participants to a direct conversation.', 'INVALID_TYPE', [], 400);
        }

        // 1️⃣ جلب معرفات الأعضاء الموجودين حالياً بـ Query واحد
        $existingUserIds = ConversationParticipant::where('conversation_id', $conversationId)
            ->pluck('user_id')
            ->toArray();

        // 2️⃣ تصفية المدخلات: استخراج فقط الجدد (مثلاً [1, 2, 3] واستبعاد 4)
        // remove the items from arr1 that exist in both arr1 & arr2
        $newUsersToAdd = array_values(array_diff($validated['user_ids'], $existingUserIds));

        // 3️⃣ إذا كان جميع المحددين موجودين مسبقاً
        if (empty($newUsersToAdd)) {
            return ApiResponse::success('Selected users are already in this group.');
        }

        // 4️⃣ تجهيز البيانات وتأدية Bulk Insert بـ Query واحد فقط!
        $now = now();

        // عند استخدام Model::insert() مباشرةً:
        // لا يتم إطلاق الأحداث (Model Events) مثل created أو creating.


        // لا يتم تعيين التواريخ تلقائياً
        // لهذا السبب قمت بإضافة created_at و updated_at يدوياً داخل الـ array_map
        // (وهو تصرف ممتاز وصحيح).
        $authUser = auth()->user();
        $insertData = array_map(function ($userId) use ($conversationId, $now, $workspaceId, $conversation, $authUser) {

            $this->notificationService->send(
                $workspaceId,
                $userId,
                NotificationType::INFO,
                [
                    'message' => "You were added to `{$conversation->name}` conversation",
                    'conversation' => $conversation,
                    'conversationId' => $conversation->id,
                    'senderId' => $authUser->id,
                    'workspaceId' => $workspaceId
                ]
            );
            return [
                'workspace_id' => $workspaceId,
                'conversation_id' => $conversationId,
                'user_id' => $userId,
                'role' => 'member',
                'is_active' => true,
                'joined_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }, $newUsersToAdd);




        ConversationParticipant::insert($insertData);

        return ApiResponse::success('Participants added successfully.');
    }

    public function RemoveParticipants(int $conversationId, int $userId)
    {
        $conversation = Conversation::with('participants.user')->findOrFail($conversationId);
        $workspaceId = $this->workspaceContextService->currentWorkspaceId();

        if (!in_array(strtolower($conversation->type), ['group', 'project'])) {
            return ApiResponse::error('Cannot remove participants from a direct conversation.', 'INVALID_TYPE', [], 400);
        }

        // 1️⃣ البحث عن العضو المراد حذفه مع التأكد من وجوده
        $targetUser = $conversation->participants->where('user_id', $userId)->first();
        if (!$targetUser) {
            return ApiResponse::error('User is not a participant in this conversation.', 'NOT_FOUND', [], 404);
        }

        // 2️⃣ فحص الصلاحيات
        if (!$this->canRemoveParticipant($conversation, $targetUser)) {
            return ApiResponse::error('You do not have permission to remove this participant.', 'FORBIDDEN', [], 403);
        }

        // 3️⃣ حذف المشارك
        $conversation->participants()->where('user_id', $userId)->delete();

        // 4️⃣ إرسال إشعار للمستخدم المحذوف نفسه
        $this->notificationService->send(
            $workspaceId,
            $targetUser->user_id,
            NotificationType::INFO,
            [
                'message' => "You were removed from `{$conversation->name}` conversation",
                'conversation' => $conversation,
                'conversationId' => $conversation->id,
                'senderId' => auth()->id(),
                'workspaceId' => $workspaceId
            ]
        );

        // 5️⃣ إرسال إشعار لبقية المشاركين بالمحادثة (استثناء الشخص الحاذف auth()->id() والمستخدم المحذوف)
        $authUserId = auth()->id();
        $remainingParticipants = $conversation->participants
            ->where('user_id', '!=', $userId)
            ->where('user_id', '!=', $authUserId);

        foreach ($remainingParticipants as $participant) {
            $this->notificationService->send(
                $workspaceId,
                $participant->user_id,
                NotificationType::INFO,
                [
                    'message' => "User `{$targetUser->user->name}` was removed from `{$conversation->name}` conversation",
                    'conversation' => $conversation,
                    'conversationId' => $conversation->id,
                    'senderId' => $authUserId,
                    'workspaceId' => $workspaceId
                ]
            );
        }

        return ApiResponse::success('Participant removed successfully.');
    }

    private function canRemoveParticipant(Conversation $conversation, ConversationParticipant $targetUser): bool
    {
        $authUserId = auth()->id();

        // 🟢 البحث الصحيح بـ user_id بدلاً من id
        $currentUser = $conversation->participants->where('user_id', $authUserId)->first();

        if (!$currentUser) {
            return false;
        }

        $isCurrentUserOwner = $currentUser->role === "owner";
        $isCurrentUserAdmin = $currentUser->role === "admin";
        $isCurrentUserMember = $currentUser->role === "member";

        $isTargetOwner = $targetUser->role === "owner";
        $isTargetAdmin = $targetUser->role === "admin";
        $isTargetMember = $targetUser->role === "member";

        if ($isCurrentUserMember) {
            return false;
        }

        if ($isCurrentUserOwner) {
            return true;
        }

        if ($isTargetOwner) {
            return false;
        }

        if ($isCurrentUserAdmin && $isTargetAdmin) {
            return false;
        }

        if ($isCurrentUserAdmin && $isTargetMember) {
            return true;
        }

        return false;
    }



    public function ChangeParticipantRole(int $conversationId, int $participantId, Request $request)
    {

        $request->validate([
            'role' => 'required|in:owner,admin,member',
        ]);

        $currentUser = auth()->user();

        $workspaceId = $this->workspaceContextService->currentWorkspaceId();
        $conversation = Conversation::where('id', $conversationId)
            ->first();

        $targetParticipant = ConversationParticipant::where('id', $participantId)
            ->where('conversation_id', $conversationId)
            ->first();
        $currentUserParticipant = ConversationParticipant::where('user_id', $currentUser->id)
            ->where('conversation_id', $conversationId)
            ->first();


        if (!$targetParticipant) {
            return ApiResponse::error('Participant not found', 'NOT_FOUND', [], 404);
        }
        if (!$currentUserParticipant) {
            return ApiResponse::error('You are not a participant in this conversation.', 'FORBIDDEN', [], 403);
        }

        if (!$conversation) {
            return ApiResponse::error('Conversation not found', 'NOT_FOUND', [], 404);
        }

        if ($targetParticipant->user_id == $currentUser->id) {
            return ApiResponse::error('You cannot change your role', 'FORBIDDEN', [], 403);
        }
        if (in_array(strtolower($conversation->type), ['direct'])) {
            return ApiResponse::error('You cannot change role in this conversation', 'FORBIDDEN', [], 403);
        }
        if ($targetParticipant->user_id == $currentUser->id) {
            return ApiResponse::error('You cannot change your role', 'FORBIDDEN', [], 403);
        }


        $canUpgrade = $this->canUpgradeMemberToRole($targetParticipant, $currentUserParticipant, $request->role);
        if (!$canUpgrade) {
            return ApiResponse::error('You do not have permission to perform this action.', 'FORBIDDEN', [], 403);
        }





        return ApiResponse::success('Participant role updated successfully.');
    }


    private function canUpgradeMemberToRole(ConversationParticipant $targetUser, ConversationParticipant $currentUserParticipant, string $newRole): bool
    {

        $isCurrentUserOwner = $currentUserParticipant->role === "owner";
        $isCurrentUserAdmin = $currentUserParticipant->role === "admin";
        $isCurrentUserMember = $currentUserParticipant->role === "member";

        $isTargetOwner = $targetUser->role === "owner";
        $isTargetAdmin = $targetUser->role === "admin";
        $isTargetMember = $targetUser->role === "member";


        if ($isCurrentUserMember || $isTargetOwner) {
            return false;
        }

        if ($targetUser->role === $newRole) {
            return false;
        }


        if ($isCurrentUserOwner) {
            // Ownership transfer: Current owner becomes admin, target becomes owner
            if ($newRole === "owner") {
                $currentUserParticipant->role = "admin";
                $targetUser->role = "owner";
                $currentUserParticipant->save();
                $targetUser->save();
                return true;
            }
            // Owner can promote to admin or demote to member
            if (in_array($newRole, ['admin', 'member'])) {
                $targetUser->role = $newRole;
                $targetUser->save();
                return true;
            }
        }




        if ($isCurrentUserAdmin) {
            // Admin can make member -> admin
            if ($newRole === 'admin' && $isTargetMember) {
                $targetUser->role = "admin";
                $targetUser->save();
                return true;
            }
            // Admin can demote admin -> member
            if ($newRole === 'member' && $isTargetAdmin) {
                $targetUser->role = "member";
                $targetUser->save();
                return true;
            }
        }



        return false;
    }

}

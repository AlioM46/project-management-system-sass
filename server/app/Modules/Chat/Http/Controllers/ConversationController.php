<?php

namespace App\Modules\Chat\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Chat\Model\BlockedUser;
use App\Modules\Chat\Model\Conversation;
use App\Modules\Chat\Model\ConversationParticipant;
use App\Modules\Chat\Model\Message;
use App\Modules\Workspace\Services\WorkspaceContextService;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ConversationController extends Controller
{
    private WorkspaceContextService $workspaceContextService;

    public function __construct(WorkspaceContextService $workspaceContextService)
    {
        $this->workspaceContextService = $workspaceContextService;
    }

    /**
     * Get active workspace conversation list for current user.
     */
    public function index(): JsonResponse
    {
        $userId = auth()->id();
        $workspaceId = $this->workspaceContextService->currentWorkspaceId();

        $conversations = Conversation::where('workspace_id', $workspaceId)
            ->whereHas('participants', function ($query) use ($userId) {
                $query->where('user_id', $userId)->where('is_active', true);
            })
            ->with([
                'project:id,name',
                'participants' => function ($q) {
                    $q->where('is_active', true)->with('user:id,name,email,avatar_url');
                },
            ])
            ->latest('updated_at')
            ->get();

        $conversationData = $conversations->map(function ($conversation) use ($userId) {
            $unreadCount = Message::where('conversation_id', $conversation->id)
                ->where('user_id', '!=', $userId)
                ->whereDoesntHave('deletions', function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                })
                ->whereDoesntHave('reads', function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                })
                ->count();

            $lastMessage = Message::where('conversation_id', $conversation->id)
                ->whereDoesntHave('deletions', function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                })
                ->latest()
                ->first();

            $participant = $conversation->participants->firstWhere('user_id', $userId);
            $mutedUntil = $participant ? $participant->muted_until : null;
            $isMuted = $mutedUntil ? $mutedUntil->isFuture() : false;

            $isBlockedByMe = false;
            $isBlockedByPartner = false;

            if ($conversation->type === 'direct') {
                $partnerParticipant = ConversationParticipant::where('conversation_id', $conversation->id)
                    ->where('user_id', '!=', $userId)
                    ->where('is_active', true)
                    ->first();

                $partnerId = $partnerParticipant ? $partnerParticipant->user_id : null;

                if ($partnerId) {
                    $isBlockedByMe = BlockedUser::where('workspace_id', $conversation->workspace_id)
                        ->where('blocker_id', $userId)
                        ->where('blocked_id', $partnerId)
                        ->exists();

                    $isBlockedByPartner = BlockedUser::where('workspace_id', $conversation->workspace_id)
                        ->where('blocker_id', $partnerId)
                        ->where('blocked_id', $userId)
                        ->exists();
                }
            }

            $data = $conversation->toArray();
            $data['unread_count'] = $unreadCount;
            $data['last_message'] = $lastMessage;
            $data['is_muted'] = $isMuted;
            $data['muted_until'] = $mutedUntil ? $mutedUntil->toIso8601String() : null;
            $data['is_blocked_by_me'] = $isBlockedByMe;
            $data['is_blocked_by_partner'] = $isBlockedByPartner;

            return $data;
        });

        return ApiResponse::success('Conversations retrieved successfully.', $conversationData->toArray());
    }

    /**
     * Create a new Direct Message or Group conversation.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'type' => 'required|in:direct,group',
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id',
            'name' => 'nullable|required_if:type,group|string|max:255',
        ]);

        $currentUserId = auth()->id();
        $workspaceId = $this->workspaceContextService->currentWorkspaceId();

        if ($request->type === 'direct') {
            $otherUserId = $request->user_ids[0];

            if ($currentUserId === $otherUserId) {
                return ApiResponse::error('Cannot create direct conversation with yourself.', 'INVALID_PARTICIPANT', [], 422);
            }

            $existingConversation = Conversation::where('workspace_id', $workspaceId)
                ->where('type', 'direct')
                ->whereHas('participants', function ($q) use ($currentUserId) {
                    $q->where('user_id', $currentUserId)->where('is_active', true);
                })
                ->whereHas('participants', function ($q) use ($otherUserId) {
                    $q->where('user_id', $otherUserId)->where('is_active', true);
                })
                ->first();

            if ($existingConversation) {
                $existingConversation->load([
                    'project:id,name',
                    'participants' => function ($q) {
                        $q->where('is_active', true)->with('user:id,name,email,avatar_url');
                    },
                ]);
                return ApiResponse::success('Direct conversation already exists.', $existingConversation->toArray());
            }
        }

        $conversation = DB::transaction(function () use ($request, $currentUserId, $workspaceId) {
            $conv = Conversation::create([
                'workspace_id' => $workspaceId,
                'type' => $request->type,
                'name' => $request->type === 'group' ? $request->name : null,
            ]);

            ConversationParticipant::create([
                'conversation_id' => $conv->id,
                'user_id' => $currentUserId,
                'role' => 'owner',
            ]);

            foreach ($request->user_ids as $userId) {
                if ($userId !== $currentUserId) {
                    ConversationParticipant::create([
                        'conversation_id' => $conv->id,
                        'user_id' => $userId,
                        'role' => 'member',
                    ]);
                }
            }

            return $conv;
        });

        $conversation->load([
            'project:id,name',
            'participants' => function ($q) {
                $q->where('is_active', true)->with('user:id,name,email,avatar_url');
            },
        ]);

        return ApiResponse::success('Conversation created successfully.', $conversation->toArray(), [], 201);
    }

    /**
     * Get detailed sidebar information (participants, media/document attachments, common groups).
     */
    public function sidebarInfo(int $id): JsonResponse
    {
        $userId = auth()->id();
        $workspaceId = $this->workspaceContextService->currentWorkspaceId();

        $conversation = Conversation::where('workspace_id', $workspaceId)
            ->whereHas('participants', function ($q) use ($userId) {
                $q->where('user_id', $userId)->where('is_active', true);
            })
            ->with([
                'project:id,name',
                'participants' => function ($q) {
                    $q->where('is_active', true)->with('user:id,name,email,avatar_url');
                },
                'attachments' => function ($q) {
                    $q->latest();
                },
            ])
            ->findOrFail($id);

        $mediaAttachments = $conversation->attachments->filter(function ($att) {
            $type = strtolower($att['file_type'] ?? '');
            $name = strtolower($att['original_name'] ?? '');
            return str_starts_with($type, 'image/') ||
                str_starts_with($type, 'video/') ||
                str_starts_with($type, 'audio/') ||
                str_contains($name, 'voice_note');
        })->values();

        $docAttachments = $conversation->attachments->filter(function ($att) {
            $type = strtolower($att['file_type'] ?? '');
            $name = strtolower($att['original_name'] ?? '');
            $isMedia = str_starts_with($type, 'image/') ||
                str_starts_with($type, 'video/') ||
                str_starts_with($type, 'audio/') ||
                str_contains($name, 'voice_note');
            return !$isMedia;
        })->values();

        $groupsInCommon = [];
        if ($conversation->type === 'direct') {
            $partner = $conversation->participants->firstWhere('user_id', '!=', $userId);
            if ($partner) {
                $partnerUserId = $partner->user_id;
                $groupsInCommon = Conversation::where('workspace_id', $workspaceId)
                    ->where('type', 'group')
                    ->whereHas('participants', function ($q) use ($userId) {
                        $q->where('user_id', $userId)->where('is_active', true);
                    })
                    ->whereHas('participants', function ($q) use ($partnerUserId) {
                        $q->where('user_id', $partnerUserId)->where('is_active', true);
                    })
                    ->select('id', 'name', 'type', 'created_at')
                    ->get();
            }
        }

        $myParticipant = $conversation->participants->firstWhere('user_id', $userId);
        $mutedUntil = $myParticipant ? $myParticipant->muted_until : null;
        $isMuted = $mutedUntil ? $mutedUntil->isFuture() : false;

        $isBlockedByMe = false;
        $isBlockedByPartner = false;
        if ($conversation->type === 'direct') {
            $partner = $conversation->participants->firstWhere('user_id', '!=', $userId);
            if ($partner) {
                $isBlockedByMe = BlockedUser::where('workspace_id', $workspaceId)
                    ->where('blocker_id', $userId)
                    ->where('blocked_id', $partner->user_id)
                    ->exists();

                $isBlockedByPartner = BlockedUser::where('workspace_id', $workspaceId)
                    ->where('blocker_id', $partner->user_id)
                    ->where('blocked_id', $userId)
                    ->exists();
            }
        }

        return ApiResponse::success('Sidebar info retrieved successfully.', [
            'conversation' => [
                'id' => $conversation->id,
                'name' => $conversation->name,
                'description' => $conversation->description,
                'type' => $conversation->type,
                'project' => $conversation->project,
                'created_at' => $conversation->created_at,
                'is_muted' => $isMuted,
                'muted_until' => $mutedUntil ? $mutedUntil->toIso8601String() : null,
                'is_blocked_by_me' => $isBlockedByMe,
                'is_blocked_by_partner' => $isBlockedByPartner,
            ],
            'participants' => $conversation->participants->map(function ($p) {
                return [
                    'id' => $p->id,
                    'user_id' => $p->user_id,
                    'role' => $p->role,
                    'user' => $p->user,
                    'avatar_url' => $p->user->avatar_url,
                    'joined_at' => $p->joined_at,
                ];
            }),
            'media_attachments' => $mediaAttachments,
            'document_attachments' => $docAttachments,
            'groups_in_common' => $groupsInCommon,
        ]);
    }

    /**
     * Update group conversation details (name and description).
     */
    public function updateDetails(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $userId = auth()->id();
        $workspaceId = $this->workspaceContextService->currentWorkspaceId();

        $conversation = Conversation::where('workspace_id', $workspaceId)
            ->whereHas('participants', function ($q) use ($userId) {
                $q->where('user_id', $userId)
                    ->where('is_active', true)
                    ->whereIn('role', ['owner', 'admin']);
            })
            ->findOrFail($id);

        if ($conversation->type !== 'group') {
            return ApiResponse::error('Only group details can be updated.', 'INVALID_CONVERSATION_TYPE', [], 422);
        }

        $conversation->update(array_filter([
            'name' => $request->name,
            'description' => $request->description,
        ]));

        return ApiResponse::success('Group details updated successfully.', $conversation->toArray());
    }
}

<?php

namespace App\Modules\Chat\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Chat\Events\MessageDelivered;
use App\Modules\Chat\Events\MessageRead;
use App\Modules\Chat\Events\MessageSent;
use App\Modules\Chat\Events\MessageReactionUpdated;
use App\Modules\Chat\Events\MessageUpdated;
use App\Modules\Chat\Events\MessageDeleted;
use App\Modules\Chat\Model\BlockedUser;
use App\Modules\Chat\Model\Conversation;
use App\Modules\Chat\Model\ConversationReadState;
use App\Modules\Chat\Model\ConversationParticipant;
use App\Modules\Chat\Model\Message;
use App\Modules\Chat\Model\MessageDeletion;
use App\Modules\Chat\Model\MessageReaction;
use App\Modules\Chat\Model\StarredMessage;
use App\Modules\Notifications\Enums\NotificationType;
use App\Modules\Notifications\Model\Notification;
use App\Modules\Notifications\Services\NotificationService;
use App\Modules\Workspace\Services\WorkspaceContextService;
use App\Modules\Chat\Services\MessageAttachmentService;
use App\Modules\Comments\Services\MentionService;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{

    private WorkspaceContextService $workspaceContextService;
    private NotificationService $notificationService;
    private MessageAttachmentService $messageAttachmentService;
    private MentionService $mentionService;

    public function __construct(
        WorkspaceContextService $contextService,
        NotificationService $notificationService,
        MessageAttachmentService $messageAttachmentService,
        MentionService $mentionService
    ) {
        $this->workspaceContextService = $contextService;
        $this->notificationService = $notificationService;
        $this->messageAttachmentService = $messageAttachmentService;
        $this->mentionService = $mentionService;
    }

    /**
     * List all conversations (DMs & Projects) in the current workspace.
     */




    /**
     * DELIVERED: Called by recipient's browser when it receives a message via WebSockets.
     */

    public function markAsDelivered(int $conversationId, int $messageId)
    {
        // Should be handled in groups
        $message = Message::where('conversation_id', $conversationId)->findOrFail($messageId);
        $conversation = Conversation::find($conversationId);

        if (is_null($message->delivered_at)) {
            $message->update(['delivered_at' => now()]);
            if ($conversation) {
                broadcast(new MessageDelivered($conversation->workspace_id, $conversationId, now()->toIso8601String()))->toOthers();
            }
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * DELIVERED BULK: Called when user reconnects (Presence .here() fires).
     * Marks ALL pending undelivered messages across ALL chats in 1 query.
     */
    public function markAllDeliveredOnPresenceJoin()
    {
        $userId = auth()->id();
        // 1. Get all active conversation IDs for this user
        $conversationIds = ConversationParticipant::where('user_id', $userId)
            ->where('is_active', true)
            ->pluck('conversation_id');
        // 2. Filter ONLY DIRECT (1-on-1) Conversations!
        $directConversationIds = Conversation::whereIn('id', $conversationIds)
            ->where('type', 'direct')
            ->pluck('id');
        // 3. Mark undelivered messages in DIRECT chats (1-on-1)
        $hasUndelivered = Message::whereIn('conversation_id', $directConversationIds)
            ->where('user_id', '!=', $userId)
            ->whereNull('delivered_at')
            ->exists();
        if ($hasUndelivered) {
            Message::whereIn('conversation_id', $directConversationIds)
                ->where('user_id', '!=', $userId)
                ->whereNull('delivered_at')
                ->update(['delivered_at' => now()]);
            foreach ($directConversationIds as $cId) {
                $c = Conversation::find($cId);
                if ($c) {
                    broadcast(new MessageDelivered($c->workspace_id, $cId, now()->toIso8601String()))->toOthers();
                }
            }
        }

        // for Group / Project Conversations
        $groupConversations = Conversation::whereIn('id', $conversationIds)
            ->where('type', '!=', 'direct')
            ->get();

        if ($groupConversations->isNotEmpty()) {
            $undeliveredGroupMessages = Message::whereIn('conversation_id', $groupConversations->pluck('id'))
                ->where('user_id', '!=', $userId)
                ->whereNull('delivered_at')
                ->get();

            foreach ($undeliveredGroupMessages as $message) {
                // Get all other active participants in this group (excluding the sender)
                $otherMemberIds = ConversationParticipant::where('conversation_id', $message->conversation_id)
                    ->where('user_id', '!=', $message->user_id)
                    ->where('is_active', true)
                    ->pluck('user_id');

                $otherMembersCount = $otherMemberIds->count();

                if ($otherMembersCount > 0) {
                    // Count how many members have opened/read the message
                    $readCount = ConversationReadState::where('conversation_id', $message->conversation_id)
                        ->whereIn('user_id', $otherMemberIds)
                        ->where('read_at', '>=', $message->created_at)
                        ->count();

                    // If ALL other members have read state recorded -> mark group message as delivered!
                    if ($readCount >= $otherMembersCount) {
                        $message->update(['delivered_at' => now()]);
                        $c = Conversation::find($message->conversation_id);
                        if ($c) {
                            broadcast(new MessageDelivered($c->workspace_id, $message->conversation_id, now()->toIso8601String()))->toOthers();
                        }
                    }
                }
            }
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * READ: Called when user opens a specific chat room.
     */
    public function markAsRead(int $conversationId)
    {
        $userId = auth()->id();
        $conversation = Conversation::find($conversationId);
        $workspaceId = $conversation ? $conversation->workspace_id : 0;

        // 1. Update read_at timestamp for the current user
        ConversationReadState::updateOrCreate(
            ['user_id' => $userId, 'conversation_id' => $conversationId],
            ['read_at' => now()]
        );

        // 2. Find latest message in this chat
        $latestMessage = Message::where('conversation_id', $conversationId)
            ->latest()
            ->first();

        if ($latestMessage) {
            // Count total other active participants in this chat (excluding the message sender)
            $otherParticipantsCount = ConversationParticipant::where('conversation_id', $conversationId)
                ->where('user_id', '!=', $latestMessage->user_id)
                ->where('is_active', true)
                ->count();

            if ($otherParticipantsCount > 0) {
                // Count how many of those participants have read_at >= latest message created_at
                $readStatesCount = ConversationReadState::where('conversation_id', $conversationId)
                    ->where('user_id', '!=', $latestMessage->user_id)
                    ->where('read_at', '>=', $latestMessage->created_at)
                    ->count();

                // ONLY broadcast MessageRead if ALL recipients have read the latest message!
                if ($readStatesCount >= $otherParticipantsCount) {
                    broadcast(new MessageRead($workspaceId, $conversationId, $userId, now()->toIso8601String()))->toOthers();
                }
            }
        }

        return response()->json(['status' => 'ok']);
    }
    public function index(): JsonResponse
    {
        $userId = auth()->id();

        // 1. جلب جميع المحادثات
        $conversations = Conversation::query()
            ->where(function ($query) use ($userId) {
                $query->where('type', 'project')
                    ->orWhereHas('participants', function ($q) use ($userId) {
                        $q->where('user_id', $userId)->where('is_active', true);
                    });
            })
            ->with(['project:id,name', 'participants.user:id,name,avatar_url,custom_status,username'])
            ->get();

        // 2. تحويل البيانات وإضافة الحقول الجديدة (unread_count و last_message)
        $conversationData = $conversations->map(function ($conversation) use ($userId) {

            // جلب حالة القراءة من الجدول (بدون إنشاء سجل تاريخه الآن)
            $readStatus = ConversationReadState::where('user_id', $userId)
                ->where('conversation_id', $conversation->id)
                ->first();

            // تاريخ آخر قراءة (إذا لم يفتحها أبداً يكون null)
            $lastReadAt = $readStatus ? $readStatus->read_at : null;

            // حساب عدد الرسائل غير المقروءة
            $unreadCount = Message::where('conversation_id', $conversation->id)
                ->where('user_id', '!=', $userId) // استثناء رسائل المستخدم نفسه
                ->when($lastReadAt, function ($query) use ($lastReadAt) {
                    $query->where('created_at', '>', $lastReadAt);
                })
                ->count();

            // جلب آخر رسالة في المحادثة
            $lastMessage = $conversation->messages()
                ->with('sender:id,name,avatar_url,username')
                ->latest()
                ->first();



            // دمج البيانات لإرجاعها في الـ JSON
            $participant = $conversation->participants->firstWhere('user_id', $userId);
            $mutedUntil = $participant ? $participant->muted_until : null;
            $isMuted = $mutedUntil ? $mutedUntil->isFuture() : false;

            $isBlockedByMe = false;
            $isBlockedByPartner = false;

            if ($conversation->type === "direct") {
                $partnerParticipant = ConversationParticipant::where('conversation_id', $conversation->id)
                    ->where('user_id', '!=', $userId)
                    ->where('is_active', true)
                    ->first();

                $partnerId = $partnerParticipant ? $partnerParticipant->user_id : null;

                if ($partnerId) {
                    $isBlockedByMe = BlockedUser::where("workspace_id", $conversation->workspace_id)
                        ->where("blocker_id", $userId)
                        ->where("blocked_id", $partnerId)
                        ->exists();

                    $isBlockedByPartner = BlockedUser::where("workspace_id", $conversation->workspace_id)
                        ->where("blocker_id", $partnerId)
                        ->where("blocked_id", $userId)
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

        // 3. إرجاع $conversationData المجهزة بدلاً من $conversations
        return ApiResponse::success('Conversations retrieved successfully.', $conversationData->toArray());
    }
    /**
     * Create a new Direct Message or Group conversation.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'type' => 'required|in:direct,group',
            'name' => 'required_if:type,group|nullable|string|max:150',
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        if ($request->type === 'direct') {
            $targetUserId = $request->user_ids[0];
            $currentUserId = auth()->id();

            // Prevent messaging yourself
            if ((int) $targetUserId === (int) $currentUserId) {
                return ApiResponse::error('Cannot start a DM with yourself.', 'INVALID_PARTICIPANT', [], 400);
            }
            // SELECT * FROM `conversation`
            // WHERE `type` = 'direct'
            //   AND TRUE
            //   AND FALSE;
            // Final Sentence: Because of the AND operator, 
            // TRUE AND FALSE simplifies to FALSE. So this row is skipped!



            // Check if a direct message session already exists
            $existing = Conversation::where('type', 'direct')
                ->whereHas('participants', function ($q) use ($currentUserId) {
                    $q->where('user_id', $currentUserId);
                })
                ->whereHas('participants', function ($q) use ($targetUserId) {
                    $q->where('user_id', $targetUserId);
                })
                ->first();

            if ($existing) {
                // Check if the conversation is active
                $participant = $existing->participants()->where('user_id', $currentUserId)->first();
                if ($participant && !$participant->is_active) {
                    // Re-activate the conversation
                    $participant->update(['is_active' => true, 'joined_at' => now()]);
                }
                return ApiResponse::success('Conversation retrieved successfully.', $existing->load('participants.user:id,name,avatar_url')->toArray());
            }
        }

        // Create the Conversation (BelongsToWorkspace trait auto-injects active workspace_id)
        $conversation = Conversation::create([
            'type' => $request->type,
            'name' => $request->type === 'group' ? $request->name : null,
        ]);

        // Add participants to the conversation
        $participantIds = array_unique(array_merge($request->user_ids, [auth()->id()]));
        foreach ($participantIds as $uid) {
            ConversationParticipant::create([
                'conversation_id' => $conversation->id,
                'user_id' => $uid,
                'role' => $uid === auth()->id() ? 'owner' : 'participant',
                'is_active' => true,
                'joined_at' => now(),
            ]);
        }

        return ApiResponse::success('Conversation created successfully.', $conversation->load('participants.user:id,name,avatar_url')->toArray(), [], 201);
    }


    public function searchMessages($conversationId, Request $request): JsonResponse
    {

        $request->validate([
            'q' => 'required|string|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);

        $search = $request->query('q'); // URL: /messages/search/q=shoes
        $page = $request->query('page', 1); // URL: /messages/search/q=shoes


        $conversation = Conversation::findOrFail($conversationId);

        $participant = ConversationParticipant::where('conversation_id', $conversation->id)
            ->where('user_id', auth()->id())
            ->where('is_active', true)
            ->first();

        // Security check: non-project chats require an active participant
        if ($conversation->type !== 'project' && !$participant) {
            return ApiResponse::error('Unauthorized.', 'UNAUTHORIZED_ACCESS', [], 403);
        }

        $userId = auth()->id();
        $messages = Message::where('conversation_id', $conversationId)
            ->visibleToParticipant($participant)
            ->where('body', 'LIKE', "%{$search}%")
            ->withExists([
                'starredByUsers as is_starred' => function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                }
            ])
            ->with(['sender:id,name,avatar_url', 'parent.sender:id,name', 'reactions.user:id,name', 'attachments'])
            ->orderBy('created_at', 'desc')
            ->paginate(30);

        return ApiResponse::success('Messages retrieved successfully.', $messages->toArray());


    }
    /**
     * Get paginated messages for a conversation.
     */
    /**
     * Get paginated messages for a conversation.
     */
    public function getMessages(int $id, Request $request): JsonResponse
    {
        $request->validate([
            'around_message_id' => 'nullable|integer|min:1',
            'after_message_id' => 'nullable|integer|min:1',
            'before_message_id' => 'nullable|integer|min:1',
        ]);

        $aroundMessageId = $request->query('around_message_id');
        $afterMessageId = $request->query('after_message_id');
        $beforeMessageId = $request->query('before_message_id');

        $conversation = Conversation::findOrFail($id);

        // Security check: Make sure the user is a participant of the conversation
        if ($conversation->type !== 'project') {
            $isParticipant = ConversationParticipant::where('conversation_id', $conversation->id)
                ->where('user_id', auth()->id())
                ->where('is_active', true)
                ->exists();

            if (!$isParticipant) {
                return ApiResponse::error('Unauthorized.', 'UNAUTHORIZED_ACCESS', [], 403);
            }
        }

        $responseData = [];
        $participant = ConversationParticipant::where('conversation_id', $id)
            ->where('user_id', auth()->id())
            ->where('is_active', true)
            ->first();

        $userId = auth()->id();
        if ($aroundMessageId) {
            // Case 1: Search Jump context slice (around a target message)
            $anchorMessage = Message::where('conversation_id', $id)
                ->visibleToParticipant($participant)
                ->withExists([
                    'starredByUsers as is_starred' => function ($q) use ($userId) {
                        $q->where('user_id', $userId);
                    }
                ])
                ->where('id', $aroundMessageId)
                ->first();

            if (!$anchorMessage) {
                return ApiResponse::error('Message not found.', 'MESSAGE_NOT_FOUND', [], 404);
            }

            // Get 15 messages before and 15 messages after
            $beforeMessages = Message::where("conversation_id", $id)
                ->visibleToParticipant($participant)
                ->where("created_at", "<", $anchorMessage->created_at)
                ->withExists([
                    'starredByUsers as is_starred' => function ($q) use ($userId) {
                        $q->where('user_id', $userId);
                    }
                ])->orderBy('created_at', "desc")
                ->limit(15)
                ->get();

            $afterMessages = Message::where("conversation_id", $id)
                ->visibleToParticipant($participant)
                ->where("created_at", ">", $anchorMessage->created_at)
                ->withExists([
                    'starredByUsers as is_starred' => function ($q) use ($userId) {
                        $q->where('user_id', $userId);
                    }
                ])
                ->with(['sender:id,name,avatar_url', 'parent.sender:id,name', 'reactions.user:id,name', 'attachments'])
                ->orderBy('created_at', "asc")
                ->limit(15)
                ->get();

            $anchorMessage->load(['sender:id,name,avatar_url', 'parent.sender:id,name', 'reactions.user:id,name', 'attachments', 'mentions.mentionedUser']);

            $merged = $beforeMessages->merge([$anchorMessage])->merge($afterMessages);
            $sortedMessages = $merged->sortBy('created_at')->values();

            $firstMsg = $sortedMessages->first();
            $lastMsg = $sortedMessages->last();

            $hasMoreMessagesBefore = $firstMsg ? Message::where("conversation_id", $id)
                ->visibleToParticipant($participant)
                ->where("created_at", "<", $firstMsg->created_at)
                ->exists() : false;

            $hasMoreMessagesAfter = $lastMsg ? Message::where("conversation_id", $id)
                ->visibleToParticipant($participant)
                ->where("created_at", ">", $lastMsg->created_at)
                ->exists() : false;

            $responseData = [
                'data' => $sortedMessages->toArray(),
                'has_before' => $hasMoreMessagesBefore,
                'has_after' => $hasMoreMessagesAfter,
            ];

        } else if ($beforeMessageId) {
            // Case 2: Load older messages relative to a scroll-up anchor
            $beforeMessage = Message::findOrFail($beforeMessageId);

            $beforeMessagesList = Message::where("conversation_id", $id)
                ->visibleToParticipant($participant)
                ->where("created_at", "<", $beforeMessage->created_at)
                ->withExists([
                    'starredByUsers as is_starred' => function ($q) use ($userId) {
                        $q->where('user_id', $userId);
                    }
                ])
                ->with(['sender:id,name,avatar_url', 'parent.sender:id,name', 'reactions.user:id,name', 'attachments', 'mentions.mentionedUser'])
                ->orderBy('created_at', "desc")
                ->limit(30)
                ->get();

            $sortedMessages = $beforeMessagesList->sortBy('created_at')->values();
            $firstMsg = $sortedMessages->first();

            $hasMoreMessagesBefore = $firstMsg ? Message::where("conversation_id", $id)
                ->visibleToParticipant($participant)
                ->where("created_at", "<", $firstMsg->created_at)
                ->exists() : false;

            $responseData = [
                'data' => $sortedMessages->toArray(),
                'has_before' => $hasMoreMessagesBefore,
                'has_after' => true,
            ];

        } else if ($afterMessageId) {
            // Case 3: Load newer messages relative to a scroll-down anchor
            $afterMessage = Message::findOrFail($afterMessageId);

            $afterMessagesList = Message::where("conversation_id", $id)
                ->visibleToParticipant($participant)
                ->where("created_at", ">", $afterMessage->created_at)
                ->withExists([
                    'starredByUsers as is_starred' => function ($q) use ($userId) {
                        $q->where('user_id', $userId);
                    }
                ])
                ->with(['sender:id,name,avatar_url', 'parent.sender:id,name', 'reactions.user:id,name', 'attachments', 'mentions.mentionedUser'])
                ->orderBy('created_at', "asc")
                ->limit(30)
                ->get();

            $sortedMessages = $afterMessagesList->sortBy('created_at')->values();
            $lastMsg = $sortedMessages->last();

            $hasMoreMessagesAfter = $lastMsg ? Message::where("conversation_id", $id)
                ->visibleToParticipant($participant)
                ->where("created_at", ">", $lastMsg->created_at)
                ->exists() : false;

            $responseData = [
                'data' => $sortedMessages->toArray(),
                'has_before' => true,
                'has_after' => $hasMoreMessagesAfter,
            ];

        } else {
            // Case 4: Default paginated load (latest messages first)
            $messages = Message::where('conversation_id', $id)
                ->visibleToParticipant($participant)
                ->withExists([
                    'starredByUsers as is_starred' => function ($q) use ($userId) {
                        $q->where('user_id', $userId);
                    }
                ])
                ->with(['sender:id,name,avatar_url', 'parent.sender:id,name', 'reactions.user:id,name', 'attachments', 'mentions.mentionedUser'])
                ->orderBy('created_at', 'desc')
                ->paginate(30);

            $sortedMessages = collect($messages->items())->sortBy('created_at')->values();

            $responseData = [
                'data' => $sortedMessages->toArray(),
                'has_before' => $messages->hasMorePages(),
                'has_after' => false,
            ];
        }

        // Global Post-retrieval Logic: Mark conversation read state and clear notifications
        ConversationReadState::updateOrCreate(
            // 1. Search criteria (find existing record)
            [
                'user_id' => auth()->id(),
                'conversation_id' => $id,
            ],
            // 2. Values to set/update on every request
            [
                'read_at' => now(),
            ]
        );

        Notification::query()
            ->where('user_id', auth()->id())
            ->where('type', NotificationType::CHAT_MESSAGE)
            ->where('data->conversationId', $id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
        // auto pagination : https://medium.com/@webdevsimplified/implement-infinite-scrolling-in-laravel-with-livewire-5c10412f1e24


        //   "next_page_url": "http://localhost:8000/api/conversations/2/messages?page=2",
        //  "prev_page_url": null,
        //  "per_page": 30,
        //  "total": 150

        return ApiResponse::success('Messages retrieved successfully.', $responseData);
    }

    /**
     * Send a new message and broadcast it.
     */
    public function sendMessage(Request $request, int $id): JsonResponse
    {
        $workspaceId = $this->workspaceContextService->currentWorkspaceId();
        $conversation = Conversation::findOrFail($id);

        // Security check
        if ($conversation->type !== 'project') {
            $isParticipant = ConversationParticipant::where('conversation_id', $conversation->id)
                ->where('user_id', auth()->id())
                ->where('is_active', true)
                ->exists();

            if (!$isParticipant) {
                return ApiResponse::error('Unauthorized.', 'UNAUTHORIZED_ACCESS', [], 403);
            }
        }



        // Reactivate any inactive participant in direct messages only (so the DM reappears in their sidebar)
        if ($conversation->type === 'direct') {
            ConversationParticipant::where('conversation_id', $conversation->id)
                ->where('is_active', false)
                ->update(['is_active' => true, "joined_at" => now()]);



            $partnerParticipant = ConversationParticipant::where('conversation_id', $conversation->id)
                ->where('user_id', '!=', auth()->id())
                ->where('is_active', true)
                ->first();

            $partnerId = $partnerParticipant ? $partnerParticipant->user_id : null;

            if (!$partnerId) {
                return ApiResponse::error('Partner not found.', 'PARTNER_NOT_FOUND', [], 404);
            }

            $isBlocked = BlockedUser::where("workspace_id", $workspaceId)
                ->where(function ($query) use ($partnerId) {
                    $query->where(function ($q1) use ($partnerId) {
                        $q1->where("blocked_id", $partnerId)->where("blocker_id", auth()->id());
                    })->orWhere(function ($q2) use ($partnerId) {
                        $q2->where("blocked_id", auth()->id())->where("blocker_id", $partnerId);
                    });
                })
                ->exists();

            if ($isBlocked) {
                return ApiResponse::error('Message cannot be delivered. User block relationship is active.', 'USER_BLOCKED', [], 403);
            }
        }

        $participantsIds = ConversationParticipant::where('conversation_id', $conversation->id)->where('is_active', true)->pluck('user_id')->toArray();
        // if auth().id() is not in participantsIds
        if (in_array(auth()->id(), $participantsIds)) {

            //  remove from 1st array the elements exist in the other array
            $participantsIds = array_diff($participantsIds, [auth()->id()]);
        }
        $requiredBody = true;
        if ($request->has('attachments') && count($request->attachments) > 0) {
            $requiredBody = false;
        }


        $request->validate([
            'body' => $requiredBody ? 'required|string' : 'nullable|string',
            'message_id' => 'nullable|exists:messages,id', // Threading reply ID
            'attachments' => 'nullable|array',
            'attachments.*' => 'file', // check every attachment is "file"
        ]);

        // Create the Message (BelongsToWorkspace auto-injects active workspace_id)
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'message_id' => $request->message_id,
            'user_id' => auth()->id(),
            'body' => $request->body ?? '',
        ]);

        if ($request->hasFile('attachments')) {
            $this->messageAttachmentService->upload($message, $request->file('attachments'));
        }

        // STEP 1: Process & save @mentions in DB FIRST (before eager loading & broadcasting).
        // This guarantees mention records exist so FormattedBody can render blue badges live.
        $workspaceId = $this->workspaceContextService->currentWorkspaceId();
        $this->handleMessageMentions($message, $workspaceId);

        // STEP 2: Re-query message with fresh eager-loaded sender, parent, attachments, and mentions.
        // Eager-loading mentions.mentionedUser ensures FormattedBody calculates formatted HTML with 0 N+1 queries.
        $message = Message::with([
            'sender:id,name,avatar_url,username',
            'parent.sender:id,name',
            'reactions.user:id,name',
            'attachments',
            'mentions.mentionedUser'
        ])->find($message->id);

        // STEP 3: Broadcast live WebSocket event AFTER mentions are saved and eager-loaded.
        // Online teammates receive the message with pre-calculated blue @mention badges live instantly!
        broadcast(new MessageSent($message))->toOthers();

        // Update read_at for the sender immediately
        ConversationReadState::updateOrCreate(
            ['user_id' => auth()->id(), 'conversation_id' => $conversation->id],
            ['read_at' => now()]
        );

        // Fetch all active participants to send notifications (with is_muted flag for client-side suppression)
        $allParticipants = ConversationParticipant::where('conversation_id', $conversation->id)
            ->where('is_active', true)
            ->get();

        foreach ($allParticipants as $participant) {
            if ($participant->user_id == auth()->id()) {
                continue;
            }

            $isMuted = $participant->muted_until && $participant->muted_until->isFuture();

            $this->notificationService->send(
                $workspaceId,
                $participant->user_id,
                NotificationType::CHAT_MESSAGE,
                [
                    'message' => $message,
                    'conversation' => $conversation,
                    'conversationId' => $conversation->id,
                    'senderId' => auth()->id(),
                    'workspaceId' => $workspaceId,
                    'is_muted' => $isMuted,
                ]
            );
        }


        return ApiResponse::success('Message sent successfully. workspace id: ' . $workspaceId, $message->toArray(), [], 201);
    }

    /**
     * Toggle an emoji reaction on a message.
     * Each user can have ONLY 1 reaction per message (Unique on message_id, user_id).
     */
    public function toggleReaction(Request $request, int $id, int $messageId): JsonResponse
    {
        $request->validate([
            'emoji' => 'required|string|max:32',
        ]);

        $conversation = Conversation::findOrFail($id);

        // Security check
        if ($conversation->type !== 'project') {
            $isParticipant = ConversationParticipant::where('conversation_id', $conversation->id)
                ->where('user_id', auth()->id())
                ->where('is_active', true)
                ->exists();

            if (!$isParticipant) {
                return ApiResponse::error('Unauthorized.', 'UNAUTHORIZED_ACCESS', [], 403);
            }
        }

        $message = Message::where('conversation_id', $conversation->id)->findOrFail($messageId);

        $existing = MessageReaction::where('message_id', $message->id)
            ->where('user_id', auth()->id())
            ->first();

        if ($existing) {
            if ($existing->emoji === $request->emoji) {
                // Same emoji clicked -> remove reaction (toggle off)
                $existing->delete();
            } else {
                // Different emoji clicked -> switch to new emoji
                $existing->update(['emoji' => $request->emoji]);
            }
        } else {
            // No reaction yet -> create new reaction
            MessageReaction::create([
                'message_id' => $message->id,
                'user_id' => auth()->id(),
                'emoji' => $request->emoji,
            ]);
        }

        // Fetch fresh eager-loaded reactions for this message
        $reactions = MessageReaction::where('message_id', $message->id)
            ->with('user:id,name')
            ->get()
            ->toArray();

        $workspaceId = $this->workspaceContextService->currentWorkspaceId();

        // Broadcast real-time reaction update to other participants in this conversation
        broadcast(new MessageReactionUpdated($workspaceId, $conversation->id, $message->id, $reactions))->toOthers();

        return ApiResponse::success('Reaction updated successfully.', $reactions);
    }



    public function deleteForMe(Request $request, int $conversationId, int $messageId)
    {

        $userId = auth()->id();
        $message = Message::where('conversation_id', $conversationId)->findOrFail($messageId);

        $isParticipant = ConversationParticipant::where('conversation_id', $conversationId)
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->exists();

        if (!$userId || !$isParticipant) {
            return ApiResponse::error('You are not authorized to delete this message.', 'UNAUTHORIZED_ACCESS', [], 403);
        }

        $deleteForMe = MessageDeletion::create([
            'message_id' => $messageId,
            'user_id' => $userId
        ]);
        return ApiResponse::success('Message deleted successfully.', $deleteForMe->toArray());

    }
    public function deleteForAll(Request $request, int $conversationId, int $messageId)
    {
        $userId = auth()->id();
        $message = Message::where('conversation_id', $conversationId)->findOrFail($messageId);

        $isParticipant = ConversationParticipant::where('conversation_id', $conversationId)
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->exists();

        if (!$userId || !$isParticipant) {
            return ApiResponse::error('You are not authorized to delete this message.', 'UNAUTHORIZED_ACCESS', [], 403);
        }

        $isSender = $message->user_id === $userId;
        $isAdmin = ConversationParticipant::where('conversation_id', $conversationId)
            ->where('user_id', $userId)
            ->whereIn('role', ['admin', 'Admin'])
            ->exists();

        if (!$isSender && !$isAdmin) {
            return ApiResponse::error('You are not authorized to delete this message.', 'UNAUTHORIZED_ACCESS', [], 403);
        }

        if ($isSender && !$isAdmin) {
            $maxTimeToDelete = env('MAX_TIME_FOR_DELETE_MESSAGE', 15);
            if ($message->created_at->diffInMinutes(now()) > $maxTimeToDelete) {
                return ApiResponse::error('You cannot delete messages after ' . $maxTimeToDelete . ' minutes.', 'MESSAGE_CANNOT_BE_DELETED', [], 403);
            }
        }

        $message->update([
            'isDeleted' => true,
            'deletedById' => $userId,
            'body' => ''
        ]);

        $this->deleteMessageMentions($message->id);

        broadcast(new MessageDeleted($message))->toOthers();

        return ApiResponse::success('Message deleted successfully.', $message->toArray());
    }
    public function update(Request $request, int $conversationId, int $messageId)
    {
        $request->validate([
            'body' => 'required|string'
        ]);


        $message = Message::where('conversation_id', $conversationId)->findOrFail($messageId);

        if ($message->isDeleted || $message->deletedById) {
            return ApiResponse::error('Message cannot be updated.', 'MESSAGE_CANNOT_BE_UPDATED', [], 403);
        }

        $maxTimeToDelete = env('MAX_TIME_FOR_UPDATE_MESSAGE');

        if ($message->created_at->diffInMinutes(now()) > $maxTimeToDelete) {
            return ApiResponse::error('Message cannot be updated.', 'MESSAGE_CANNOT_BE_UPDATED', [], 403);
        }

        $userId = auth()->id();
        $isParticipant = ConversationParticipant::where('conversation_id', $conversationId)
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->exists();

        if (!$userId || $message->user_id !== $userId || !$isParticipant) {
            return ApiResponse::error('You are not authorized to update this message.', 'UNAUTHORIZED_ACCESS', [], 403);
        }


        $message->update([
            'isEdited' => true,
            'body' => $request->body,
        ]);

        $workspaceId = $this->workspaceContextService->currentWorkspaceId();
        $this->syncMessageMentions($message, $request->body, $workspaceId);

        broadcast(new MessageUpdated($message))->toOthers();

        return ApiResponse::success('Message updated successfully.', $message->toArray());
    }

    /**
     * Handle processing @mentions for a newly sent chat message.
     */
    private function handleMessageMentions(Message $message, int $workspaceId): void
    {
        if (empty($message->body)) {
            return;
        }

        // Mentions are only allowed in project or group conversations
        $conversation = $message->conversation;
        if ($conversation && $conversation->type === 'direct') {
            return;
        }

        $usernames = $this->mentionService->extractUsernames($message->body);
        $users = $this->mentionService->resolveUsers($usernames, $workspaceId);

        $this->mentionService->store(
            users: $users,
            sourceType: 'message',
            sourceId: $message->id,
            workspaceId: $workspaceId,
            mentionedBy: auth()->id()
        );
    }

    /**
     * Sync @mentions when a chat message body is edited.
     */
    private function syncMessageMentions(Message $message, string $newBody, int $workspaceId): void
    {
        // Mentions are only allowed in project or group conversations
        $conversation = $message->conversation;
        if ($conversation && $conversation->type === 'direct') {
            return;
        }

        $this->mentionService->syncForSource(
            content: $newBody,
            sourceType: 'message',
            sourceId: $message->id,
            workspaceId: $workspaceId,
            mentionedBy: auth()->id()
        );
    }

    /**
     * Remove mention records when a chat message is deleted.
     */
    private function deleteMessageMentions(int $messageId): void
    {
        $this->mentionService->deleteBySource('message', $messageId);
    }

    /**
     * Get sidebar info (categorized media/docs, participants, groups in common).
     */
    public function sidebarInfo(int $conversationId): JsonResponse
    {
        $userId = auth()->id();
        $workspaceId = $this->workspaceContextService->currentWorkspaceId();

        $conversation = Conversation::where('workspace_id', $workspaceId)
            ->with([
                'project:id,name',
                'participants.user:id,name,email,avatar_url,custom_status',
            ])
            ->findOrFail($conversationId);

        $isParticipant = $conversation->participants()
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->exists();

        if (!$isParticipant && $conversation->type !== 'project') {
            return ApiResponse::error('You are not authorized to view this conversation info.', 'UNAUTHORIZED_ACCESS', [], 403);
        }

        // Fetch attachments via HasManyThrough
        $allAttachments = $conversation->attachments()
            ->select('message_attachments.*')
            ->latest()
            ->get()
            ->map(function ($att) {
                return [
                    'id' => $att->id,
                    'message_id' => $att->message_id,
                    'original_name' => $att->original_name,
                    'file_type' => $att->file_type,
                    'file_size' => $att->file_size,
                    'download_url' => $att->download_url,
                    'created_at' => $att->created_at,
                ];
            });

        $mediaAttachments = $allAttachments->filter(function ($att) {
            $type = strtolower($att['file_type'] ?? '');
            $name = strtolower($att['original_name'] ?? '');
            return str_starts_with($type, 'image/') ||
                str_starts_with($type, 'video/') ||
                str_starts_with($type, 'audio/') ||
                str_contains($name, 'voice_note');
        })->values();

        $docAttachments = $allAttachments->filter(function ($att) {
            $type = strtolower($att['file_type'] ?? '');
            $name = strtolower($att['original_name'] ?? '');
            $isMedia = str_starts_with($type, 'image/') ||
                str_starts_with($type, 'video/') ||
                str_starts_with($type, 'audio/') ||
                str_contains($name, 'voice_note');
            return !$isMedia;
        })->values();

        // Groups in common for direct messages
        $groupsInCommon = [];
        if ($conversation->type === 'direct') {
            // because its direct, the partner is the other user in the conversation
            $partner = $conversation->participants->firstWhere('user_id', '!=', $userId);
            if ($partner) {
                // SELECT id, name, type, created_at 
                // FROM conversation
                // WHERE workspace_id = 12
                // AND type = 'group'
                // AND EXISTS ( -- هل ينتمي المستخدم (أنت) لهذه المجموعة؟
                //     SELECT 1 FROM conversation_participants 
                //     WHERE conversation_id = conversation.id AND user_id = 5 AND is_active = 1
                //   )
                // AND EXISTS ( -- وهل ينتمي المستخدم الثاني (صديقك) لنفس هذه المجموعة أيضاً؟
                //     SELECT 1 FROM conversation_participants 
                //     WHERE conversation_id = conversation.id AND user_id = 9 AND is_active = 1
                //   );

                $partnerUserId = $partner->user_id;
                $groupsInCommon = Conversation::where('workspace_id', $workspaceId)
                    ->where('type', 'group')
                    // whereHas("relation", CallBack Function)
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
            'name' => 'nullable|string|max:150',
            'description' => 'nullable|string|max:1000',
        ]);

        $user = auth()->user();
        $conversation = Conversation::findOrFail($id);

        if ($conversation->type === 'direct') {
            return ApiResponse::error('Cannot update details of a direct message.', 'INVALID_TYPE', [], 400);
        }

        // Check if current user is an active participant with owner or admin role
        $participant = ConversationParticipant::where('conversation_id', $conversation->id)
            ->where('user_id', auth()->id())
            ->where('is_active', true)
            ->first();

        if (!$participant || !in_array($participant->role, ['owner', 'admin'])) {
            return ApiResponse::error('Only group admins and owners can update group details.', 'FORBIDDEN', [], 403);
        }

        $updateData = [];
        if ($request->has('name')) {
            $updateData['name'] = $request->name;
        }
        if ($request->has('description')) {
            $updateData['description'] = $request->description;
        }

        if (!empty($updateData)) {
            $conversation->update($updateData);
        }

        return ApiResponse::success('Group details updated successfully.', $conversation->fresh()->toArray());
    }

    /**
     * Toggle Star / Unstar on a specific message for current user.
     */
    public function toggleStarMessage(int $id, int $messageId): JsonResponse
    {
        $userId = auth()->id();
        $workspaceId = $this->workspaceContextService->currentWorkspaceId();

        $message = Message::where('conversation_id', $id)
            ->where('id', $messageId)
            ->firstOrFail();

        $starred = StarredMessage::where('conversation_id', $id)
            ->where('message_id', $messageId)
            ->where('user_id', $userId)
            ->first();

        if ($starred) {
            $starred->delete();
            return ApiResponse::success('Message unstarred successfully.', ['is_starred' => false]);
        }

        StarredMessage::create([
            'workspace_id' => $workspaceId,
            'conversation_id' => $id,
            'user_id' => $userId,
            'message_id' => $messageId,
        ]);

        return ApiResponse::success('Message starred successfully.', ['is_starred' => true]);
    }

    /**
     * Get all starred messages for current user in a conversation.
     */
    public function getStarredMessages(int $id): JsonResponse
    {
        $userId = auth()->id();



        $starredMessages = Message::query()
            ->where('conversation_id', $id)
            ->whereHas('starredByUsers', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            })
            ->with(['sender:id,name,avatar_url,username', 'attachments', 'reactions'])
            ->latest()
            ->get()
            ->map(function ($msg) {
                $msgArray = $msg->toArray();
                $msgArray['is_starred'] = true;
                return $msgArray;
            });

        return ApiResponse::success('Starred messages retrieved successfully.', $starredMessages->toArray());
    }
}

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

class ConversationController extends Controller
{

    private WorkspaceContextService $workspaceContextService;
    private NotificationService $notificationService;
    private MessageAttachmentService $messageAttachmentService;
    public function __construct(
        WorkspaceContextService $contextService,
        NotificationService $notificationService,
        MessageAttachmentService $messageAttachmentService
    ) {
        $this->workspaceContextService = $contextService;
        $this->notificationService = $notificationService;
        $this->messageAttachmentService = $messageAttachmentService;
    }

    /**
     * List all conversations (DMs & Projects) in the current workspace.
     */
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
            ->with(['project:id,name', 'participants.user:id,name,avatar_url'])
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
            $data = $conversation->toArray();
            $data['unread_count'] = $unreadCount;
            $data['last_message'] = $lastMessage;

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


        $isParticipant = ConversationParticipant::where('conversation_id', $conversationId)
            ->where('user_id', auth()->id())
            ->where('is_active', true)
            ->exists();

        if (!$isParticipant) {
            return ApiResponse::error('Unauthorized.', 'UNAUTHORIZED_ACCESS', [], 403);
        }

        $messages = Message::where('conversation_id', $conversationId)
            ->where('body', 'LIKE', "%{$search}%")
            ->whereDoesntHave('deletions', function ($query) {
                $query->where('user_id', auth()->id());
            })
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

        if ($aroundMessageId) {
            // Case 1: Search Jump context slice (around a target message)
            $anchorMessage = Message::where('conversation_id', $id)
                ->where('id', $aroundMessageId)
                ->whereDoesntHave('deletions', function ($q) {
                    $q->where('user_id', auth()->id());
                })
                ->first();

            if (!$anchorMessage) {
                return ApiResponse::error('Message not found.', 'MESSAGE_NOT_FOUND', [], 404);
            }

            // Get 15 messages before and 15 messages after by auto-incrementing ID
            $beforeMessages = Message::where("conversation_id", $id)
                ->where("id", "<", $anchorMessage->id)
                ->whereDoesntHave('deletions', function ($q) {
                    $q->where('user_id', auth()->id());
                })
                ->with(['sender:id,name,avatar_url', 'parent.sender:id,name', 'reactions.user:id,name', 'attachments'])
                ->orderBy('id', "desc")
                ->limit(15)
                ->get();

            $afterMessages = Message::where("conversation_id", $id)
                ->where("id", ">", $anchorMessage->id)
                ->whereDoesntHave('deletions', function ($q) {
                    $q->where('user_id', auth()->id());
                })
                ->with(['sender:id,name,avatar_url', 'parent.sender:id,name', 'reactions.user:id,name', 'attachments'])
                ->orderBy('id', "asc")
                ->limit(15)
                ->get();

            $anchorMessage->load(['sender:id,name,avatar_url', 'parent.sender:id,name', 'reactions.user:id,name', 'attachments']);

            $merged = $beforeMessages->merge([$anchorMessage])->merge($afterMessages);
            $sortedMessages = $merged->sortBy('id')->values();

            $firstMsg = $sortedMessages->first();
            $lastMsg = $sortedMessages->last();

            $hasMoreMessagesBefore = $firstMsg ? Message::where("conversation_id", $id)
                ->where("id", "<", $firstMsg->id)
                ->whereDoesntHave('deletions', function ($q) {
                    $q->where('user_id', auth()->id());
                })->exists() : false;

            $hasMoreMessagesAfter = $lastMsg ? Message::where("conversation_id", $id)
                ->where("id", ">", $lastMsg->id)
                ->whereDoesntHave('deletions', function ($q) {
                    $q->where('user_id', auth()->id());
                })->exists() : false;

            $responseData = [
                'data' => $sortedMessages->toArray(),
                'has_before' => $hasMoreMessagesBefore,
                'has_after' => $hasMoreMessagesAfter,
            ];

        } else if ($beforeMessageId) {
            // Case 2: Load older messages relative to a scroll-up anchor
            $beforeMessage = Message::findOrFail($beforeMessageId);

            $beforeMessagesList = Message::where("conversation_id", $id)
                ->where("id", "<", $beforeMessage->id)
                ->whereDoesntHave('deletions', function ($q) {
                    $q->where('user_id', auth()->id());
                })
                ->with(['sender:id,name,avatar_url', 'parent.sender:id,name', 'reactions.user:id,name', 'attachments'])
                ->orderBy('id', "desc")
                ->limit(30)
                ->get();

            $sortedMessages = $beforeMessagesList->sortBy('id')->values();
            $firstMsg = $sortedMessages->first();

            $hasMoreMessagesBefore = $firstMsg ? Message::where("conversation_id", $id)
                ->where("id", "<", $firstMsg->id)
                ->whereDoesntHave('deletions', function ($q) {
                    $q->where('user_id', auth()->id());
                })->exists() : false;

            $responseData = [
                'data' => $sortedMessages->toArray(),
                'has_before' => $hasMoreMessagesBefore,
                'has_after' => true,
            ];

        } else if ($afterMessageId) {
            // Case 3: Load newer messages relative to a scroll-down anchor
            $afterMessage = Message::findOrFail($afterMessageId);

            $afterMessagesList = Message::where("conversation_id", $id)
                ->where("id", ">", $afterMessage->id)
                ->whereDoesntHave('deletions', function ($q) {
                    $q->where('user_id', auth()->id());
                })
                ->with(['sender:id,name,avatar_url', 'parent.sender:id,name', 'reactions.user:id,name', 'attachments'])
                ->orderBy('id', "asc")
                ->limit(30)
                ->get();

            $sortedMessages = $afterMessagesList->sortBy('id')->values();
            $lastMsg = $sortedMessages->last();

            $hasMoreMessagesAfter = $lastMsg ? Message::where("conversation_id", $id)
                ->where("id", ">", $lastMsg->id)
                ->whereDoesntHave('deletions', function ($q) {
                    $q->where('user_id', auth()->id());
                })->exists() : false;

            $responseData = [
                'data' => $sortedMessages->toArray(),
                'has_before' => true,
                'has_after' => $hasMoreMessagesAfter,
            ];

        } else {
            // Case 4: Default paginated load (latest messages first)
            $messages = $conversation->messages()
                ->whereDoesntHave('deletions', function ($query) {
                    $query->where('user_id', auth()->id());
                })
                ->with(['sender:id,name,avatar_url', 'parent.sender:id,name', 'reactions.user:id,name', 'attachments'])
                ->orderBy('id', 'desc')
                ->paginate(30);

            $sortedMessages = collect($messages->items())->sortBy('id')->values();

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

        // Re-query the created message with fresh eager-loaded sender, quoted parent message, and attachments details
        $message = Message::with(['sender:id,name,avatar_url,username', 'parent.sender:id,name', 'reactions.user:id,name', 'attachments'])->find($message->id);


        // Chat Room Channel: Shared by all participants in this conversation.
        // Because multiple users subscribe to this channel, the sender uses `->toOthers()` 
        // to prevent their browser from receiving their own message back.

        broadcast(new MessageSent($message))->toOthers();

        // Update read_at for the sender immediately
        ConversationReadState::updateOrCreate(
            ['user_id' => auth()->id(), 'conversation_id' => $conversation->id],
            ['read_at' => now()]
        );



        $workspaceId = $this->workspaceContextService->currentWorkspaceId();

        foreach ($participantsIds as $userId) {

            $this->notificationService->send(
                $workspaceId,
                $userId,
                NotificationType::CHAT_MESSAGE,
                [
                    'message' => $message,
                    'conversation' => $conversation,
                    'conversationId' => $conversation->id,
                    'senderId' => auth()->id(),
                    'workspaceId' => $workspaceId

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

        broadcast(new MessageUpdated($message))->toOthers();

        return ApiResponse::success('Message updated successfully.', $message->toArray());
    }





}

<?php

namespace App\Modules\Leads\Model;

use App\Modules\Workspace\Model\Concerns\BelongsToWorkspace;
use App\Modules\Workspace\Model\Workspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OutboundMessage extends Model
{
    use HasFactory;
    use BelongsToWorkspace;

    protected $table = 'outbound_messages';

    protected $fillable = [
        'workspace_id',
        'lead_id',
        'student_id',
        'provider',
        'template_key',
        'recipient_phone',
        'status',
        'provider_message_id',
        'payload',
        'response_payload',
        'error_message',
        'queued_at',
        'sent_at',
        'failed_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'response_payload' => 'array',
        'queued_at' => 'datetime',
        'sent_at' => 'datetime',
        'failed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class, 'workspace_id');
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'lead_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }
}

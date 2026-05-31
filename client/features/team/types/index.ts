export interface Member {
    id: string;
    workspace_id: string;
    user_id: string;
    role: {
        id: string;
        workspace_id: string;
        name: string;
        description?: string | null;
        is_system: boolean;
    };
    joined_at: string;
    user?: {
        id: string;
        name: string;
        username: string;
        email: string;
        avatar?: string;
    };
}

export interface SendInviteInput {
    email: string;
    role_id: number;
    message?: string;
}

export interface Pivot {
    role_id: number;
    permission_id: number;
    permission_key: string;
    created_at: string;
    updated_at: string;
}

export interface Permission {
    id: number;
    key: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    pivot?: Pivot;
}

export interface Role {
    id: number;
    workspace_id: number;
    name: string;
    slug: string;
    description: string;
    is_system: boolean;
    is_editable: boolean;
    is_deletable: boolean;
    created_at: string;
    updated_at: string;
    member_count: number;
    permissions: Permission[];
}

export type InviteStatus = "pending" | "accepted" | "expired" | "revoked" | "cancelled";

export interface InviteRoleSummary {
    id: number;
    name: string;
    slug: string;
}

export interface InviteInviterSummary {
    id: number;
    name: string;
    email: string;
}

export interface InviteWorkspaceSummary {
    id: number;
    name: string;
}

export interface Invite {
    id: number;
    workspace_id: number;
    workspace: InviteWorkspaceSummary | null;
    email: string;
    role_id: number | null;
    role: InviteRoleSummary | null;
    invited_by_user_id: number;
    inviter: InviteInviterSummary | null;
    accepted_by_user_id: number | null;
    status: InviteStatus;
    message: string | null;
    expires_at: string | null;
    sent_at: string | null;
    accepted_at: string | null;
    revoked_at: string | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface InviteActionResult {
    invitation: Invite;
}

export type CancelInviteResult = InviteActionResult;

export type ResendInviteResult = InviteActionResult;

export type PreviewInviteResult = InviteActionResult;

export interface AcceptInviteResult {
    action: "accepted";
    workspace_id: number;
    member_id: number;
    invitation_id: number;
    status: InviteStatus;
}

export type InviteActionErrorCode =
    | "WORKSPACE_INVITE_INVALID_TOKEN"
    | "WORKSPACE_INVITE_NOT_FOUND"
    | "WORKSPACE_INVITE_ALREADY_HANDLED"
    | "WORKSPACE_INVITE_EXPIRED"
    | "WORKSPACE_INVITE_EMAIL_MISMATCH"
    | "WORKSPACE_CONTEXT_INSUFFICIENT_PERMISSION_TO_CANCEL_INVITE"
    | "WORKSPACE_CONTEXT_INSUFFICIENT_PERMISSION_TO_RESEND_INVITE";

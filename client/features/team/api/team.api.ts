import { apiClient } from "@/shared/api/apiClient";
import {
    AcceptInviteResult,
    CancelInviteResult,
    Invite,
    Member,
    PreviewInviteResult,
    ResendInviteResult,
    Role,
    SendInviteInput,
} from "../types";

export async function getMembers(): Promise<{ members: Member[] }> {
    const response = await apiClient.get<{ members: Member[] }>("/workspaces/members");
    return response;
}

export async function sendInvite(data: SendInviteInput): Promise<void> {
    await apiClient.post("/workspaces/members/send-invite", data);
}

export async function removeMember(memberId: string): Promise<void> {
    await apiClient.delete(`/workspaces/members/${memberId}`);
}


export async function getRoles(): Promise<{ roles: Role[] }> {
    const response = await apiClient.get<{ roles: Role[] }>("/roles-permissions/roles");
    return response;
}

export async function getInviteList(): Promise<Invite[]> {
    const response = await apiClient.get<Invite[]>("/workspaces/members/invite-list");
    return response;
}

export async function cancelInvite(invitationId: number): Promise<CancelInviteResult> {
    const response = await apiClient.delete<CancelInviteResult>(`/workspaces/members/invitations/${invitationId}`);
    return response;
}

export async function resendInvite(invitationId: number): Promise<ResendInviteResult> {
    const response = await apiClient.post<ResendInviteResult>(
        `/workspaces/members/invitations/${invitationId}/resend`
    );
    return response;
}

export async function previewInvite(
    invitationId: number,
    token: string
): Promise<PreviewInviteResult> {
    const response = await apiClient.get<PreviewInviteResult>(
        `/workspaces/members/invitations/preview?invitation_id=${invitationId}&token=${encodeURIComponent(token)}`,
        {
            skipRefresh: true,
            workspace: false,
        }
    );
    return response;
}

export async function acceptInvite(
    invitationId: number,
    token: string
): Promise<AcceptInviteResult> {
    const response = await apiClient.post<AcceptInviteResult>(
        "/workspaces/members/accept-invite",
        {
            invitation_id: invitationId,
            token,
        },
        {
            workspace: false,
        }
    );
    return response;
}

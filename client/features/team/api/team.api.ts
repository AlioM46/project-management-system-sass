import { apiClient } from "@/shared/api/apiClient";
import { Member, SendInviteInput } from "../types";

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

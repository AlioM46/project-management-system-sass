"use client";

import { InviteMemberDialog } from "@/components/Team/invite-member/InviteMemberDialog";

type InviteMemberProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function InviteMember({ open, onOpenChange }: InviteMemberProps) {
    return <InviteMemberDialog open={open} onOpenChange={onOpenChange} />;
}

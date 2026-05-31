import AcceptInvitePage from "@/features/team/pages/AcceptInvitePage";

interface AcceptInviteRouteProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AcceptInviteRoute({
    searchParams,
}: AcceptInviteRouteProps) {
    const params = await searchParams;
    const invitationId =
        typeof params.invitation_id === "string"
            ? Number(params.invitation_id)
            : undefined;
    const token = typeof params.token === "string" ? params.token : undefined;

    return <AcceptInvitePage invitationId={invitationId} token={token} />;
}

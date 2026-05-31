import { Invite, InviteStatus } from "@/features/team/types";

const HOUR_IN_MS = 60 * 60 * 1000;

function parseDate(value: string | null | undefined): Date | null {
    if (!value) return null;

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatHourDelta(ms: number): string {
    const hours = Math.floor(ms / HOUR_IN_MS);

    if (hours <= 0) return "<1h";

    return `${hours}h`;
}

export function formatInviteDateTime(value: string | null | undefined): string {
    const parsed = parseDate(value);

    if (!parsed) return "Not available";

    return parsed.toLocaleString();
}

export function formatSentHoursLabel(value: string | null | undefined): string {
    const parsed = parseDate(value);

    if (!parsed) return "Sent time unavailable";

    const diff = Date.now() - parsed.getTime();

    if (diff < 0) return "Sending soon";

    return `Sent ${formatHourDelta(diff)} ago`;
}

export function formatExpiryHoursLabel(value: string | null | undefined): string {
    const parsed = parseDate(value);

    if (!parsed) return "Expiry unavailable";

    const diff = parsed.getTime() - Date.now();

    if (diff <= 0) {
        return `Expired ${formatHourDelta(Math.abs(diff))} ago`;
    }

    return `Expires in ${formatHourDelta(diff)}`;
}

export function isInviteExpiringSoon(invite: Invite): boolean {
    if (invite.status !== "pending") return false;

    const parsed = parseDate(invite.expires_at);
    if (!parsed) return false;

    const diff = parsed.getTime() - Date.now();
    return diff > 0 && diff <= 24 * HOUR_IN_MS;
}

export function getInviteStatusTone(status: InviteStatus): string {
    if (status === "accepted") {
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
    }

    if (status === "expired") {
        return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
    }

    if (status === "cancelled" || status === "revoked") {
        return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300";
    }

    return "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300";
}

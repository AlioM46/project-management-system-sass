"use client";

import { ChangeEvent, KeyboardEvent, MouseEvent, RefObject, useEffect, useMemo, useState } from "react";

export interface MentionCandidate {
    id: number;
    name: string;
    username: string;
    avatar_url?: string | null;
}

interface UseMentionsProps {
    message: string;
    setMessage: (value: string) => void;
    candidates: MentionCandidate[];
    inputRef?: RefObject<HTMLTextAreaElement | HTMLInputElement | null>;
    currentUserId?: number;
}

interface UseMentionsReturn {
    isMentionOpen: boolean;
    mentionQuery: string;
    mentionRange: { start: number; end: number } | null;
    mentionCandidates: MentionCandidate[];
    handleInputChange: (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
    handleInputClick: (event: MouseEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
    handleInputKeyUp: (event: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
    handleMentionSelect: (username: string) => void;
    closeMention: () => void;
}

export default function useMentions({
    message,
    setMessage,
    candidates,
    inputRef,
    currentUserId,
}: UseMentionsProps): UseMentionsReturn {


    const [mentionQuery, setMentionQuery] = useState("");
    const [mentionRange, setMentionRange] = useState<{ start: number; end: number } | null>(null);
    const [isMentionOpen, setIsMentionOpen] = useState(false);

    const closeMention = () => {
        setIsMentionOpen(false);
        setMentionRange(null);
        setMentionQuery("");
    };

    function updateMentionState(value: string, caretPosition: number | null) {
        if (caretPosition === null) {
            closeMention();
            return;
        }

        const beforeCursor = value.slice(0, caretPosition);
        const match = beforeCursor.match(/(^|\s)@([\w-]*)$/);

        if (!match) {
            closeMention();
            return;
        }

        const query = match[2] || "";
        const mentionStart = beforeCursor.lastIndexOf("@");

        setMentionQuery(query);
        setMentionRange({ start: mentionStart, end: caretPosition });
        setIsMentionOpen(true);
    }

    function handleInputChange(event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) {
        const value = event.target.value;
        setMessage(value);
        updateMentionState(value, event.target.selectionStart);
    }

    function handleInputClick(event: MouseEvent<HTMLTextAreaElement | HTMLInputElement>) {
        updateMentionState(message, event.currentTarget.selectionStart);
    }

    function handleInputKeyUp(event: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) {
        updateMentionState(message, event.currentTarget.selectionStart);
    }

    function handleMentionSelect(username: string) {
        if (!mentionRange) return;

        const nextValue = `${message.slice(0, mentionRange.start)}@${username} ${message.slice(mentionRange.end)}`;
        const nextCaret = mentionRange.start + username.length + 2;

        setMessage(nextValue);
        closeMention();

        if (inputRef?.current) {
            requestAnimationFrame(() => {
                inputRef.current?.focus();
                inputRef.current?.setSelectionRange(nextCaret, nextCaret);
            });
        }
    }

    const mentionCandidates = useMemo(() => {
        if (!isMentionOpen) return [];

        return candidates
            .filter((c) => {
                if (currentUserId && c.id === currentUserId) return false;
                if (!c.username) return false;

                const uname = c.username.toLowerCase();
                const name = c.name?.toLowerCase() || "";
                const q = mentionQuery.toLowerCase();
                return uname.includes(q) || name.includes(q);
            })
            .slice(0, 6);
    }, [candidates, isMentionOpen, mentionQuery, currentUserId]);

    useEffect(() => {
        console.log("message", message)
        console.log("isMentionOpen", isMentionOpen)
        console.log("mentionQuery", mentionQuery)
        console.log("mentionRange", mentionRange)
        console.log("mentionCandidates", mentionCandidates)
        console.log("############################################")

    }, [message, isMentionOpen, mentionQuery, mentionRange, mentionCandidates])


    return {
        isMentionOpen,
        mentionQuery,
        mentionRange,
        mentionCandidates,
        handleInputChange,
        handleInputClick,
        handleInputKeyUp,
        handleMentionSelect,
        closeMention,
    };
}

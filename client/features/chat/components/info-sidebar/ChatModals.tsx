"use client";

import { Trash2, Ban, BellOff, X, Loader2 } from "lucide-react";

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    isSubmitting: boolean;
    icon: React.ReactNode;
    onClose: () => void;
    onConfirm: () => void;
}

export function ConfirmDialog({
    isOpen,
    title,
    description,
    confirmText,
    isSubmitting,
    icon,
    onClose,
    onConfirm,
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#111b21] w-full max-w-sm rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 p-5 space-y-4">
                <div className="flex items-center gap-3 text-red-500">
                    <div className="p-2.5 rounded-full bg-red-500/10">
                        {icon}
                    </div>
                    <div>
                        <h4 className="font-bold text-base text-zinc-900 dark:text-white">{title}</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-white/5">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                        {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        <span>{confirmText}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

interface MuteModalProps {
    isOpen: boolean;
    displayName: string;
    isSubmitting: boolean;
    onClose: () => void;
    onMute: (minutes: number) => void;
}

export function MuteModal({ isOpen, displayName, isSubmitting, onClose, onMute }: MuteModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#111b21] w-full max-w-sm rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/5 pb-3">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-base">
                        <BellOff className="h-5 w-5 text-amber-500" />
                        <span>Mute Notifications</span>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Choose how long you want to mute notifications for <strong className="text-zinc-900 dark:text-white">{displayName}</strong>:
                </p>

                <div className="space-y-1.5 pt-1">
                    {[
                        { label: "15 Minutes", minutes: 15, icon: "⏱️" },
                        { label: "1 Hour", minutes: 60, icon: "⏱️" },
                        { label: "8 Hours", minutes: 480, icon: "⏱️" },
                        { label: "24 Hours (1 Day)", minutes: 1440, icon: "📅" },
                        { label: "1 Week", minutes: 10080, icon: "🗓️" },
                        { label: "Always / Until I turn it back on", minutes: 525600, icon: "🔕" },
                    ].map((opt) => (
                        <button
                            key={opt.minutes}
                            disabled={isSubmitting}
                            onClick={() => onMute(opt.minutes)}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all border border-zinc-200/60 dark:border-white/5 disabled:opacity-50"
                        >
                            <span className="flex items-center gap-2">
                                <span>{opt.icon}</span>
                                <span>{opt.label}</span>
                            </span>
                        </button>
                    ))}
                </div>

                <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-white/5">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

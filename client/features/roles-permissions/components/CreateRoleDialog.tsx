"use client";

import React, { useState } from "react";
import { Plus, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateRoleInput } from "../types";

interface CreateRoleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (data: CreateRoleInput) => Promise<boolean>;
}

const RESERVED_NAMES = ["owner", "admin", "member"];

export function CreateRoleDialog({ open, onOpenChange, onCreate }: CreateRoleDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!open) return null;

    const generateSlug = (val: string) => {
        return val
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-");
    };

    const slug = generateSlug(name);
    const isReserved = RESERVED_NAMES.includes(name.trim().toLowerCase());

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!name.trim()) {
            setErrorMsg("Role name is required.");
            return;
        }

        if (isReserved) {
            setErrorMsg(`"${name}" is a reserved system role name.`);
            return;
        }

        setIsSubmitting(true);
        const success = await onCreate({
            name: name.trim(),
            slug: slug || undefined,
            description: description.trim() || undefined,
        });

        setIsSubmitting(false);

        if (success) {
            setName("");
            setDescription("");
            onOpenChange(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-md bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-zinc-200 dark:border-white/10 flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <Shield className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Create Custom Role</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Add a new role to assign fine-grained permissions.</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {errorMsg && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-900 dark:text-white">Role Name *</label>
                        <input
                            type="text"
                            placeholder="e.g. Project Manager, QA Tester"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                        />
                        {slug && (
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                                System Identifier (slug): <span className="text-blue-600 dark:text-blue-400">{slug}</span>
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-900 dark:text-white">Description</label>
                        <textarea
                            rows={3}
                            placeholder="Describe what members with this role can do..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                            className="rounded-xl text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || isReserved || !name.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium shadow-sm"
                        >
                            {isSubmitting ? "Creating..." : <><Plus className="h-4 w-4 mr-1" /> Create Role</>}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

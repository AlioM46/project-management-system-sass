"use client";

import { useState, useEffect } from "react";
import { X, UserPlus, Phone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createTask } from "@/features/tasks/api/tasks.api";
import { getCourses } from "@/features/projects/api/projects.api";
import { Course } from "@/features/projects/types";
import { toast } from "sonner";
import { useTranslation } from "@/lib/context/LanguageContext";

interface CreateLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    defaultCourseId?: string | null;
}

export function CreateLeadModal({ isOpen, onClose, onSuccess, defaultCourseId }: CreateLeadModalProps) {
    const { t } = useTranslation();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [phone, setPhone] = useState("");
    const [source, setSource] = useState("");
    const [courseId, setCourseId] = useState<string>(defaultCourseId || "");
    const [courses, setCourses] = useState<Course[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingCourses, setIsLoadingCourses] = useState(false);

    const leadSources = [
        { value: "", label: t("lead_source_select") },
        { value: "website", label: t("lead_source_website") },
        { value: "whatsapp", label: t("lead_source_whatsapp") },
        { value: "referral", label: t("lead_source_referral") },
        { value: "instagram", label: t("lead_source_instagram") },
        { value: "facebook", label: t("lead_source_facebook") },
        { value: "walk_in", label: t("lead_source_walk_in") },
        { value: "phone_call", label: t("lead_source_phone_call") },
        { value: "other", label: t("lead_source_other") },
    ];

    useEffect(() => {
        if (isOpen && !defaultCourseId) {
            const fetchCourses = async () => {
                setIsLoadingCourses(true);
                try {
                    const response = await getCourses();
                    setCourses(response.courses || (Array.isArray(response) ? response : []));
                } catch (error) {
                    console.error("Failed to fetch courses for lead modal:", error);
                }  finally {
                    setIsLoadingCourses(false);
                }
            };
            fetchCourses();
        } else if (defaultCourseId) {
            setCourseId(defaultCourseId);
        }
    }, [isOpen, defaultCourseId]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error(t("modal_lead_validation_name"));
            return;
        }

        setIsSubmitting(true);
        try {
            await createTask({
                title: title.trim(),
                description: description.trim() || undefined,
                project_id: courseId || undefined,
            });
            toast.success(t("modal_lead_created_success"));
            setTitle("");
            setDescription("");
            setPhone("");
            setSource("");
            if (!defaultCourseId) setCourseId("");
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error("Failed to create lead:", error);
            toast.error(t("modal_lead_created_error"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0 text-start">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-[#0a0a0a] rounded-2xl w-full max-w-md shadow-xl border border-zinc-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-white/10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex items-center justify-center">
                            <UserPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">{t("modal_create_lead_title")}</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-zinc-100 dark:hover:bg-white/5">
                        <X className="h-5 w-5 text-zinc-500" />
                    </Button>
                </div>

                <div className="overflow-y-auto p-6 flex-1">
                    <form id="create-lead-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-900 dark:text-white">{t("modal_lead_title")} <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={t("modal_lead_name_placeholder")}
                                className="w-full px-4 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                                required
                            />
                        </div>

                        {!defaultCourseId && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-900 dark:text-white">{t("pipeline_filter_course")}</label>
                                <select
                                    value={courseId}
                                    onChange={(e) => setCourseId(e.target.value)}
                                    disabled={isLoadingCourses}
                                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white disabled:opacity-50"
                                >
                                    <option value="">{t("modal_lead_no_course")}</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-900 dark:text-white flex items-center gap-1.5">
                                    <Phone className="h-3.5 w-3.5 text-zinc-400" />
                                    {t("modal_lead_phone")}
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder={t("modal_lead_phone_placeholder")}
                                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-900 dark:text-white flex items-center gap-1.5">
                                    <Globe className="h-3.5 w-3.5 text-zinc-400" />
                                    {t("modal_lead_source")}
                                </label>
                                <select
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                                >
                                    {leadSources.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-900 dark:text-white">{t("modal_lead_desc")}</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={t("modal_lead_desc_placeholder")}
                                rows={3}
                                className="w-full px-4 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white resize-none"
                            />
                        </div>
                    </form>
                </div>
                
                <div className="p-6 border-t border-zinc-200 dark:border-white/10 shrink-0 flex justify-end gap-3 bg-zinc-50/50 dark:bg-[#0a0a0a]/50">
                    <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
                        {t("modal_cancel")}
                    </Button>
                    <Button type="submit" form="create-lead-form" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md">
                        {isSubmitting ? t("modal_lead_creating") : t("modal_lead_btn_create")}
                    </Button>
                </div>
            </div>
        </div>
    );
}

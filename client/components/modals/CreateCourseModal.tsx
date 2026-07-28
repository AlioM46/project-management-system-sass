"use client";

import { useState } from "react";
import { X, GraduationCap, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createCourse } from "@/features/projects/api/projects.api";
import { toast } from "sonner";
import { useTranslation } from "@/lib/context/LanguageContext";

interface CreateCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function CreateCourseModal({ isOpen, onClose, onSuccess }: CreateCourseModalProps) {
    const { t } = useTranslation();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState<string>("");
    const [durationHours, setDurationHours] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error(t("modal_course_validation_name"));
            return;
        }

        if (price && (isNaN(Number(price)) || Number(price) < 0)) {
            toast.error(t("modal_course_validation_price"));
            return;
        }

        if (durationHours && (isNaN(Number(durationHours)) || Number(durationHours) < 0)) {
            toast.error(t("modal_course_validation_duration"));
            return;
        }

        setIsSubmitting(true);
        try {
            await createCourse({
                name: name.trim(),
                description: description.trim() || undefined,
                price: price ? Number(price) : undefined,
                duration_hours: durationHours ? Number(durationHours) : undefined,
            });
            toast.success(t("modal_course_created_success"));
            setName("");
            setDescription("");
            setPrice("");
            setDurationHours("");
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error("Failed to create course:", error);
            toast.error(t("modal_course_created_error"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0 text-start">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-[#0a0a0a] rounded-2xl w-full max-w-md shadow-xl border border-zinc-200 dark:border-white/10 overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-50 dark:bg-blue-500/10 rounded-lg flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">{t("modal_create_course_title")}</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-zinc-100 dark:hover:bg-white/5">
                        <X className="h-5 w-5 text-zinc-500" />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-900 dark:text-white">{t("modal_course_name")} <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t("modal_course_name_placeholder")}
                            className="w-full px-4 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-900 dark:text-white">{t("modal_course_desc")}</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t("modal_course_desc_placeholder")}
                            rows={3}
                            className="w-full px-4 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-900 dark:text-white flex items-center gap-1.5">
                                <DollarSign className="h-3.5 w-3.5 text-zinc-400" />
                                {t("modal_course_price")}
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0.00"
                                className="w-full px-4 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-900 dark:text-white flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-zinc-400" />
                                {t("modal_course_duration")}
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={durationHours}
                                onChange={(e) => setDurationHours(e.target.value)}
                                placeholder="e.g. 40"
                                className="w-full px-4 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            />
                        </div>
                    </div>
                    
                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
                            {t("modal_cancel")}
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md">
                            {isSubmitting ? t("modal_course_creating") : t("modal_course_btn_create")}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

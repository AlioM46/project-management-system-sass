"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Settings, Users, GraduationCap, UserPlus, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCourse } from "@/features/projects/api/projects.api";
import { Course } from "@/features/projects/types";
import Link from "next/link";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { CreateLeadModal } from "@/components/modals/CreateLeadModal";
import { TaskDetailsModal } from "@/components/modals/TaskDetailsModal";
import { getTasks } from "@/features/tasks/api/tasks.api";
import { Task } from "@/features/tasks/types";
import { useTranslation } from "@/lib/context/LanguageContext";

export default function CourseDetailsPage() {
    const { t } = useTranslation();
    const params = useParams();
    const courseId = params.id as string;

    const [course, setCourse] = useState<Course | null>(null);
    const [leads, setLeads] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateLeadModalOpen, setIsCreateLeadModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Task | null>(null);

    const fetchData = async () => {
        if (!courseId) return;
        setIsLoading(true);
        try {
            const [courseRes, leadsRes] = await Promise.all([
                getCourse(courseId),
                getTasks({ project_id: courseId })
            ]);
            setCourse(courseRes);
            setLeads(leadsRes.tasks || (Array.isArray(leadsRes) ? leadsRes : []));
        } catch (error) {
            console.error("Failed to fetch course data:", error);
            toast.error("Failed to load course details.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [courseId]);

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            {/* Breadcrumbs and Actions */}
            <div className="flex items-center justify-between text-start">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/courses">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-zinc-100 dark:hover:bg-white/5">
                            <ArrowLeft className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                        </Button>
                    </Link>
                    <div>
                        {isLoading ? (
                            <div className="h-8 w-48 bg-zinc-200 dark:bg-white/10 rounded animate-pulse" />
                        ) : (
                            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
                                <GraduationCap className="h-8 w-8 text-blue-600 dark:text-blue-500" />
                                {course?.name || t("course_details_title")}
                            </h2>
                        )}
                        <div className="text-zinc-500 dark:text-zinc-400 mt-1">
                            {isLoading ? (
                                <div className="h-4 w-64 bg-zinc-200 dark:bg-white/10 rounded animate-pulse mt-2" />
                            ) : (
                                course?.description || "No description provided."
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2 rounded-xl">
                        <Users className="h-4 w-4" />
                        {t("course_details_members_btn")}
                    </Button>
                    <Button variant="outline" className="gap-2 rounded-xl">
                        <Settings className="h-4 w-4" />
                        {t("course_details_settings_btn")}
                    </Button>
                </div>
            </div>

            {/* Course Content Area */}
            {isLoading ? (
                <div className="h-[400px] w-full bg-zinc-100 dark:bg-white/5 rounded-2xl animate-pulse" />
            ) : (
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main Board Area */}
                    <div className="md:col-span-2 space-y-6 text-start">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">{t("course_details_leads")}</h3>
                            <Button 
                                onClick={() => setIsCreateLeadModalOpen(true)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md gap-2 rounded-xl h-9 px-4"
                            >
                                <UserPlus className="h-4 w-4" />
                                {t("course_details_new_lead")}
                            </Button>
                        </div>
                        
                        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm overflow-hidden">
                            {leads.length === 0 ? (
                                <div className="p-12 flex flex-col items-center justify-center text-center">
                                    <div className="h-16 w-16 bg-zinc-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                                        <UserPlus className="h-8 w-8 text-zinc-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("course_details_no_leads")}</h3>
                                    <p className="text-zinc-500 max-w-sm mt-2 mb-6">
                                        {t("course_details_no_leads_desc")}
                                    </p>
                                    <Button 
                                        onClick={() => setIsCreateLeadModalOpen(true)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md gap-2 rounded-xl"
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        {t("course_details_new_lead")}
                                    </Button>
                                </div>
                            ) : (
                                <div className="divide-y divide-zinc-200 dark:divide-white/10">
                                    {leads.map(lead => (
                                        <div 
                                            key={lead.id} 
                                            onClick={() => setSelectedLead(lead)}
                                            className="p-4 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`h-2 w-2 rounded-full ${
                                                    lead.status === 'DONE' ? 'bg-emerald-500' :
                                                    lead.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'
                                                }`} />
                                                <div>
                                                    <h4 className="font-medium text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                        {lead.title}
                                                    </h4>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                                                        <span className="uppercase tracking-wider font-medium">{lead.status.replace('_', ' ')}</span>
                                                        {lead.source && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="capitalize">{lead.source}</span>
                                                            </>
                                                        )}
                                                        {lead.student && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                                                    🎓 {lead.student.student_code}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Area */}
                    <div className="space-y-6 text-start">
                        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm p-6">
                            <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">{t("course_details_title")}</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("course_details_status")}</p>
                                    <div className="mt-1">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400">
                                            {t("course_details_active")}
                                        </span>
                                    </div>
                                </div>
                                {course?.price && (
                                    <div>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("course_details_price")}</p>
                                        <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-white flex items-center gap-1">
                                            {t("courses_price_val", { val: Number(course.price).toLocaleString() })}
                                        </p>
                                    </div>
                                )}
                                {course?.duration_hours && (
                                    <div>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("course_details_duration")}</p>
                                        <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-white flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5 text-zinc-400" />
                                            {course.duration_hours} {t("courses_hours")}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("course_details_created")}</p>
                                    <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">
                                        {course?.created_at ? new Date(course.created_at).toLocaleDateString() : 'Unknown'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("course_details_id")}</p>
                                    <p className="mt-1 text-xs font-mono bg-zinc-100 dark:bg-white/5 p-2 rounded text-zinc-600 dark:text-zinc-300">
                                        {course?.id || courseId}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("course_details_total_leads")}</p>
                                    <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">
                                        {leads.length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <CreateLeadModal 
                isOpen={isCreateLeadModalOpen} 
                onClose={() => setIsCreateLeadModalOpen(false)} 
                defaultCourseId={courseId}
                onSuccess={() => {
                    toast.success("Lead created!");
                    setIsCreateLeadModalOpen(false);
                    fetchData();
                }}
            />

            <TaskDetailsModal 
                isOpen={!!selectedLead}
                task={selectedLead}
                onClose={() => setSelectedLead(null)}
                onUpdate={fetchData}
            />
        </div>
    );
}

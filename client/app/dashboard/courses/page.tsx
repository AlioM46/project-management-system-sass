"use client";

import { useState, useEffect } from "react";
import { Plus, Search, GraduationCap, MoreHorizontal, ArrowRight, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCourses, deleteCourse } from "@/features/projects/api/projects.api";
import { Course } from "@/features/projects/types";
import Link from "next/link";
import { toast } from "sonner";
import { CreateCourseModal } from "@/components/modals/CreateCourseModal";
import { useTranslation } from "@/lib/context/LanguageContext";

export default function CoursesPage() {
    const { t } = useTranslation();
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = () => setOpenDropdownId(null);
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const fetchCourses = async () => {
        setIsLoading(true);
        try {
            const response = await getCourses();
            setCourses(response.courses || (Array.isArray(response) ? response : []));
        } catch (error) {
            console.error("Failed to fetch courses:", error);
            toast.error("Failed to load courses.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleDeleteCourse = async (courseId: string) => {
        if (!confirm("Are you sure you want to delete this course? This will also affect associated leads.")) return;
        try {
            await deleteCourse(courseId);
            toast.success("Course deleted.");
            fetchCourses();
        } catch (error) {
            console.error("Failed to delete course:", error);
            toast.error("Failed to delete course.");
        }
    };

    const filteredCourses = courses.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 text-start">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{t("courses_title")}</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        {t("courses_subtitle")}
                    </p>
                </div>
                <Button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-md gap-2 rounded-xl h-11 px-6"
                >
                    <Plus className="h-4 w-4" />
                    {t("courses_new_course")}
                </Button>
            </div>

            {/* Filters and Search */}
            <div className="flex items-center justify-between gap-4 bg-white dark:bg-[#0a0a0a] p-4 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder={t("courses_search_placeholder")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full ps-10 pe-4 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-start"
                    />
                </div>
            </div>

            {/* Data Table / List */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-zinc-500">Loading courses...</div>
                ) : filteredCourses.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center text-center">
                        <div className="h-16 w-16 bg-zinc-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <GraduationCap className="h-8 w-8 text-zinc-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("courses_no_courses")}</h3>
                        <p className="text-zinc-500 max-w-sm mt-2 mb-6">
                            {t("courses_no_courses_desc")}
                        </p>
                        <Button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md gap-2 rounded-xl"
                        >
                            <Plus className="h-4 w-4" />
                            {t("courses_create_first")}
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-50 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-white/10">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-2xl rounded-tr-none text-start">{t("courses_col_name")}</th>
                                    <th className="px-6 py-4 text-start">{t("courses_col_price")}</th>
                                    <th className="px-6 py-4 text-start">{t("courses_col_duration")}</th>
                                    <th className="px-6 py-4 text-start">{t("courses_col_created")}</th>
                                    <th className="px-6 py-4 text-end rounded-tr-2xl rounded-tl-none">{t("courses_col_actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
                                {filteredCourses.map((course) => (
                                    <tr key={course.id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <Link href={`/dashboard/courses/${course.id}`} className="font-semibold text-zinc-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2">
                                                <GraduationCap className="h-4 w-4 text-zinc-400" />
                                                {course.name}
                                            </Link>
                                            {course.description && (
                                                <p className="text-zinc-500 text-xs mt-1 truncate max-w-md">{course.description}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-start">
                                            {course.price ? (
                                                <span className="inline-flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                                                    {t("courses_price_val", { val: Number(course.price).toLocaleString() })}
                                                </span>
                                            ) : (
                                                <span className="text-zinc-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-start">
                                            {course.duration_hours ? (
                                                <span className="inline-flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                                                    <Clock className="h-3.5 w-3.5 text-zinc-400" />
                                                    {course.duration_hours} {t("courses_hours")}
                                                </span>
                                            ) : (
                                                <span className="text-zinc-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500">
                                            {new Date(course.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity relative">
                                                <Link href={`/dashboard/courses/${course.id}`}>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10">
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenDropdownId(openDropdownId === course.id ? null : course.id);
                                                    }}
                                                    className="h-8 w-8 p-0 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>

                                                {openDropdownId === course.id && (
                                                    <div className="absolute top-full right-0 mt-1 w-32 bg-white dark:bg-[#0f0f0f] border border-zinc-200 dark:border-white/10 rounded-xl shadow-lg overflow-hidden z-10 text-left">
                                                        <button 
                                                            className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5"
                                                            onClick={() => toast.info("Edit feature coming soon!")}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button 
                                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteCourse(course.id);
                                                                setOpenDropdownId(null);
                                                            }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            <CreateCourseModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onSuccess={fetchCourses}
            />
        </div>
    );
}

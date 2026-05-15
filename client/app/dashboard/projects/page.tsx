"use client";

import { useState, useEffect } from "react";
import { Plus, Search, FolderKanban, MoreHorizontal, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProjects } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types";
import Link from "next/link";
import { toast } from "sonner";
import { CreateProjectModal } from "@/components/modals/CreateProjectModal";

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
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

    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            const response = await getProjects();
            setProjects(response.projects || (Array.isArray(response) ? response : []));
        } catch (error) {
            console.error("Failed to fetch projects:", error);
            toast.error("Failed to load projects.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const filteredProjects = projects.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Projects</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        Manage your workspace projects and their statuses.
                    </p>
                </div>
                <Button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-md gap-2 rounded-xl h-11 px-6"
                >
                    <Plus className="h-4 w-4" />
                    New Project
                </Button>
            </div>

            {/* Filters and Search */}
            <div className="flex items-center justify-between gap-4 bg-white dark:bg-[#0a0a0a] p-4 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                </div>
            </div>

            {/* Data Table / List */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-zinc-500">Loading projects...</div>
                ) : filteredProjects.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center text-center">
                        <div className="h-16 w-16 bg-zinc-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <FolderKanban className="h-8 w-8 text-zinc-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">No projects found</h3>
                        <p className="text-zinc-500 max-w-sm mt-2 mb-6">
                            You don't have any projects yet. Create your first project to start tracking tasks and collaborating.
                        </p>
                        <Button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md gap-2 rounded-xl"
                        >
                            <Plus className="h-4 w-4" />
                            Create Project
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-50 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-white/10">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-2xl">Project Name</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Created</th>
                                    <th className="px-6 py-4 text-right rounded-tr-2xl">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
                                {filteredProjects.map((project) => (
                                    <tr key={project.id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <Link href={`/dashboard/projects/${project.id}`} className="font-semibold text-zinc-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2">
                                                <FolderKanban className="h-4 w-4 text-zinc-400" />
                                                {project.name}
                                            </Link>
                                            {project.description && (
                                                <p className="text-zinc-500 text-xs mt-1 truncate max-w-md">{project.description}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                project.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                                project.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400' :
                                                'bg-zinc-100 text-zinc-800 dark:bg-white/10 dark:text-zinc-400'
                                            }`}>
                                                {project.status || 'active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500">
                                            {new Date(project.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity relative">
                                                <Link href={`/dashboard/projects/${project.id}`}>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10">
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenDropdownId(openDropdownId === project.id ? null : project.id);
                                                    }}
                                                    className="h-8 w-8 p-0 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>

                                                {openDropdownId === project.id && (
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
                                                                toast.info("Delete project feature coming soon!");
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
            
            <CreateProjectModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onSuccess={fetchProjects}
            />
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Settings, Users, FolderKanban, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProject } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types";
import Link from "next/link";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";
import { TaskDetailsModal } from "@/components/modals/TaskDetailsModal";
import { ProjectSettingsModal } from "@/components/modals/ProjectSettingsModal";
import { getTasks } from "@/features/tasks/api/tasks.api";
import { Task } from "@/features/tasks/types";

export default function ProjectDetailsPage() {
    const params = useParams();
    const projectId = params.id as string;

    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const fetchData = async () => {
        if (!projectId) return;
        setIsLoading(true);
        try {
            const [projectRes, tasksRes] = await Promise.all([
                getProject(projectId),
                getTasks({ project_id: projectId })
            ]);
            setProject(projectRes);
            setTasks(tasksRes.tasks || (Array.isArray(tasksRes) ? tasksRes : []));
        } catch (error) {
            console.error("Failed to fetch project data:", error);
            toast.error("Failed to load project details.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [projectId]);

    return (
        <div className="flex-1 space-y-6 p-6 sm:p-8 max-w-7xl mx-auto">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/10 pb-6">
                <div>
                    <Link 
                        href="/dashboard/projects"
                        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Projects
                    </Link>
                    <div>
                        {isLoading ? (
                            <div className="h-8 w-48 bg-zinc-200 dark:bg-white/10 rounded animate-pulse" />
                        ) : (
                            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
                                <FolderKanban className="h-8 w-8 text-blue-600 dark:text-blue-500" />
                                {project?.name || "Project Details"}
                            </h2>
                        )}
                        <div className="text-zinc-500 dark:text-zinc-400 mt-1">
                            {isLoading ? (
                                <div className="h-4 w-64 bg-zinc-200 dark:bg-white/10 rounded animate-pulse mt-2" />
                            ) : (
                                project?.description || "No description provided."
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setIsSettingsModalOpen(true)}
                        disabled={!project || isLoading}
                        className="gap-2 rounded-xl border-zinc-200 dark:border-white/10"
                    >
                        <Settings className="h-4 w-4" />
                        Settings
                    </Button>
                </div>
            </div>

            {/* Project Content Area */}
            {isLoading ? (
                <div className="h-[400px] w-full bg-zinc-100 dark:bg-white/5 rounded-2xl animate-pulse" />
            ) : (
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main Board Area */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Project Tasks</h3>
                            <Button 
                                onClick={() => setIsCreateTaskModalOpen(true)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md gap-2 rounded-xl h-9 px-4"
                            >
                                <CheckSquare className="h-4 w-4" />
                                New Task
                            </Button>
                        </div>
                        
                        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm overflow-hidden">
                            {tasks.length === 0 ? (
                                <div className="p-12 flex flex-col items-center justify-center text-center">
                                    <div className="h-16 w-16 bg-zinc-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                                        <FolderKanban className="h-8 w-8 text-zinc-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">No tasks yet</h3>
                                    <p className="text-zinc-500 max-w-sm mt-2 mb-6">
                                        Create tasks to track the progress of this project.
                                    </p>
                                    <Button 
                                        onClick={() => setIsCreateTaskModalOpen(true)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md gap-2 rounded-xl"
                                    >
                                        <CheckSquare className="h-4 w-4" />
                                        Create Task
                                    </Button>
                                </div>
                            ) : (
                                <div className="divide-y divide-zinc-200 dark:divide-white/10">
                                    {tasks.map(task => (
                                        <div 
                                            key={task.id} 
                                            onClick={() => setSelectedTask(task)}
                                            className="p-4 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`h-2 w-2 rounded-full ${
                                                    task.status === 'DONE' ? 'bg-emerald-500' :
                                                    task.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'
                                                }`} />
                                                <div>
                                                    <h4 className="font-medium text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                        {task.title}
                                                    </h4>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                                                        <span className="uppercase tracking-wider font-medium">{task.status.replace('_', ' ')}</span>
                                                        <span>•</span>
                                                        <span className={`${
                                                            task.priority === 'high' ? 'text-red-500' :
                                                            task.priority === 'medium' ? 'text-amber-500' : 'text-blue-500'
                                                        }`}>{task.priority} Priority</span>
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
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm p-6">
                            <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">Project Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Status</p>
                                    <div className="mt-1">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            project?.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                            project?.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400' :
                                            'bg-zinc-100 text-zinc-800 dark:bg-white/10 dark:text-zinc-400'
                                        }`}>
                                            {project?.status || 'active'}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Created</p>
                                    <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">
                                        {project?.created_at ? new Date(project.created_at).toLocaleDateString() : 'Unknown'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Project ID</p>
                                    <p className="mt-1 text-xs font-mono bg-zinc-100 dark:bg-white/5 p-2 rounded text-zinc-600 dark:text-zinc-300">
                                        {project?.id || projectId}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <CreateTaskModal 
                isOpen={isCreateTaskModalOpen} 
                onClose={() => setIsCreateTaskModalOpen(false)} 
                defaultProjectId={projectId}
                onSuccess={() => {
                    toast.success("Task created!");
                    setIsCreateTaskModalOpen(false);
                    fetchData();
                }}
            />

            <TaskDetailsModal 
                isOpen={!!selectedTask}
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
                onUpdate={fetchData}
            />

            {project && (
                <ProjectSettingsModal
                    isOpen={isSettingsModalOpen}
                    onClose={() => setIsSettingsModalOpen(false)}
                    project={project}
                    onProjectUpdated={fetchData}
                />
            )}
        </div>
    );
}

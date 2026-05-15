"use client";

import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, CheckCircle2, Clock, Circle, AlertCircle, XCircle, Filter, Users, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTasks, updateTask, createTask, getTaskTransitions } from "@/features/tasks/api/tasks.api";
import { getMembers } from "@/features/team/api/team.api";
import { Member } from "@/features/team/types";
import { getProjects } from "@/features/projects/api/projects.api";
import { Task } from "@/features/tasks/types";
import { Project } from "@/features/projects/types";
import { toast } from "sonner";
import { TaskDetailsModal } from "@/components/modals/TaskDetailsModal";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Filters State
    const [filters, setFilters] = useState({
        project_id: "",
        assignee_id: "",
        sort_by: "created_at",
        sort_dir: "desc"
    });
    const [selectedTaskId, setSelectedTaskId] = useState<string | number | null>(null);
    
    const selectedTask = tasks.find(t => t.id == selectedTaskId) || null;
    const [isMounted, setIsMounted] = useState(false);
    
    // Inline Creation State
    const [creatingInColumn, setCreatingInColumn] = useState<string | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [selectedProjectId, setSelectedProjectId] = useState("");

    // Transitions State (Cache per task ID)
    const [taskTransitions, setTaskTransitions] = useState<Record<string, string[]>>({});

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const fetchTransitions = async (taskId: string | number) => {
        const idStr = String(taskId);
        if (taskTransitions[idStr]) return; // already fetched
        try {
            const res = await getTaskTransitions(idStr);
            setTaskTransitions(prev => ({ ...prev, [idStr]: res.allowed_transitions }));
        } catch (error) {
            console.error("Failed to load transitions for task", idStr);
        }
    };

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const [tasksRes, projectsRes, membersRes] = await Promise.all([
                getTasks(filters),
                getProjects(),
                getMembers()
            ]);
            setTasks(tasksRes.tasks || (Array.isArray(tasksRes) ? tasksRes : []));
            
            const fetchedProjects = projectsRes.projects || (Array.isArray(projectsRes) ? projectsRes : []);
            setProjects(fetchedProjects);
            if (fetchedProjects.length > 0 && !selectedProjectId) {
                setSelectedProjectId(fetchedProjects[0].id);
            }

            setMembers(membersRes.members || []);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast.error("Failed to load tasks data.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [filters]);

    const moveTask = async (taskId: string | number, newStatus: Task['status']) => {
        const task = tasks.find(t => t.id == taskId);
        if (!task || task.status === newStatus) return;

        // Optimistic UI update
        setTasks(prev => prev.map(t => t.id == taskId ? { ...t, status: newStatus } : t));
        
        try {
            await updateTask(String(taskId), { status: newStatus });
            toast.success("Task updated.");
            
            // Invalidate transitions cache so it fetches new rules for the new status
            setTaskTransitions(prev => {
                const next = { ...prev };
                delete next[String(taskId)];
                return next;
            });
            // Immediately pre-fetch the new transitions
            fetchTransitions(taskId);
        } catch (error) {
            console.error("Failed to update task:", error);
            toast.error("Failed to update task status.");
            // Revert on failure
            fetchTasks();
        }
    };

    const handleDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId) return;

        const newStatus = destination.droppableId as Task['status'];
        const task = tasks.find(t => String(t.id) === draggableId);
        
        const allowed = taskTransitions[draggableId] || [];
        const isAllowed = task?.status === newStatus || allowed.includes(newStatus);
        
        if (isAllowed) {
            moveTask(draggableId, newStatus);
        } else {
            toast.error("Transition to this status is not allowed by the workflow.");
        }
    };

    const handleInlineCreate = async (e: React.FormEvent, status: Task['status']) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || !selectedProjectId) {
            if (!selectedProjectId) toast.error("Please select a project first.");
            return;
        }

        try {
            await createTask({
                title: newTaskTitle,
                status: status,
                project_id: selectedProjectId,
                priority: 'medium'
            });
            toast.success("Task created.");
            setNewTaskTitle("");
            setCreatingInColumn(null);
            fetchTasks(); // Refresh
        } catch (error) {
            console.error("Failed to create task:", error);
            toast.error("Failed to create task.");
        }
    };

    const columns: { id: Task['status'], label: string, icon: any, color: string }[] = [
        { id: 'TODO', label: 'To Do', icon: Circle, color: 'text-zinc-500' },
        { id: 'IN_PROGRESS', label: 'In Progress', icon: Clock, color: 'text-blue-500' },
        { id: 'BLOCKED', label: 'Blocked', icon: AlertCircle, color: 'text-orange-500' },
        { id: 'DONE', label: 'Done', icon: CheckCircle2, color: 'text-emerald-500' },
        { id: 'CANCELLED', label: 'Cancelled', icon: XCircle, color: 'text-zinc-400' },
    ];

    if (!isMounted) return null;

    return (
        <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] p-8 pt-6">
            <div className="flex items-center justify-between mb-8 shrink-0">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">My Tasks</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        Track and manage your work across all projects.
                    </p>
                </div>
                <Button 
                    onClick={() => {
                        if (projects.length === 0) {
                            toast.error("You need a project to create tasks.");
                            return;
                        }
                        setCreatingInColumn('TODO');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-md gap-2 rounded-xl h-11 px-6"
                >
                    <Plus className="h-4 w-4" />
                    New Task
                </Button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-4 mb-6 bg-white dark:bg-white/5 p-4 rounded-2xl border border-zinc-200 dark:border-white/10 shrink-0">
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm font-medium mr-2">
                    <Filter className="h-4 w-4" />
                    <span>Filters:</span>
                </div>
                
                {/* Project Filter */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 uppercase font-bold">Project</span>
                    <select 
                        value={filters.project_id}
                        onChange={(e) => setFilters(prev => ({ ...prev, project_id: e.target.value }))}
                        className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all min-w-[150px]"
                    >
                        <option value="" className="dark:bg-zinc-900">All Projects</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id} className="dark:bg-zinc-900">{p.name}</option>
                        ))}
                    </select>
                </div>

                {/* Assignee Filter */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 uppercase font-bold">Assignee</span>
                    <div className="relative flex items-center">
                        <Users className="absolute left-3 h-3.5 w-3.5 text-zinc-400" />
                        <select 
                            value={filters.assignee_id}
                            onChange={(e) => setFilters(prev => ({ ...prev, assignee_id: e.target.value }))}
                            className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all min-w-[150px]"
                        >
                            <option value="" className="dark:bg-zinc-900">All Assignees</option>
                            {members.map(m => (
                                <option key={m.id} value={m.user_id} className="dark:bg-zinc-900">{m.user?.name || m.user?.email}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Clear Filters */}
                {(filters.project_id || filters.assignee_id || filters.sort_by !== "created_at" || filters.sort_dir !== "desc") && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setFilters({ project_id: "", assignee_id: "", sort_by: "created_at", sort_dir: "desc" })}
                        className="text-zinc-500 hover:text-red-500 gap-2 h-9 px-3 rounded-xl ml-auto"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Clear Filters
                    </Button>
                )}
            </div>

            {/* Sorting Bar */}
            <div className="flex flex-wrap items-center gap-4 mb-8 bg-zinc-50/50 dark:bg-white/[0.02] p-3 px-4 rounded-xl border border-dashed border-zinc-200 dark:border-white/10 shrink-0">
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                    <MoreHorizontal className="h-3 w-3" />
                    <span>Sorting</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 font-medium">Sort by:</span>
                    <select 
                        value={filters.sort_by}
                        onChange={(e) => setFilters(prev => ({ ...prev, sort_by: e.target.value }))}
                        className="bg-transparent border-none text-sm text-zinc-600 dark:text-zinc-300 outline-none focus:ring-0 cursor-pointer hover:text-blue-500 transition-colors"
                    >
                        <option value="created_at" className="dark:bg-zinc-900">Creation Date</option>
                        <option value="updated_at" className="dark:bg-zinc-900">Last Updated</option>
                        <option value="title" className="dark:bg-zinc-900">Title</option>
                        <option value="status" className="dark:bg-zinc-900">Status</option>
                    </select>
                </div>

                <div className="flex items-center gap-2 border-l border-zinc-200 dark:border-white/10 pl-4">
                    <span className="text-xs text-zinc-500 font-medium">Order:</span>
                    <select 
                        value={filters.sort_dir}
                        onChange={(e) => setFilters(prev => ({ ...prev, sort_dir: e.target.value }))}
                        className="bg-transparent border-none text-sm text-zinc-600 dark:text-zinc-300 outline-none focus:ring-0 cursor-pointer hover:text-blue-500 transition-colors"
                    >
                        <option value="desc" className="dark:bg-zinc-900">Descending</option>
                        <option value="asc" className="dark:bg-zinc-900">Ascending</option>
                    </select>
                </div>
            </div>

            {/* Kanban Board */}
            {isLoading && tasks.length === 0 ? (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-zinc-100 dark:bg-white/5 rounded-2xl h-full" />
                    ))}
                </div>
            ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex-1 flex overflow-x-auto gap-6 pb-4">
                        {columns.map(col => {
                            const colTasks = tasks.filter(t => t.status === col.id);
                            const Icon = col.icon;
                            
                            return (
                                <Droppable key={col.id} droppableId={col.id}>
                                    {(provided, snapshot) => (
                                        <div 
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`flex flex-col bg-zinc-50/50 dark:bg-[#0a0a0a]/50 border border-zinc-200 dark:border-white/10 rounded-3xl p-4 h-full w-[350px] shrink-0 shadow-sm transition-colors ${snapshot.isDraggingOver ? 'bg-zinc-100/50 dark:bg-[#1a1a1a]/50 border-blue-500/50' : ''}`}
                                        >
                                            <div className="flex items-center justify-between mb-4 px-2 shrink-0">
                                                <div className="flex items-center gap-2">
                                                    <Icon className={`h-5 w-5 ${col.color}`} />
                                                    <h3 className="font-semibold text-zinc-900 dark:text-white">{col.label}</h3>
                                                    <span className="bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 text-xs py-0.5 px-2 rounded-full font-medium">
                                                        {colTasks.length}
                                                    </span>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10" onClick={() => setCreatingInColumn(col.id)}>
                                                    <Plus className="h-4 w-4 text-zinc-500" />
                                                </Button>
                                            </div>

                                            <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-4">
                                                {colTasks.length === 0 && !snapshot.isDraggingOver && (
                                                    <div className="h-24 border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-2xl flex items-center justify-center text-zinc-400 text-sm">
                                                        Drop tasks here
                                                    </div>
                                                )}
                                                
                                                {colTasks.map((task, index) => (
                                                    <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div 
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                style={{...provided.draggableProps.style}}
                                                                onMouseEnter={() => fetchTransitions(task.id)}
                                                                onClick={() => setSelectedTaskId(task.id)}
                                                                className={`bg-white dark:bg-[#0f0f0f] p-4 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all group relative overflow-hidden ${snapshot.isDragging ? 'shadow-xl ring-2 ring-blue-500 scale-[1.02] opacity-90 rotate-1 z-50' : ''}`}
                                                            >
                                                                {/* Left border indicator based on priority */}
                                                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                                                    task.priority === 'high' ? 'bg-red-500' :
                                                                    task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                                                                }`} />
                                                                
                                                                <div className="flex justify-between items-start mb-2 pl-2">
                                                                    <h4 className="font-medium text-zinc-900 dark:text-white line-clamp-2">
                                                                        {task.title}
                                                                    </h4>
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-1 shrink-0">
                                                                        <MoreHorizontal className="h-4 w-4 text-zinc-400" />
                                                                    </Button>
                                                                </div>
                                                                
                                                                {task.description && (
                                                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4 pl-2">
                                                                        {task.description}
                                                                    </p>
                                                                )}

                                                                <div className="flex items-center justify-between pl-2 mt-4">
                                                                    {/* Assignees placeholder (visual only for now in card) */}
                                                                    <div className="flex -space-x-2">
                                                                        {task.assignees?.slice(0, 3).map(a => (
                                                                            <div key={a.id} className="h-6 w-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold border-2 border-white dark:border-[#0f0f0f]" title={a.name}>
                                                                                {a.name.substring(0, 2).toUpperCase()}
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    {/* Status Dropdown */}
                                                                    <select
                                                                        value={task.status}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            fetchTransitions(task.id);
                                                                        }}
                                                                        onMouseEnter={() => fetchTransitions(task.id)}
                                                                        onChange={(e) => {
                                                                            e.stopPropagation();
                                                                            moveTask(task.id, e.target.value as Task['status']);
                                                                        }}
                                                                        className="text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-md py-1 px-2 text-zinc-600 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                                                    >
                                                                        {columns.map(c => {
                                                                            const allowed = taskTransitions[String(task.id)];
                                                                            const isAllowed = allowed ? (allowed.includes(c.id) || task.status === c.id) : true;
                                                                            return (
                                                                                <option key={c.id} value={c.id} disabled={!isAllowed} className="dark:bg-zinc-900 dark:text-white">
                                                                                    {c.label} {!isAllowed && '(Locked)'}
                                                                                </option>
                                                                            );
                                                                        })}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}

                                                {/* Inline Create Input */}
                                                {creatingInColumn === col.id && (
                                                    <div className="bg-white dark:bg-[#0f0f0f] p-3 rounded-2xl border border-blue-500 shadow-sm mt-2">
                                                        <form onSubmit={(e) => handleInlineCreate(e, col.id)} className="flex flex-col gap-2">
                                                            <input
                                                                type="text"
                                                                autoFocus
                                                                value={newTaskTitle}
                                                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                                                placeholder="Task name..."
                                                                className="w-full text-sm bg-transparent border-none outline-none focus:ring-0 text-zinc-900 dark:text-white"
                                                            />
                                                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100 dark:border-white/5">
                                                                <select
                                                                    value={selectedProjectId}
                                                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                                                    className="text-xs bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-md py-1 px-2 text-zinc-600 dark:text-zinc-300 max-w-[120px]"
                                                                >
                                                                    {projects.map(p => (
                                                                        <option key={p.id} value={p.id} className="truncate">{p.name}</option>
                                                                    ))}
                                                                </select>
                                                                <div className="flex items-center gap-1">
                                                                    <Button type="button" variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setCreatingInColumn(null)}>Cancel</Button>
                                                                    <Button type="submit" size="sm" className="h-6 text-xs px-2 bg-blue-600 hover:bg-blue-700 text-white rounded">Save</Button>
                                                                </div>
                                                            </div>
                                                        </form>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </Droppable>
                            );
                        })}
                    </div>
                </DragDropContext>
            )}
            
            <TaskDetailsModal 
                isOpen={!!selectedTaskId}
                task={selectedTask}
                onClose={() => setSelectedTaskId(null)}
                onUpdate={fetchTasks}
            />
        </div>
    );
}

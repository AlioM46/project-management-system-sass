"use client";

import { useState, useEffect, useRef } from "react";
import { X, CheckSquare, MoreHorizontal, Calendar, User, Flag, Paperclip, Send, Plus, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Task } from "@/features/tasks/types";
import { toast } from "sonner";
import { updateTask, replaceTaskAssignees, getTaskTransitions } from "@/features/tasks/api/tasks.api";
import { getMembers } from "@/features/team/api/team.api";
import { Member } from "@/features/team/types";

interface TaskDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task | null;
    onUpdate?: () => void;
}

export function TaskDetailsModal({ isOpen, onClose, task, onUpdate }: TaskDetailsModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    
    // Team Members
    const [members, setMembers] = useState<Member[]>([]);

    // Clickup style dropdown states
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isPriorityOpen, setIsPriorityOpen] = useState(false);
    const [isAssigneesOpen, setIsAssigneesOpen] = useState(false);

    // Transitions state
    const [allowedTransitions, setAllowedTransitions] = useState<string[]>([]);
    const [isLoadingTransitions, setIsLoadingTransitions] = useState(false);

    // To prevent duplicate saves, we use a ref to track if we're currently saving
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || "");
        }
    }, [task]);

    useEffect(() => {
        if (isOpen) {
            getMembers().then(res => setMembers(res.members || [])).catch(() => {});
        }
    }, [isOpen]);

    // Close custom dropdowns on click outside
    useEffect(() => {
        const closeDropdowns = () => {
            setIsStatusOpen(false);
            setIsPriorityOpen(false);
            setIsAssigneesOpen(false);
        };
        document.addEventListener('click', closeDropdowns);
        return () => document.removeEventListener('click', closeDropdowns);
    }, []);

    // Debounced Save
    useEffect(() => {
        if (!task || !isOpen) return;
        
        // If nothing changed, don't save
        if (title === task.title && description === (task.description || "")) {
            return;
        }

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            handleSave(title, description);
        }, 1000);

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [title, description, task, isOpen]);

    if (!isOpen || !task) return null;

    const handleSave = async (currentTitle: string, currentDesc: string) => {
        if (!currentTitle.trim() || (currentTitle === task.title && currentDesc === (task.description || ""))) {
            return;
        }
        
        setIsSaving(true);
        try {
            await updateTask(task.id, { title: currentTitle, description: currentDesc });
            toast.success("Task updated.");
            onUpdate?.();
        } catch (error) {
            toast.error("Failed to update task.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleForceClose = () => {
        // Clear timeout and force a save if needed
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        if (title !== task.title || description !== (task.description || "")) {
            handleSave(title, description);
        }
        onClose();
    };

    const toggleAssignee = async (memberUserId: string) => {
        try {
            const currentAssignees = task.assignees?.map(a => a.id) || [];
            let newAssignees;
            if (currentAssignees.includes(memberUserId)) {
                newAssignees = currentAssignees.filter(id => id !== memberUserId);
            } else {
                newAssignees = [...currentAssignees, memberUserId];
            }
            await replaceTaskAssignees(task.id, newAssignees);
            toast.success("Assignees updated.");
            onUpdate?.();
        } catch (error) {
            toast.error("Failed to update assignees.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleForceClose} />
            <div className="relative bg-white dark:bg-[#0a0a0a] rounded-2xl w-full max-w-3xl shadow-xl border border-zinc-200 dark:border-white/10 overflow-hidden flex flex-col h-[85vh] sm:h-[80vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-white/10 shrink-0">
                    <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium">
                        <CheckSquare className="h-4 w-4" />
                        <span>Task-{task.id}</span>
                        <span className="bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded-full text-xs">
                            {task.project_id ? `Project #${task.project_id}` : 'General'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleForceClose} className="h-8 w-8 rounded-full hover:bg-zinc-100 dark:hover:bg-white/5">
                            <X className="h-4 w-4 text-zinc-500" />
                        </Button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
                    {/* Main Content Area */}
                    <div className="flex-1 p-6 space-y-6 md:border-r border-zinc-200 dark:border-white/10">
                        {/* Title */}
                        <div>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full text-2xl font-bold bg-transparent border-none outline-none focus:ring-0 text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                                placeholder="Task title"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">Description</h3>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add a more detailed description..."
                                className="w-full min-h-[150px] p-3 bg-zinc-50 dark:bg-[#0f0f0f] border border-zinc-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-y"
                            />
                        </div>

                        {/* Comments Placeholder */}
                        <div className="pt-6 border-t border-zinc-200 dark:border-white/10">
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Activity & Comments</h3>
                            <div className="flex gap-3 items-start">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1">
                                    ME
                                </div>
                                <div className="flex-1 bg-white dark:bg-[#0f0f0f] border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 shadow-sm transition-shadow">
                                    <textarea 
                                        placeholder="Write a comment or type @ to mention..."
                                        className="w-full min-h-[80px] p-3 text-sm bg-transparent border-none outline-none resize-y text-zinc-900 dark:text-white placeholder:text-zinc-400"
                                    />
                                    <div className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-white/[0.02] border-t border-zinc-200 dark:border-white/10">
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                                                <Paperclip className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                                                <span className="font-bold">@</span>
                                            </Button>
                                        </div>
                                        <Button size="sm" className="h-8 gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                                            <Send className="h-3 w-3" />
                                            Comment
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Area */}
                    <div className="w-full md:w-64 bg-zinc-50/50 dark:bg-transparent p-6 space-y-8">
                        
                        {/* Status (Clickup Style) */}
                        <div>
                            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Status</h4>
                            <div className="relative inline-block w-full">
                                <Button 
                                    variant="outline" 
                                    className={`w-full justify-start text-left font-medium border-0 shadow-sm ${
                                        task.status === 'DONE' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' :
                                        task.status === 'IN_PROGRESS' ? 'bg-blue-500 hover:bg-blue-600 text-white' : 
                                        task.status === 'BLOCKED' ? 'bg-orange-500 hover:bg-orange-600 text-white' :
                                        task.status === 'CANCELLED' ? 'bg-zinc-400 hover:bg-zinc-500 text-white' :
                                        'bg-zinc-200 hover:bg-zinc-300 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200'
                                    }`}
                                    onClick={async (e) => { 
                                        e.stopPropagation(); 
                                        const opening = !isStatusOpen;
                                        setIsStatusOpen(opening); 
                                        setIsPriorityOpen(false); 
                                        setIsAssigneesOpen(false); 
                                        
                                        if (opening) {
                                            setIsLoadingTransitions(true);
                                            try {
                                                const res = await getTaskTransitions(task.id);
                                                setAllowedTransitions(res.allowed_transitions);
                                            } catch(error) {
                                                setAllowedTransitions([]);
                                                toast.error("Failed to load allowed transitions.");
                                            } finally {
                                                setIsLoadingTransitions(false);
                                            }
                                        }
                                    }}
                                >
                                    {task.status.replace('_', ' ').toUpperCase()}
                                </Button>

                                {isStatusOpen && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-[#0f0f0f] border border-zinc-200 dark:border-white/10 rounded-xl shadow-lg overflow-hidden z-20">
                                        <div className="flex flex-col">
                                            {isLoadingTransitions ? (
                                                <div className="p-3 text-sm text-center text-zinc-500">Loading transitions...</div>
                                            ) : (
                                                [
                                                    { id: 'TODO', label: 'TO DO', color: 'bg-zinc-200 dark:bg-zinc-700' },
                                                    { id: 'IN_PROGRESS', label: 'IN PROGRESS', color: 'bg-blue-500' },
                                                    { id: 'BLOCKED', label: 'BLOCKED', color: 'bg-orange-500' },
                                                    { id: 'DONE', label: 'DONE', color: 'bg-emerald-500' },
                                                    { id: 'CANCELLED', label: 'CANCELLED', color: 'bg-zinc-400' }
                                                ].map(s => {
                                                    const isAllowed = allowedTransitions.includes(s.id) || task.status === s.id;
                                                    return (
                                                        <button
                                                            key={s.id}
                                                            disabled={!isAllowed}
                                                            className={`flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 ${isAllowed ? 'hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer' : 'opacity-50 cursor-not-allowed bg-zinc-50 dark:bg-[#0a0a0a]'}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (!isAllowed) return;
                                                                updateTask(task.id, { status: s.id as any }).then(onUpdate);
                                                                setIsStatusOpen(false);
                                                            }}
                                                        >
                                                            <span className={`h-2 w-2 rounded-full ${s.color}`} />
                                                            {s.label}
                                                            {!isAllowed && task.status !== s.id && <span className="ml-auto text-[10px] uppercase text-zinc-400">Locked</span>}
                                                            {task.status === s.id && <span className="ml-auto text-[10px] uppercase text-blue-500">Current</span>}
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Assignees (Clickup Style) */}
                        <div>
                            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Assignees</h4>
                            <div className="relative flex flex-wrap gap-2 items-center w-full">
                                {task.assignees?.map(a => (
                                    <div key={a.id} className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-[#0a0a0a] shadow-sm cursor-pointer hover:scale-110 transition-transform" title={a.name}>
                                        {a.name.substring(0, 2).toUpperCase()}
                                    </div>
                                ))}
                                
                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-dashed border-2 hover:bg-zinc-100 dark:hover:bg-white/5" onClick={(e) => { e.stopPropagation(); setIsAssigneesOpen(!isAssigneesOpen); setIsStatusOpen(false); setIsPriorityOpen(false); }}>
                                    <Plus className="h-4 w-4 text-zinc-500" />
                                </Button>

                                {isAssigneesOpen && (
                                    <div className="absolute top-full left-0 w-64 mt-1 bg-white dark:bg-[#0f0f0f] border border-zinc-200 dark:border-white/10 rounded-xl shadow-lg overflow-hidden z-20 max-h-48 overflow-y-auto">
                                        <div className="flex flex-col">
                                            {members.length === 0 ? (
                                                <div className="p-3 text-sm text-zinc-500 text-center">No members found</div>
                                            ) : (
                                                members.map(m => {
                                                    const isAssigned = task.assignees?.some(a => a.id === m.user_id);
                                                    return (
                                                        <button
                                                            key={m.id}
                                                            className={`flex items-center justify-between px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 ${isAssigned ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleAssignee(m.user_id);
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
                                                                    {m.user?.name?.substring(0, 2).toUpperCase() || 'U'}
                                                                </div>
                                                                <span className="truncate max-w-[120px]">{m.user?.name || m.user?.email}</span>
                                                            </div>
                                                            {isAssigned && <CheckSquare className="h-4 w-4 text-blue-500" />}
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Priority (Clickup Style Flags) */}
                        <div>
                            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Priority</h4>
                            <div className="relative inline-block w-full">
                                <Button 
                                    variant="ghost" 
                                    className="w-full justify-start text-left px-2 hover:bg-zinc-100 dark:hover:bg-white/5"
                                    onClick={(e) => { e.stopPropagation(); setIsPriorityOpen(!isPriorityOpen); setIsStatusOpen(false); setIsAssigneesOpen(false); }}
                                >
                                    <Flag className={`h-4 w-4 mr-2 ${
                                        task.priority === 'high' ? 'text-red-500 fill-red-500' :
                                        task.priority === 'medium' ? 'text-amber-500 fill-amber-500' : 
                                        'text-blue-500 fill-blue-500'
                                    }`} />
                                    <span className="capitalize">{task.priority} Priority</span>
                                </Button>

                                {isPriorityOpen && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-[#0f0f0f] border border-zinc-200 dark:border-white/10 rounded-xl shadow-lg overflow-hidden z-20">
                                        <div className="flex flex-col">
                                            {[
                                                { id: 'high', label: 'Urgent', color: 'text-red-500 fill-red-500' },
                                                { id: 'medium', label: 'High', color: 'text-amber-500 fill-amber-500' },
                                                { id: 'low', label: 'Normal', color: 'text-blue-500 fill-blue-500' }
                                            ].map(p => (
                                                <button
                                                    key={p.id}
                                                    className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateTask(task.id, { priority: p.id as any }).then(onUpdate);
                                                        setIsPriorityOpen(false);
                                                    }}
                                                >
                                                    <Flag className={`h-4 w-4 ${p.color}`} />
                                                    {p.label}
                                                </button>
                                            ))}
                                            <button
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 border-t border-zinc-100 dark:border-white/10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsPriorityOpen(false);
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                                Clear
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Dates */}
                        <div>
                            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Dates</h4>
                            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 bg-white dark:bg-[#0f0f0f] px-3 py-2 border border-zinc-200 dark:border-white/10 rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                                <Calendar className="h-4 w-4" />
                                <span>No due date</span>
                            </div>
                        </div>
                    </div>
                </div>
                
            </div>
        </div>
    );
}

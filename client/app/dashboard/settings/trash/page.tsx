"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  FolderKanban,
  CheckSquare,
  Clock,
  Search,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getTrashedItems,
  restoreTrashedItem,
  forceDeleteTrashedItem,
  emptyTrash,
} from "@/features/trash/api/trash.api";
import { TrashedItem, TrashedItemType } from "@/features/trash/types";
import { toast } from "sonner";

export default function TrashPage() {
  const [items, setItems] = useState<TrashedItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [isEmptyingTrash, setIsEmptyingTrash] = useState<boolean>(false);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState<boolean>(false);
  const [itemToPurge, setItemToPurge] = useState<TrashedItem | null>(null);

  const loadTrash = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getTrashedItems(filterType);
      setItems(res.items || []);
    } catch (error) {
      console.error("Failed to load trash:", error);
      toast.error("Failed to load trashed items.");
    } finally {
      setIsLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    let isCancelled = false;

    async function fetch() {
      setIsLoading(true);
      try {
        const res = await getTrashedItems(filterType);
        if (!isCancelled) {
          setItems(res.items || []);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to load trash:", error);
          toast.error("Failed to load trashed items.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    fetch();

    return () => {
      isCancelled = true;
    };
  }, [filterType]);

  const handleRestore = async (item: TrashedItem) => {
    const actionKey = `restore-${item.type}-${item.id}`;
    setIsActionLoading(actionKey);
    try {
      const res = await restoreTrashedItem(item.type, item.id);
      toast.success(res.message || `${item.title} restored successfully!`);
      // Optimistic update
      setItems((prev) =>
        prev.filter((i) => !(i.type === item.type && i.id === item.id)),
      );
    } catch (error) {
      console.error("Failed to restore item:", error);
      toast.error("Failed to restore item.");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleForceDelete = async () => {
    if (!itemToPurge) return;
    const actionKey = `purge-${itemToPurge.type}-${itemToPurge.id}`;
    setIsActionLoading(actionKey);
    try {
      await forceDeleteTrashedItem(itemToPurge.type, itemToPurge.id);
      toast.success(`${itemToPurge.title} permanently deleted.`);
      setItems((prev) =>
        prev.filter(
          (i) => !(i.type === itemToPurge.type && i.id === itemToPurge.id),
        ),
      );
      setItemToPurge(null);
    } catch (error) {
      console.error("Failed to purge item:", error);
      toast.error("Failed to permanently delete item.");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleEmptyTrash = async () => {
    setIsEmptyingTrash(true);
    try {
      const res = await emptyTrash();
      toast.success(res.message || "Trash emptied successfully.");
      setItems([]);
      setShowEmptyConfirm(false);
    } catch (error) {
      console.error("Failed to empty trash:", error);
      toast.error("Failed to empty trash.");
    } finally {
      setIsEmptyingTrash(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.project_name &&
        item.project_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Policy Banner */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 p-5 sm:p-6 text-zinc-900 dark:text-zinc-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 mt-0.5">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                30-Day Retention Policy
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5 max-w-xl">
                Deleted projects and tasks remain in Trash for 30 days before
                being permanently purged. You can restore items or delete them
                permanently at any time.
              </p>
            </div>
          </div>

          {items.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowEmptyConfirm(true)}
              className="shrink-0 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Empty Trash ({items.length})
            </Button>
          )}
        </div>
      </div>

      {/* Controls Bar: Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-white/5">
          {[
            { key: "all", label: "All Items" },
            { key: "tasks", label: "Tasks Only" },
            { key: "projects", label: "Projects Only" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                filterType === tab.key
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-semibold"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Filter trashed items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadTrash}
            disabled={isLoading}
            className="h-9 px-3 rounded-xl border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Items List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-white/5">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Loading trashed items...
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-white/5 text-center px-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3.5">
            <Trash2 className="w-7 h-7" />
          </div>
          <h4 className="text-base font-semibold text-zinc-900 dark:text-white">
            {searchQuery
              ? "No matching items found"
              : "Trash is completely empty"}
          </h4>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
            {searchQuery
              ? "Try adjusting your search query or filter tab."
              : "Deleted projects and tasks will appear here for 30 days before being automatically purged."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-200 dark:divide-white/5 bg-white dark:bg-zinc-900/40 rounded-2xl border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm">
          {filteredItems.map((item) => {
            const isTask = item.type === "task";
            const isRestoring =
              isActionLoading === `restore-${item.type}-${item.id}`;

            return (
              <div
                key={`${item.type}-${item.id}`}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      isTask
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                    }`}
                  >
                    {isTask ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <FolderKanban className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isTask
                            ? "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300"
                            : "bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300"
                        }`}
                      >
                        {item.type}
                      </span>

                      {item.project_name && (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          in{" "}
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">
                            {item.project_name}
                          </span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mt-1 truncate">
                      {item.title}
                    </h4>

                    <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {item.days_remaining}{" "}
                        {item.days_remaining === 1 ? "day" : "days"} left
                      </span>
                      <span>&bull;</span>
                      <span>
                        Deleted {new Date(item.deleted_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(item)}
                    disabled={!!isActionLoading}
                    className="h-8 text-xs font-medium rounded-xl border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-900 dark:text-white"
                  >
                    <RotateCcw
                      className={`w-3.5 h-3.5 mr-1.5 ${isRestoring ? "animate-spin" : ""}`}
                    />
                    Restore
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setItemToPurge(item)}
                    disabled={!!isActionLoading}
                    className="h-8 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Delete Forever
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal: Permanently Delete Single Item */}
      {itemToPurge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Permanently Delete{" "}
                  {itemToPurge.type === "project" ? "Project" : "Task"}?
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Are you sure you want to permanently delete{" "}
                  <strong className="text-zinc-900 dark:text-white">
                    {itemToPurge.title}
                  </strong>
                  ? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setItemToPurge(null)}
                className="rounded-xl border-zinc-200 dark:border-white/10"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleForceDelete}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
              >
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Empty All Trash */}
      {showEmptyConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Empty Entire Workspace Trash?
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  This will permanently destroy all{" "}
                  <strong className="text-zinc-900 dark:text-white">
                    {items.length} trashed items
                  </strong>{" "}
                  in this workspace. All data and attachments will be deleted
                  immediately.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEmptyConfirm(false)}
                disabled={isEmptyingTrash}
                className="rounded-xl border-zinc-200 dark:border-white/10"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEmptyTrash}
                disabled={isEmptyingTrash}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
              >
                {isEmptyingTrash ? "Emptying..." : "Yes, Empty Trash"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

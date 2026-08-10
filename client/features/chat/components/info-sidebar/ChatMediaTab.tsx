"use client";

import { useState } from "react";
import { Image as ImageIcon, Video, Mic, FileText, ExternalLink } from "lucide-react";
import { VoicePlayerCard } from "../VoicePlayerCard";
import { formatFileSize } from "../../utils/chatHelpers";

type MediaTab = "images" | "videos" | "audio" | "docs";

interface ChatMediaTabProps {
    mediaAttachments: any[];
    docAttachments: any[];
    onPreviewAttachment: (att: any) => void;
}

export function ChatMediaTab({ mediaAttachments, docAttachments, onPreviewAttachment }: ChatMediaTabProps) {
    const [mediaSubTab, setMediaSubTab] = useState<MediaTab>("images");

    const images = mediaAttachments.filter((a) => a.file_type?.startsWith("image/"));
    const videos = mediaAttachments.filter((a) => a.file_type?.startsWith("video/"));
    const audios = mediaAttachments.filter(
        (a) => a.file_type?.startsWith("audio/") || a.original_name?.includes("voice_note")
    );

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Media Sub-Tab Bar */}
            <div className="flex gap-1 px-4 py-2 border-b border-zinc-100 dark:border-white/5 shrink-0 overflow-x-auto scrollbar-none">
                {[
                    { key: "images", icon: <ImageIcon className="h-3.5 w-3.5" />, label: "Photos", count: images.length },
                    { key: "videos", icon: <Video className="h-3.5 w-3.5" />, label: "Videos", count: videos.length },
                    { key: "audio", icon: <Mic className="h-3.5 w-3.5" />, label: "Audio", count: audios.length },
                    { key: "docs", icon: <FileText className="h-3.5 w-3.5" />, label: "Docs", count: docAttachments.length },
                ].map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setMediaSubTab(t.key as MediaTab)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${mediaSubTab === t.key
                                ? "bg-blue-600 text-white shadow-xs"
                                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5"
                            }`}
                    >
                        {t.icon}
                        <span>{t.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${mediaSubTab === t.key ? "bg-white/20 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"}`}>
                            {t.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Gallery Views */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                {mediaSubTab === "images" && (
                    images.length === 0 ? (
                        <p className="text-xs text-zinc-400 text-center py-12">No shared photos.</p>
                    ) : (
                        <div className="grid grid-cols-3 gap-2">
                            {images.map((att) => (
                                <div
                                    key={att.id}
                                    onClick={() => onPreviewAttachment(att)}
                                    className="aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 cursor-pointer group relative"
                                >
                                    <img src={att.download_url} alt={att.original_name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                                </div>
                            ))}
                        </div>
                    )
                )}

                {mediaSubTab === "videos" && (
                    videos.length === 0 ? (
                        <p className="text-xs text-zinc-400 text-center py-12">No shared videos.</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            {videos.map((att) => (
                                <div
                                    key={att.id}
                                    onClick={() => onPreviewAttachment(att)}
                                    className="aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-zinc-200 dark:border-white/10 cursor-pointer relative group flex items-center justify-center"
                                >
                                    <video src={att.download_url} className="h-full w-full object-cover opacity-80" />
                                </div>
                            ))}
                        </div>
                    )
                )}

                {mediaSubTab === "audio" && (
                    audios.length === 0 ? (
                        <p className="text-xs text-zinc-400 text-center py-12">No shared voice messages.</p>
                    ) : (
                        <div className="space-y-2">
                            {audios.map((att) => (
                                <div key={att.id} className="p-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5">
                                    <VoicePlayerCard url={att.download_url} />
                                </div>
                            ))}
                        </div>
                    )
                )}

                {mediaSubTab === "docs" && (
                    docAttachments.length === 0 ? (
                        <p className="text-xs text-zinc-400 text-center py-12">No shared documents.</p>
                    ) : (
                        <div className="space-y-2">
                            {docAttachments.map((att) => (
                                <div
                                    key={att.id}
                                    onClick={() => onPreviewAttachment(att)}
                                    className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{att.original_name}</p>
                                            <p className="text-[10px] text-zinc-400">{formatFileSize(att.file_size)}</p>
                                        </div>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-zinc-400 shrink-0 ml-2" />
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

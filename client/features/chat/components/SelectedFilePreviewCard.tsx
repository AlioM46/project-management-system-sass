import { FileText, X } from "lucide-react";
import { useEffect, useState } from "react";

interface SelectedFilePreviewCardProps {
    file: File;
    onRemove: () => void;
    getFileIcon: (type: string) => string;
}

export function SelectedFilePreviewCard({ file, onRemove, getFileIcon }: SelectedFilePreviewCardProps) {
    const [previewUrl, setPreviewUrl] = useState<string>("");

    useEffect(() => {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => {
            URL.revokeObjectURL(url);
        };
    }, [file]);

    const isImage = file.type?.startsWith('image/') || file.name?.toLowerCase().match(/\.(png|jpe?g|gif|webp|bmp|svg)$/i);
    const isVideo = file.type?.startsWith('video/') || file.name?.toLowerCase().match(/\.(mp4|webm|mov|avi|m4v)$/i);
    const isPDF = file.type?.includes('pdf') || file.name?.toLowerCase().endsWith('.pdf');

    return (
        <div className="relative group h-16 w-16 bg-white dark:bg-zinc-700 rounded-xl border border-zinc-200 dark:border-zinc-600 shadow-sm flex items-center justify-center overflow-hidden">
            {isImage ? (
                previewUrl && <img className="h-full w-full object-cover" src={previewUrl} alt={file.name} />
            ) : isVideo ? (
                previewUrl && <video className="h-full w-full object-cover bg-black" src={previewUrl} />
            ) : isPDF ? (
                <div className="h-full w-full flex flex-col items-center justify-center bg-red-50 dark:bg-red-950/40 text-red-500 text-[10px] font-bold">
                    <FileText className="h-5 w-5 mb-0.5" />
                    <span>PDF</span>
                </div>
            ) : (
                <div className="h-full w-full flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-950/40 text-blue-500 text-[10px] font-bold">
                    <FileText className="h-5 w-5 mb-0.5" />
                    <span>{getFileIcon(file.type)}</span>
                </div>
            )}
            <button
                onClick={onRemove}
                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 hover:bg-red-500 text-white flex items-center justify-center transition-colors shadow-sm"
                title="Remove attachment"
            >
                <X className="h-3 w-3" />
            </button>
        </div>
    );
}

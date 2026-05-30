"use client";

import { useEffect, useState } from "react";

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageAttachment(fileType?: string, fileName?: string): boolean {
    return Boolean(fileType?.startsWith("image/") || fileName?.match(/\.(png|jpe?g|gif|webp|bmp|svg)$/i));
}

export function isVideoAttachment(fileType?: string, fileName?: string): boolean {
    return Boolean(fileType?.startsWith("video/") || fileName?.match(/\.(mp4|webm|mov|avi|m4v)$/i));
}

export function isPdfAttachment(fileType?: string, fileName?: string): boolean {
    return Boolean(fileType === "application/pdf" || fileName?.match(/\.pdf$/i));
}

export function AttachmentPreview({
    url,
    fileName,
    fileType,
}: {
    url?: string | null;
    fileName?: string;
    fileType?: string;
}) {
    if (!url) {
        return null;
    }

    if (isImageAttachment(fileType, fileName)) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={url} alt={fileName || "Attachment"} className="max-h-64 w-auto rounded-xl border border-zinc-200 object-cover dark:border-white/10" />;
    }

    if (isVideoAttachment(fileType, fileName)) {
        return (
            <video
                src={url}
                controls
                playsInline
                preload="metadata"
                className="max-h-72 w-full rounded-xl border border-zinc-200 bg-black dark:border-white/10"
            />
        );
    }

    if (isPdfAttachment(fileType, fileName)) {
        return (
            <iframe
                title={fileName || "PDF attachment"}
                src={url}
                className="h-72 w-full rounded-xl border border-zinc-200 bg-white dark:border-white/10"
            />
        );
    }

    return null;
}

export function DraftAttachmentPreview({ file }: { file: File }) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (
            !isImageAttachment(file.type, file.name) &&
            !isVideoAttachment(file.type, file.name) &&
            !isPdfAttachment(file.type, file.name)
        ) {
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            if (typeof reader.result === "string") {
                setPreviewUrl(reader.result);
            }
        };

        reader.onerror = () => {
            setPreviewUrl(null);
        };

        reader.readAsDataURL(file);

        return () => {
            reader.onload = null;
            reader.onerror = null;
        };
    }, [file]);

    return <AttachmentPreview url={previewUrl} fileName={file.name} fileType={file.type} />;
}

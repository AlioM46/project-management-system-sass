"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, Mic } from "lucide-react";

// ──────────────────────────────────────────────────────────────
// VoicePlayerCard — High-Contrast WhatsApp Style Voice Player
//
// Powered by WaveSurfer.js + Native HTML5 Media Element.
// Synchronizes audio progress from 0% to 100% accurately across the waveform.
// ──────────────────────────────────────────────────────────────

let currentlyActiveWavesurfer: WaveSurfer | null = null;

function formatTime(seconds: number): string {
    if (!seconds || !isFinite(seconds) || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

const SPEED_OPTIONS = [1, 1.5, 2] as const;

interface VoicePlayerCardProps {
    url: string;
    isMe?: boolean;
}

export function VoicePlayerCard({ url, isMe = false }: VoicePlayerCardProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mediaRef = useRef<HTMLAudioElement | null>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [speedIndex, setSpeedIndex] = useState(0);

    // ── Pre-compute instant waveform peaks for WaveSurfer ──────
    // Returns a flat number[] array (required by WaveSurfer v7)
    const peaks = useMemo(() => {
        const filename = url.split("/").pop() || url;
        let seed = 0;
        for (let i = 0; i < filename.length; i++) {
            seed = (seed << 5) - seed + filename.charCodeAt(i);
            seed |= 0;
        }
        const count = 30;
        const arr: number[] = [];
        for (let i = 0; i < count; i++) {
            const pseudoRandom = Math.abs(Math.sin(seed + (i + 1) * 3.7));
            arr.push(Math.max(0.18, Math.min(1.0, pseudoRandom)));
        }
        return arr; // Flat number[] array
    }, [url]);

    useEffect(() => {
        if (!containerRef.current || !mediaRef.current) return;

        const media = mediaRef.current;

        const wavesurfer = WaveSurfer.create({
            container: containerRef.current,
            media: media,
            peaks: [peaks], // WaveSurfer v7 expects Array of channel arrays: [ number[] ]
            waveColor: isMe ? "rgba(255, 255, 255, 0.45)" : "#94a3b8", // Slate-400
            progressColor: isMe ? "#ffffff" : "#2563eb",             // White / Blue
            height: 32,
            barWidth: 3,
            barGap: 2.5,
            barRadius: 2,
            cursorWidth: 2,
            cursorColor: isMe ? "#ffffff" : "#2563eb",
            dragToSeek: true,
        });

        wavesurferRef.current = wavesurfer;

        const handleDuration = () => {
            if (media.duration && isFinite(media.duration)) {
                setDuration(media.duration);
            }
        };

        media.onloadedmetadata = handleDuration;
        media.ondurationchange = handleDuration;

        wavesurfer.on("timeupdate", (time) => {
            setCurrentTime(time);
        });

        wavesurfer.on("play", () => {
            if (currentlyActiveWavesurfer && currentlyActiveWavesurfer !== wavesurfer) {
                currentlyActiveWavesurfer.pause();
            }
            currentlyActiveWavesurfer = wavesurfer;
            setIsPlaying(true);
        });

        wavesurfer.on("pause", () => {
            setIsPlaying(false);
            if (currentlyActiveWavesurfer === wavesurfer) {
                currentlyActiveWavesurfer = null;
            }
        });

        wavesurfer.on("finish", () => {
            setIsPlaying(false);
            setCurrentTime(0);
            currentlyActiveWavesurfer = null;
        });

        return () => {
            wavesurfer.destroy();
            if (currentlyActiveWavesurfer === wavesurfer) {
                currentlyActiveWavesurfer = null;
            }
        };
    }, [url, isMe, peaks]);

    const togglePlay = useCallback(() => {
        const ws = wavesurferRef.current;
        if (!ws) return;

        if (ws.isPlaying()) {
            ws.pause();
        } else {
            ws.play().catch((err) => {
                console.error("WaveSurfer play error:", err);
            });
        }
    }, []);

    const cycleSpeed = () => {
        const nextIndex = (speedIndex + 1) % SPEED_OPTIONS.length;
        setSpeedIndex(nextIndex);
        if (wavesurferRef.current) {
            wavesurferRef.current.setPlaybackRate(SPEED_OPTIONS[nextIndex]);
        }
    };

    const remainingTime = Math.max(0, duration - currentTime);
    const displayTime = isPlaying ? formatTime(remainingTime) : formatTime(duration);

    return (
        <div
            className={`flex items-center gap-3 py-2.5 px-3.5 rounded-2xl w-80 max-w-[340px] shadow-sm select-none transition-all border ${isMe
                ? "bg-blue-600 text-white border-blue-500/40"
                : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                }`}
        >
            {/* Hidden Native Audio Backend */}
            <audio ref={mediaRef} src={url} preload="metadata" />

            {/* Play / Pause Circle Button */}
            <button
                onClick={togglePlay}
                className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-sm cursor-pointer ${isMe
                    ? "bg-white text-blue-600 hover:bg-blue-50"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                title={isPlaying ? "Pause" : "Play"}
            >
                {isPlaying ? (
                    <Pause className="h-4 w-4 fill-current" />
                ) : (
                    <Play className="h-4 w-4 ml-0.5 fill-current" />
                )}
            </button>

            {/* Waveform & Info */}
            <div className="flex-1 min-w-0 flex flex-col gap-1">

                {/* WaveSurfer Waveform Canvas */}
                <div ref={containerRef} className="w-full h-8 cursor-pointer" />

                {/* Footer: Timestamp & Mic Label */}
                <div
                    className={`flex items-center justify-between text-[11px] font-mono leading-none ${isMe ? "text-blue-100" : "text-zinc-500 dark:text-zinc-400"
                        }`}
                >
                    <span className="font-semibold">{displayTime}</span>
                    <div className="flex items-center gap-1">
                        <Mic className="h-3 w-3 opacity-80" />
                        <span className="font-sans font-medium text-[10px]">Voice Note</span>
                    </div>
                </div>
            </div>

            {/* Playback Speed Pill */}
            <button
                onClick={cycleSpeed}
                className={`text-[11px] font-bold px-2 py-1 rounded-full shrink-0 transition-colors cursor-pointer border ${isMe
                    ? "bg-white/15 border-white/20 text-white hover:bg-white/25"
                    : "bg-zinc-100 dark:bg-zinc-700 border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200"
                    }`}
            >
                {SPEED_OPTIONS[speedIndex]}x
            </button>
        </div>
    );
}
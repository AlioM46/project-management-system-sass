"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Play, Pause, Mic } from "lucide-react";

// ──────────────────────────────────────────────────────────────
// VoicePlayerCard — WhatsApp-style custom voice message player
//
// Clean 20 vertical waveform bars with smooth progress coloring
// and interactive seek.
// ──────────────────────────────────────────────────────────────

let currentlyPlayingAudio: HTMLAudioElement | null = null;

function formatDuration(seconds: number): string {
    if (!seconds || !isFinite(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

const SPEED_OPTIONS = [1, 1.5, 2] as const;

interface VoicePlayerCardProps {
    url: string;
    isMe: boolean;
}

export function VoicePlayerCard({ url, isMe }: VoicePlayerCardProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [speedIndex, setSpeedIndex] = useState(0);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // ── Generate 20 WhatsApp style vertical waveform bars ────────
    // 20 bars look spacious, clean, and not dense
    const waveformBars = useMemo(() => {
        const count = 22;
        const bars: number[] = [];
        let hash = 0;
        for (let i = 0; i < url.length; i++) {
            hash = (hash << 5) - hash + url.charCodeAt(i);
            hash |= 0;
        }

        for (let i = 0; i < count; i++) {
            const pseudoRandom = Math.abs(Math.sin(hash + (i + 1) * 2.3));
            const heightPercent = Math.max(25, Math.min(100, Math.floor(pseudoRandom * 100)));
            bars.push(heightPercent);
        }
        return bars;
    }, [url]);

    useEffect(() => {
        const audio = new Audio(url);
        audioRef.current = audio;

        const updateMetadata = () => {
            if (audio.duration && isFinite(audio.duration)) {
                setDuration(audio.duration);
            }
        };

        audio.onloadedmetadata = updateMetadata;
        audio.ondurationchange = updateMetadata;

        audio.ontimeupdate = () => {
            setCurrentTime(audio.currentTime);
            if (!duration && audio.duration && isFinite(audio.duration)) {
                setDuration(audio.duration);
            }
        };

        audio.onended = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            currentlyPlayingAudio = null;
        };

        return () => {
            audio.pause();
            audio.src = "";
            if (currentlyPlayingAudio === audio) {
                currentlyPlayingAudio = null;
            }
        };
    }, [url, duration]);

    // Global pause listener
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handlePause = () => {
            if (!audio.ended) {
                setIsPlaying(false);
            }
        };

        audio.addEventListener("pause", handlePause);
        return () => audio.removeEventListener("pause", handlePause);
    }, []);

    const togglePlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
            currentlyPlayingAudio = null;
        } else {
            if (currentlyPlayingAudio && currentlyPlayingAudio !== audio) {
                currentlyPlayingAudio.pause();
            }
            audio.play();
            setIsPlaying(true);
            currentlyPlayingAudio = audio;
        }
    }, [isPlaying]);

    const handleSeekToRatio = (ratio: number) => {
        if (audioRef.current && duration > 0) {
            const targetTime = ratio * duration;
            audioRef.current.currentTime = targetTime;
            setCurrentTime(targetTime);
        }
    };

    const cycleSpeed = () => {
        const nextIndex = (speedIndex + 1) % SPEED_OPTIONS.length;
        setSpeedIndex(nextIndex);
        if (audioRef.current) {
            audioRef.current.playbackRate = SPEED_OPTIONS[nextIndex];
        }
    };

    // Calculate active played progress ratio
    const progressRatio = (duration > 0 && isFinite(duration))
        ? Math.min(1, Math.max(0, currentTime / duration))
        : 0;

    // Number of bars that should be highlighted as played
    const activeBarCount = Math.round(progressRatio * waveformBars.length);

    return (
        <div className={`flex items-center gap-3 py-2.5 px-3.5 rounded-2xl w-64 max-w-[280px] shadow-xs transition-all ${isMe
            ? "bg-blue-600 text-white border border-blue-500/30"
            : "bg-white dark:bg-zinc-800/95 border border-zinc-200 dark:border-zinc-700/80 text-zinc-800 dark:text-zinc-100"
            }`}>

            {/* Play / Pause Circle Button */}
            <button
                onClick={togglePlay}
                className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-all transform active:scale-95 shadow-xs ${isMe
                    ? "bg-white/20 hover:bg-white/30 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
            >
                {isPlaying ? (
                    <Pause className="h-4 w-4 fill-current" />
                ) : (
                    <Play className="h-4 w-4 ml-0.5 fill-current" />
                )}
            </button>

            {/* Center: Waveform Bars + Time */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">

                {/* 22 Spaced Vertical Waveform Bars */}
                <div
                    className="flex items-center gap-[3px] h-7 cursor-pointer py-1"
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                        handleSeekToRatio(ratio);
                    }}
                >
                    {waveformBars.map((heightPercent, idx) => {
                        const isPlayed = idx < activeBarCount;
                        return (
                            <div
                                key={idx}
                                className={`flex-1 rounded-full transition-colors duration-150 ${isPlayed
                                    ? isMe ? "bg-white" : "bg-blue-600 dark:bg-blue-400"
                                    : isMe ? "bg-white/35 hover:bg-white/50" : "bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400"
                                    }`}
                                style={{
                                    height: `${heightPercent}%`,
                                    minHeight: "20%",
                                }}
                            />
                        );
                    })}
                </div>

                {/* Time Display */}
                <div className={`flex items-center justify-between text-[11px] font-mono leading-none ${isMe ? "text-blue-100" : "text-zinc-400 dark:text-zinc-400"
                    }`}>
                    <span>{formatDuration(isPlaying ? currentTime : duration)}</span>
                    <div className="flex items-center gap-1">
                        <Mic className="h-3 w-3 opacity-60" />
                        <span>Voice Note</span>
                    </div>
                </div>
            </div>

            {/* Speed Toggle Pill */}
            <button
                onClick={cycleSpeed}
                className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 transition-all ${isMe
                    ? "bg-white/20 text-white hover:bg-white/30"
                    : "bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
                    }`}
            >
                {SPEED_OPTIONS[speedIndex]}x
            </button>
        </div>
    );
}

"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, Mic } from "lucide-react";

// ──────────────────────────────────────────────────────────────
// VoicePlayerCard — Real Audio Webform Decoder & Animated Player
//
// Features:
//   1. Decodes ACTUAL PCM audio buffer via Web Audio API (decodeAudioData)
//      to extract 22 REAL volume peaks from the voice file.
//   2. Live visual animation: active bars pulse/scale while playing + glowing progress dot.
//   3. Interactive seek by clicking anywhere on the waveform.
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

    // 22 real PCM waveform heights (percent 20-100)
    const [waveformBars, setWaveformBars] = useState<number[]>([]);
    const [isDecoding, setIsDecoding] = useState(true);

    const audioRef = useRef<HTMLAudioElement | null>(null);


    // ── 1. Decode REAL Audio PCM Buffer via Web Audio API ─────
    useEffect(() => {
        let isCancelled = false;

        async function decodeRealWaveform() {
            try {
                setIsDecoding(true);
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();

                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                const audioCtx = new AudioCtx();
                const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

                if (isCancelled) return;

                // Extract PCM channel data (float values -1.0 to 1.0)
                const rawData = audioBuffer.getChannelData(0);
                const samplesCount = 22; // 22 clean vertical bars
                const blockSize = Math.floor(rawData.length / samplesCount);
                const extractedPeaks: number[] = [];

                for (let i = 0; i < samplesCount; i++) {
                    const start = i * blockSize;
                    let sum = 0;
                    for (let j = 0; j < blockSize; j += 10) { // step by 10 for performance
                        sum += Math.abs(rawData[start + j] || 0);
                    }
                    const average = sum / (blockSize / 10);
                    // Map to 20% - 100% height
                    const heightPercent = Math.max(20, Math.min(100, Math.round(average * 350)));
                    extractedPeaks.push(heightPercent);
                }

                audioCtx.close();
                setWaveformBars(extractedPeaks);
            } catch (err) {
                // Fallback to 22 fallback bars if fetch/CORS fails
                console.warn("Waveform audio decoding fallback:", err);
                const fallback = Array.from({ length: 22 }, (_, i) => 25 + ((i * 17) % 65));
                setWaveformBars(fallback);
            } finally {
                if (!isCancelled) setIsDecoding(false);
            }
        }

        decodeRealWaveform();

        return () => {
            isCancelled = true;
        };
    }, [url]);


    // ── 2. HTML5 Audio Element Setup & Controls ───────────────
    useEffect(() => {
        const audio = new Audio(url);
        audioRef.current = audio;

        const updateDuration = () => {
            if (audio.duration && isFinite(audio.duration)) {
                setDuration(audio.duration);
            }
        };

        audio.onloadedmetadata = updateDuration;
        audio.ondurationchange = updateDuration;

        audio.ontimeupdate = () => {
            setCurrentTime(audio.currentTime);
            if (audio.duration && isFinite(audio.duration)) {
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
    }, [url]);


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


    // Calculate active played progress ratio (0.0 to 1.0)
    const progressRatio = (duration > 0 && isFinite(duration))
        ? Math.min(1, Math.max(0, currentTime / duration))
        : 0;

    const currentBarIndex = Math.floor(progressRatio * waveformBars.length);


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
                    <Pause className="h-4 w-4 fill-current animate-pulse" />
                ) : (
                    <Play className="h-4 w-4 ml-0.5 fill-current" />
                )}
            </button>

            {/* Center: Waveform Bars + Time */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">

                {/* WhatsApp Style Vertical Waveform Graph with Moving Progress Dot */}
                <div
                    className="relative flex items-center gap-[3px] h-7 cursor-pointer py-1"
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                        handleSeekToRatio(ratio);
                    }}
                >
                    {/* Render decoded REAL PCM waveform bars */}
                    {waveformBars.map((heightPercent, idx) => {
                        const isPlayed = idx <= currentBarIndex;
                        const isCurrentActive = idx === currentBarIndex && isPlaying;

                        return (
                            <div
                                key={idx}
                                className={`flex-1 rounded-full transition-all duration-150 ${isPlayed
                                    ? isMe ? "bg-white" : "bg-blue-600 dark:bg-blue-400"
                                    : isMe ? "bg-white/35 hover:bg-white/50" : "bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400"
                                    } ${isCurrentActive ? "animate-pulse scale-y-110" : ""}`}
                                style={{
                                    height: `${heightPercent}%`,
                                    minHeight: "20%",
                                }}
                            />
                        );
                    })}

                    {/* Glowing Moving Progress Handle/Dot over active bar position */}
                    {isPlaying && (
                        <div
                            className={`absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full shadow-md transition-all duration-100 ${isMe ? "bg-white ring-2 ring-white/40" : "bg-blue-600 dark:bg-blue-400 ring-2 ring-blue-500/40"
                                }`}
                            style={{
                                left: `calc(${progressRatio * 100}% - 6px)`,
                            }}
                        />
                    )}
                </div>

                {/* Time Display */}
                <div className={`flex items-center justify-between text-[11px] font-mono leading-none ${isMe ? "text-blue-100" : "text-zinc-400 dark:text-zinc-400"
                    }`}>
                    <span>{formatDuration(isPlaying ? currentTime : duration)}</span>
                    <div className="flex items-center gap-1">
                        {isPlaying ? (
                            <span className="flex items-center gap-0.5 text-emerald-400 font-bold">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                                Playing
                            </span>
                        ) : (
                            <>
                                <Mic className="h-3 w-3 opacity-60" />
                                <span>Voice Note</span>
                            </>
                        )}
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

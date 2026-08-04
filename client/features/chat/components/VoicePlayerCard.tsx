"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause } from "lucide-react";

// ──────────────────────────────────────────────────────────────
// VoicePlayerCard — Custom audio player for voice messages
//
// Renders inside chat message bubbles when an attachment has
// file_type starting with "audio/".
//
// Features:
//   - Play/Pause toggle
//   - Seekable progress bar
//   - Current time / Duration display
//   - Playback speed toggle (1x → 1.5x → 2x)
//   - Global audio manager (only 1 voice note plays at a time)
// ──────────────────────────────────────────────────────────────


// ── Global Audio Manager ──────────────────────────────────────
// Only ONE voice note can play at a time across the entire app.
// When user clicks Play on voice note #2, voice note #1 auto-pauses.
let currentlyPlayingAudio: HTMLAudioElement | null = null;


// ── Helper: Format seconds → "MM:SS" ─────────────────────────
function formatDuration(seconds: number): string {
    if (!seconds || !isFinite(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}


// ── Speed options cycle ───────────────────────────────────────
const SPEED_OPTIONS = [1, 1.5, 2] as const;


interface VoicePlayerCardProps {
    url: string;           // download_url of the audio attachment
    isMe: boolean;         // true if current user sent this message (for styling)
}


export function VoicePlayerCard({ url, isMe }: VoicePlayerCardProps) {

    // ── State ──────────────────────────────────────────────────
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [speedIndex, setSpeedIndex] = useState(0);  // index into SPEED_OPTIONS

    // ── Refs ───────────────────────────────────────────────────
    const audioRef = useRef<HTMLAudioElement | null>(null);


    // ── Initialize the hidden <audio> element on mount ────────
    useEffect(() => {
        const audio = new Audio(url);
        audioRef.current = audio;

        // When browser knows the total duration of the audio file
        audio.onloadedmetadata = () => {
            setDuration(audio.duration);
        };

        // Fires continuously while playing — updates the progress bar
        audio.ontimeupdate = () => {
            setCurrentTime(audio.currentTime);
        };

        // When audio finishes playing naturally
        audio.onended = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            currentlyPlayingAudio = null;
        };

        // Cleanup: stop audio when component unmounts (e.g. user scrolls away)
        return () => {
            audio.pause();
            audio.src = "";
            if (currentlyPlayingAudio === audio) {
                currentlyPlayingAudio = null;
            }
        };
    }, [url]);


    // ── Play / Pause Toggle ───────────────────────────────────
    const togglePlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            // Currently playing → Pause
            audio.pause();
            setIsPlaying(false);
            currentlyPlayingAudio = null;
        } else {
            // Currently paused → Play

            // Global rule: pause any OTHER voice note that's currently playing
            if (currentlyPlayingAudio && currentlyPlayingAudio !== audio) {
                currentlyPlayingAudio.pause();
                // The other VoicePlayerCard will detect this via onpause event
            }

            audio.play();
            setIsPlaying(true);
            currentlyPlayingAudio = audio;
        }
    }, [isPlaying]);


    // ── Listen for external pause (when another voice note starts) ──
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handlePause = () => {
            // If this audio was paused externally (by the global manager),
            // update our local state to reflect it
            if (!audio.ended) {
                setIsPlaying(false);
            }
        };

        audio.addEventListener("pause", handlePause);
        return () => audio.removeEventListener("pause", handlePause);
    }, []);


    // ── Seek (click on progress bar) ──────────────────────────
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };


    // ── Speed Toggle (1x → 1.5x → 2x → 1x) ─────────────────
    const cycleSpeed = () => {
        const nextIndex = (speedIndex + 1) % SPEED_OPTIONS.length;
        setSpeedIndex(nextIndex);
        if (audioRef.current) {
            audioRef.current.playbackRate = SPEED_OPTIONS[nextIndex];
        }
    };


    // ── Progress percentage for the bar fill ──────────────────
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;


    return (
        <div className={`flex items-center gap-3 py-2 px-3 rounded-xl min-w-[240px] max-w-[320px] ${isMe
            ? "bg-black/15"
            : "bg-zinc-100 dark:bg-white/10"
            }`}>

            {/* Play / Pause Button */}
            <button
                onClick={togglePlay}
                className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-all ${isMe
                    ? "bg-white/25 hover:bg-white/35 text-white"
                    : "bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-400"
                    }`}
            >
                {isPlaying
                    ? <Pause className="h-4 w-4" />
                    : <Play className="h-4 w-4 ml-0.5" />  /* ml-0.5 to visually center the triangle */
                }
            </button>

            {/* Middle: Progress Bar + Time */}
            <div className="flex-1 min-w-0">

                {/* Seekable Progress Bar */}
                <div className="relative h-1.5 w-full rounded-full overflow-hidden bg-black/10 dark:bg-white/10">
                    {/* Filled portion */}
                    <div
                        className={`absolute top-0 left-0 h-full rounded-full transition-all ${isMe ? "bg-white/70" : "bg-blue-500"
                            }`}
                        style={{ width: `${progress}%` }}
                    />
                    {/* Invisible range input on top for seeking */}
                    <input
                        type="range"
                        min={0}
                        max={duration || 0}
                        step={0.1}
                        value={currentTime}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>

                {/* Time Display */}
                <div className={`flex justify-between mt-1 text-[10px] font-mono ${isMe ? "text-white/60" : "text-zinc-400 dark:text-zinc-500"
                    }`}>
                    <span>{formatDuration(currentTime)}</span>
                    <span>{formatDuration(duration)}</span>
                </div>
            </div>

            {/* Speed Toggle Badge */}
            <button
                onClick={cycleSpeed}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 transition-colors ${isMe
                    ? "bg-white/20 text-white/80 hover:bg-white/30"
                    : "bg-zinc-200 dark:bg-white/15 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-white/20"
                    }`}
            >
                {SPEED_OPTIONS[speedIndex]}x
            </button>
        </div>
    );
}

import { useRef, useState, useCallback } from "react";
import { toast } from "sonner";

// ──────────────────────────────────────────────────────────────
// useAudioRecorder — Upgraded with Web Audio API Analyser & Pause/Resume
//
// Features:
//   1. Real-time microphone audio levels (0-100 amplitude bars) for live waveform.
//   2. Pause / Resume recording controls.
//   3. Live timer & cleanup logic.
// ──────────────────────────────────────────────────────────────

export function useAudioRecorder() {

    // ── State ──────────────────────────────────────────────────
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);       // seconds counter
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioLevels, setAudioLevels] = useState<number[]>([]); // array of amplitude levels (0-100) for live waveform bars

    // ── Refs ───────────────────────────────────────────────────
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Web Audio API refs for real-time waveform
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animFrameRef = useRef<number | null>(null);


    // ── Helper: Clean up everything ───────────────────────────
    const cleanup = useCallback(() => {
        // 1. Stop timer
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }

        // 2. Stop audio animation frame loop
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }

        // 3. Close AudioContext
        if (audioContextRef.current && audioContextRef.current.state !== "closed") {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        // 4. Release microphone
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        // 5. Clear refs
        mediaRecorderRef.current = null;
        analyserRef.current = null;
    }, []);


    // ── Helper: Real-time Audio Level Extraction ──────────────
    const startAudioAnalyzer = (stream: MediaStream) => {
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioCtx();
            audioContextRef.current = audioContext;

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 64; // Small FFT for fast responsiveness
            analyserRef.current = analyser;

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            let lastSampleTime = 0;

            const sampleAudio = (time: number) => {
                // Sample level roughly every 80ms for a smooth waveform graph
                if (time - lastSampleTime > 80 && analyserRef.current) {
                    lastSampleTime = time;
                    analyser.getByteFrequencyData(dataArray);

                    // Compute Root Mean Square (RMS) volume level
                    let sum = 0;
                    for (let i = 0; i < bufferLength; i++) {
                        sum += dataArray[i];
                    }
                    const average = sum / bufferLength;
                    // Normalize to 15-100% range for nice visual bar height
                    const normalizedLevel = Math.max(15, Math.min(100, Math.round((average / 128) * 100)));

                    setAudioLevels((prev) => {
                        // Keep last 35 bars for scrolling waveform effect
                        const updated = [...prev, normalizedLevel];
                        return updated.length > 35 ? updated.slice(updated.length - 35) : updated;
                    });
                }
                animFrameRef.current = requestAnimationFrame(sampleAudio);
            };

            animFrameRef.current = requestAnimationFrame(sampleAudio);
        } catch (e) {
            console.warn("Web Audio API not supported for waveform:", e);
        }
    };


    // ── Start Recording ───────────────────────────────────────
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                ? "audio/webm;codecs=opus"
                : "audio/webm";

            const recorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = recorder;

            audioChunksRef.current = [];

            recorder.ondataavailable = (event: BlobEvent) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: mimeType });
                setAudioBlob(blob);
            };

            recorder.start(250);
            setIsRecording(true);
            setIsPaused(false);
            setRecordingTime(0);
            setAudioBlob(null);
            setAudioLevels([]);

            // Start live Web Audio API analyzer
            startAudioAnalyzer(stream);

            // Timer interval
            timerIntervalRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);

        } catch (error) {
            toast.error(`Microphone access denied or not available: ${error}`);
            cleanup();
        }
    }, [cleanup]);


    // ── Pause Recording ───────────────────────────────────────
    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.pause();
            setIsPaused(true);

            // Stop timer while paused
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }

            // Pause audio context
            if (audioContextRef.current && audioContextRef.current.state === "running") {
                audioContextRef.current.suspend();
            }
        }
    }, []);


    // ── Resume Recording ──────────────────────────────────────
    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
            mediaRecorderRef.current.resume();
            setIsPaused(false);

            // Resume timer
            timerIntervalRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);

            // Resume audio context
            if (audioContextRef.current && audioContextRef.current.state === "suspended") {
                audioContextRef.current.resume();
            }
        }
    }, []);


    // ── Stop Recording ────────────────────────────────────────
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setIsPaused(false);
        cleanup();
    }, [cleanup]);


    // ── Cancel Recording ──────────────────────────────────────
    const cancelRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setIsPaused(false);
        setRecordingTime(0);
        setAudioBlob(null);
        setAudioLevels([]);
        audioChunksRef.current = [];
        cleanup();
    }, [cleanup]);


    // ── Reset ──────────────────────────────────────────────────
    const resetRecording = useCallback(() => {
        setAudioBlob(null);
        setRecordingTime(0);
        setIsPaused(false);
        setAudioLevels([]);
        audioChunksRef.current = [];
    }, []);


    // ── Formatted Time ─────────────────────────────────────────
    const formattedTime = `${String(Math.floor(recordingTime / 60)).padStart(2, "0")}:${String(recordingTime % 60).padStart(2, "0")}`;


    return {
        // State
        isRecording,
        isPaused,
        recordingTime,
        formattedTime,
        audioBlob,
        audioLevels,        // Array of real-time volume bar heights (0-100%)

        // Actions
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        cancelRecording,
        resetRecording,
    };
}

import { useRef, useState, useCallback } from "react";
import { toast } from "sonner";

// ──────────────────────────────────────────────────────────────
// useAudioRecorder — Custom hook for browser microphone recording
//
// Uses the native MediaRecorder Web API to:
//   1. Request microphone permission
//   2. Record audio chunks into a Blob
//   3. Track recording duration with a live timer
//   4. Provide start / stop / cancel controls
//
// Returns a clean interface for ChatMessageArea to consume.
// ──────────────────────────────────────────────────────────────

export function useAudioRecorder() {

    // ── State ──────────────────────────────────────────────────
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);      // seconds counter (0, 1, 2, 3...)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    // ── Refs (not in state because they don't affect UI) ──────
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);                   // collected audio data pieces
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null); // 1-second interval ID
    const streamRef = useRef<MediaStream | null>(null);           // microphone stream (to stop tracks later)


    // ── Helper: Clean up everything ───────────────────────────
    // Called by both stopRecording and cancelRecording
    const cleanup = useCallback(() => {
        // 1. Stop the timer
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }

        // 2. Release the microphone (stop all audio tracks)
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        // 3. Clear the recorder reference
        mediaRecorderRef.current = null;
    }, []);


    // ── Start Recording ───────────────────────────────────────
    // 1. Asks user for mic permission
    // 2. Creates a MediaRecorder
    // 3. Starts collecting audio chunks
    // 4. Starts the seconds timer
    const startRecording = useCallback(async () => {
        try {
            // Step 1: Request microphone access from the browser
            // This triggers the "Allow microphone?" permission popup
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Step 2: Choose audio format (webm is supported by Chrome/Firefox/Edge)
            const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                ? "audio/webm;codecs=opus"
                : "audio/webm";

            // Step 3: Create the MediaRecorder instance
            const recorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = recorder;

            // Step 4: Reset the chunks array for this new recording
            audioChunksRef.current = [];

            // Step 5: Every time MediaRecorder produces a piece of audio data,
            //         push it into our chunks array
            recorder.ondataavailable = (event: BlobEvent) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            // Step 6: When recorder stops, combine all chunks into one Blob
            recorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: mimeType });
                setAudioBlob(blob);
            };

            // Step 7: Start recording! (timeslice = 250ms → produces data every 250ms)
            recorder.start(250);
            setIsRecording(true);
            setRecordingTime(0);
            setAudioBlob(null);

            // Step 8: Start a 1-second interval timer for the UI counter
            timerIntervalRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);

        } catch (error) {
            // User denied mic permission, or browser doesn't support it
            toast.error(`Microphone access denied or not available, ${error}`);
            cleanup();
        }
    }, [cleanup]);


    // ── Stop Recording (keeps the audio blob for sending) ─────
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            // This triggers the "onstop" callback above, which creates the Blob
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        cleanup();
    }, [cleanup]);


    // ── Cancel Recording (discards everything) ────────────────
    const cancelRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setRecordingTime(0);
        setAudioBlob(null);         // discard the blob — don't save it
        audioChunksRef.current = []; // discard collected chunks
        cleanup();
    }, [cleanup]);


    // ── Reset (clear blob after sending) ──────────────────────
    const resetRecording = useCallback(() => {
        setAudioBlob(null);
        setRecordingTime(0);
        audioChunksRef.current = [];
    }, []);


    // ── Format seconds into "MM:SS" for UI display ────────────
    // Example: 65 → "01:05",  7 → "00:07"
    const formattedTime = `${String(Math.floor(recordingTime / 60)).padStart(2, "0")}:${String(recordingTime % 60).padStart(2, "0")}`;


    return {
        // State
        isRecording,        // true while mic is active
        recordingTime,      // raw seconds (0, 1, 2, ...)
        formattedTime,      // "00:07", "01:35"
        audioBlob,          // final Blob after stop (null while recording)

        // Actions
        startRecording,     // async — asks for mic permission & begins
        stopRecording,      // stops & keeps blob (for sending)
        cancelRecording,    // stops & discards blob (for cancel button)
        resetRecording,     // clears blob after it's been sent
    };
}

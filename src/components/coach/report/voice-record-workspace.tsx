"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mic, Pause, Play, RotateCcw, Square, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ProgramListItem } from "@/lib/business/program-types";
import { ProgramPickerStrip } from "@/components/coach/report/program-picker-strip";
import { WaveformBars } from "@/components/coach/report/waveform-bars";
import {
  MAX_VOICE_DURATION_MS,
  RECOMMENDED_VOICE_DURATION_MS,
} from "@/lib/reports/constants";
import {
  clearPendingVoiceUpload,
  getPendingVoiceUpload,
  savePendingVoiceUpload,
} from "@/lib/reports/pending-voice-upload";
import type { ReportScope, VoiceDraftSummary } from "@/lib/reports/types";
import { uploadVoiceRecordingClient } from "@/lib/reports/upload-voice-client";
import { cn } from "@/lib/utils";

type RecorderPhase =
  | "idle"
  | "recording"
  | "paused"
  | "ready"
  | "uploading"
  | "success"
  | "error";

type VoiceRecordWorkspaceProps = {
  program: ProgramListItem;
  programs: ProgramListItem[];
  initialDraft: VoiceDraftSummary | null;
};

const BAR_COUNT = 40;
const SILENCE_LEVELS = Array.from({ length: BAR_COUNT }, () => 0.12);

function formatTimer(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function hapticPulse() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(12);
  }
}

function pickMimeType(): string | undefined {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return undefined;
}

export function VoiceRecordWorkspace({
  program,
  programs,
  initialDraft,
}: VoiceRecordWorkspaceProps) {
  const t = useTranslations("coach.report.voice");

  const [phase, setPhase] = useState<RecorderPhase>(
    initialDraft?.uploadStatus === "uploaded" ? "success" : "idle",
  );
  const [scope, setScope] = useState<ReportScope>(initialDraft?.scope ?? "group");
  const [elapsedMs, setElapsedMs] = useState(initialDraft?.audioDurationMs ?? 0);
  const [levels, setLevels] = useState(SILENCE_LEVELS);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState<VoiceDraftSummary | null>(initialDraft);
  const [pendingRetry, setPendingRetry] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const pausedAccumRef = useRef(0);
  const pauseStartedRef = useRef<number | null>(null);
  const recordedBlobRef = useRef<Blob | null>(null);
  const recordedMimeRef = useRef("audio/webm");

  const stopAnalyser = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current = null;
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const cleanupRecording = useCallback(() => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopAnalyser();
    stopStream();
    mediaRecorderRef.current = null;
  }, [stopAnalyser, stopStream]);

  const tickLevels = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    const bucketSize = Math.floor(data.length / BAR_COUNT);
    const next = Array.from({ length: BAR_COUNT }, (_, i) => {
      const start = i * bucketSize;
      let sum = 0;
      for (let j = 0; j < bucketSize; j++) {
        sum += data[start + j] ?? 0;
      }
      const avg = sum / bucketSize / 255;
      return Math.max(0.1, Math.min(1, avg * 1.6));
    });

    setLevels(next);
    rafRef.current = requestAnimationFrame(tickLevels);
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current != null) return;
    timerRef.current = window.setInterval(() => {
      const pausedExtra =
        pauseStartedRef.current != null
          ? Date.now() - pauseStartedRef.current
          : 0;
      const next =
        Date.now() - startTimeRef.current - pausedAccumRef.current - pausedExtra;

      if (next >= MAX_VOICE_DURATION_MS) {
        setElapsedMs(MAX_VOICE_DURATION_MS);
        mediaRecorderRef.current?.stop();
        return;
      }
      setElapsedMs(next);
    }, 200);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const beginUpload = useCallback(
    async (blob: Blob, durationMs: number, mimeType: string) => {
      setPhase("uploading");
      setUploadPercent(0);
      setErrorMessage(null);

      const pendingId = crypto.randomUUID();
      await savePendingVoiceUpload({
        id: pendingId,
        programId: program.id,
        blob,
        durationMs,
        scope,
        mimeType,
        createdAt: Date.now(),
      });

      const result = await uploadVoiceRecordingClient(
        program.id,
        blob,
        durationMs,
        scope,
        (progress) => setUploadPercent(progress.percent),
      );

      if (result.ok) {
        await clearPendingVoiceUpload(pendingId);
        setDraft(result.draft);
        setPhase("success");
        setPendingRetry(false);
        return;
      }

      setErrorMessage(result.error);
      setPhase("error");
      setPendingRetry(true);
    },
    [program.id, scope],
  );

  const startRecording = useCallback(async () => {
    setErrorMessage(null);
    recordedBlobRef.current = null;
    chunksRef.current = [];
    pausedAccumRef.current = 0;
    pauseStartedRef.current = null;
    setElapsedMs(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      recordedMimeRef.current = recorder.mimeType || mimeType || "audio/webm";
      mediaRecorderRef.current = recorder;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      rafRef.current = requestAnimationFrame(tickLevels);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        stopTimer();
        stopAnalyser();
        stopStream();

        const blob = new Blob(chunksRef.current, { type: recordedMimeRef.current });
        recordedBlobRef.current = blob;
        setLevels(SILENCE_LEVELS);

        if (blob.size > 0) {
          setPhase("ready");
        } else {
          setPhase("idle");
        }
      };

      recorder.start(250);
      startTimeRef.current = Date.now();
      startTimer();
      setPhase("recording");
      hapticPulse();
    } catch {
      cleanupRecording();
      setErrorMessage(t("errors.micDenied"));
      setPhase("error");
    }
  }, [cleanupRecording, startTimer, stopAnalyser, stopStream, stopTimer, t, tickLevels]);

  const pauseRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    recorder.pause();
    pauseStartedRef.current = Date.now();
    stopTimer();
    stopAnalyser();
    setLevels(SILENCE_LEVELS);
    setPhase("paused");
    hapticPulse();
  }, [stopAnalyser, stopTimer]);

  const resumeRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "paused") return;
    if (pauseStartedRef.current != null) {
      pausedAccumRef.current += Date.now() - pauseStartedRef.current;
      pauseStartedRef.current = null;
    }
    recorder.resume();
    if (streamRef.current && audioContextRef.current == null) {
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(streamRef.current);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      rafRef.current = requestAnimationFrame(tickLevels);
    }
    startTimer();
    setPhase("recording");
    hapticPulse();
  }, [startTimer, tickLevels]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
    hapticPulse();
  }, []);

  const discardRecording = useCallback(() => {
    cleanupRecording();
    chunksRef.current = [];
    recordedBlobRef.current = null;
    setElapsedMs(0);
    setLevels(SILENCE_LEVELS);
    setPhase(draft?.uploadStatus === "uploaded" ? "success" : "idle");
    setErrorMessage(null);
    setPendingRetry(false);
  }, [cleanupRecording, draft?.uploadStatus]);

  const uploadRecording = useCallback(async () => {
    const blob = recordedBlobRef.current;
    if (!blob) return;
    await beginUpload(blob, elapsedMs, recordedMimeRef.current);
  }, [beginUpload, elapsedMs]);

  const retryPendingUpload = useCallback(async () => {
    const pending = await getPendingVoiceUpload(program.id);
    if (!pending) {
      setErrorMessage(t("errors.noPending"));
      return;
    }
    recordedBlobRef.current = pending.blob;
    setScope(pending.scope);
    setElapsedMs(pending.durationMs);
    await beginUpload(pending.blob, pending.durationMs, pending.mimeType);
  }, [beginUpload, program.id, t]);

  useEffect(() => {
    void getPendingVoiceUpload(program.id).then((pending) => {
      if (pending) {
        setPendingRetry(true);
        setErrorMessage(t("errors.pendingFound"));
      }
    });
  }, [program.id, t]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (phase === "recording" || phase === "uploading") {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [phase]);

  useEffect(() => () => cleanupRecording(), [cleanupRecording]);

  const nearLimit = elapsedMs >= MAX_VOICE_DURATION_MS - 30_000;
  const overRecommended = elapsedMs >= RECOMMENDED_VOICE_DURATION_MS;
  const isRecording = phase === "recording";
  const isPaused = phase === "paused";

  return (
    <div className="space-y-8">
      <ProgramPickerStrip programs={programs} activeProgramId={program.id} />

      <div className="rounded-[1.5rem] bg-card p-6 ring-1 ring-border/50 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {t("todayLabel")}
            </p>
            <h2 className="mt-1 font-display text-2xl text-foreground">{program.name}</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>

          <div
            className="inline-flex rounded-full bg-muted/60 p-1"
            role="radiogroup"
            aria-label={t("scopeLabel")}
          >
            {(["group", "per_child"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={scope === value}
                disabled={phase === "recording" || phase === "uploading"}
                onClick={() => setScope(value)}
                className={cn(
                  "min-h-11 rounded-full px-4 text-sm transition-[background-color,color] duration-200 ease-out",
                  scope === value
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(`scope.${value}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center">
          <div className="tabular-nums text-4xl font-medium tracking-tight text-foreground">
            {formatTimer(elapsedMs)}
          </div>
          <p
            className={cn(
              "mt-2 text-xs",
              nearLimit
                ? "text-destructive"
                : overRecommended
                  ? "text-muted-foreground"
                  : "text-muted-foreground/80",
            )}
          >
            {nearLimit ? t("timer.nearLimit") : t("timer.hint")}
          </p>

          <WaveformBars
            levels={isRecording ? levels : SILENCE_LEVELS}
            active={isRecording}
            className="mt-8 w-full max-w-lg"
          />

          <div className="relative mt-10 flex items-center justify-center">
            {isRecording ? (
              <span
                className="absolute size-28 animate-pulse rounded-full bg-primary/15"
                aria-hidden
              />
            ) : null}
            <button
              type="button"
              onClick={() => {
                if (phase === "idle" || phase === "success" || phase === "error") {
                  void startRecording();
                }
              }}
              disabled={
                phase === "recording" ||
                phase === "paused" ||
                phase === "ready" ||
                phase === "uploading"
              }
              className={cn(
                "relative flex size-24 items-center justify-center rounded-full transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96]",
                isRecording
                  ? "bg-primary text-primary-foreground"
                  : "bg-foreground text-background hover:opacity-95",
              )}
              aria-label={t("record")}
            >
              <Mic className="size-9" />
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {isRecording ? (
              <>
                <button
                  type="button"
                  onClick={pauseRecording}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-card px-5 text-sm ring-1 ring-border/60 transition-transform duration-200 ease-out active:scale-[0.98]"
                >
                  <Pause className="size-4" />
                  {t("pause")}
                </button>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-destructive px-5 text-sm text-destructive-foreground transition-transform duration-200 ease-out active:scale-[0.98]"
                >
                  <Square className="size-4" />
                  {t("stop")}
                </button>
              </>
            ) : null}

            {isPaused ? (
              <>
                <button
                  type="button"
                  onClick={resumeRecording}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm text-background transition-transform duration-200 ease-out active:scale-[0.98]"
                >
                  <Play className="size-4" />
                  {t("resume")}
                </button>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-destructive px-5 text-sm text-destructive-foreground transition-transform duration-200 ease-out active:scale-[0.98]"
                >
                  <Square className="size-4" />
                  {t("stop")}
                </button>
              </>
            ) : null}

            {phase === "ready" ? (
              <>
                <button
                  type="button"
                  onClick={() => void uploadRecording()}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm text-primary-foreground transition-transform duration-200 ease-out active:scale-[0.98]"
                >
                  <Upload className="size-4" />
                  {t("upload")}
                </button>
                <button
                  type="button"
                  onClick={discardRecording}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm text-muted-foreground ring-1 ring-border/60 transition-transform duration-200 ease-out active:scale-[0.98]"
                >
                  <RotateCcw className="size-4" />
                  {t("discard")}
                </button>
              </>
            ) : null}
          </div>
        </div>

        {phase === "uploading" ? (
          <div className="mt-8 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("uploading")}</span>
              <span className="tabular-nums text-foreground">{uploadPercent}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
                style={{ width: `${uploadPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{t("uploadBackground")}</p>
          </div>
        ) : null}

        {phase === "success" ? (
          <div className="mt-8 rounded-[1rem] bg-primary/8 px-5 py-4 ring-1 ring-primary/20">
            <p className="text-sm font-medium text-foreground">{t("successTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("successBody")}</p>
            <Link
              href={`/coach/report/${program.id}/review`}
              className="mt-4 inline-flex min-h-11 items-center rounded-full bg-foreground px-5 text-sm text-background transition-transform duration-200 ease-out active:scale-[0.98]"
            >
              {t("reviewCta")}
            </Link>
          </div>
        ) : null}

        {(phase === "error" || pendingRetry) && errorMessage ? (
          <div className="mt-8 rounded-[1rem] bg-destructive/8 px-5 py-4 ring-1 ring-destructive/20">
            <p className="text-sm font-medium text-foreground">{t("errorTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void retryPendingUpload()}
              className="mt-4 inline-flex min-h-11 items-center rounded-full bg-foreground px-5 text-sm text-background transition-transform duration-200 ease-out active:scale-[0.98]"
            >
              {t("retry")}
            </button>
          </div>
        ) : null}

        {draft?.uploadStatus === "uploaded" && phase !== "recording" && phase !== "ready" ? (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            {t("existingDraft", {
              duration: formatTimer(draft.audioDurationMs ?? 0),
            })}
          </p>
        ) : null}
      </div>
    </div>
  );
}

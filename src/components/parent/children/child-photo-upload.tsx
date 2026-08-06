"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";

type ChildPhotoUploadProps = {
  childId: string;
  signedUrl: string | null;
  onUploaded: (signedUrl: string) => void;
  className?: string;
};

export function ChildPhotoUpload({
  childId,
  signedUrl,
  onUploaded,
  className,
}: ChildPhotoUploadProps) {
  const t = useTranslations("parent.family.children.photo");
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(signedUrl);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    setProgress(12);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const timer = window.setInterval(() => {
      setProgress((p) => Math.min(p + 8, 88));
    }, 120);

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/parent/children/${childId}/photo`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        signedUrl?: string;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.signedUrl) {
        setPreview(signedUrl);
        return;
      }
      setProgress(100);
      setPreview(data.signedUrl);
      onUploaded(data.signedUrl);
    } finally {
      window.clearInterval(timer);
      setUploading(false);
      setTimeout(() => setProgress(0), 400);
      URL.revokeObjectURL(objectUrl);
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="group relative h-28 w-28 overflow-hidden rounded-2xl bg-secondary ring-1 ring-border/60 transition-[transform,box-shadow] duration-200 ease-out hover:shadow-soft active:scale-[0.98]"
        aria-label={t("change")}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Camera className="h-8 w-8" aria-hidden />
          </span>
        )}
        {uploading || progress > 0 ? (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70">
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36" aria-hidden>
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                className="stroke-secondary"
                strokeWidth="2"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                className="stroke-primary transition-[stroke-dashoffset] duration-150 ease-out"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={`${progress * 0.94} 100`}
              />
            </svg>
          </span>
        ) : null}
      </button>
      <p className="text-xs text-muted-foreground">{t("hint")}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
    </div>
  );
}

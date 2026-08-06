"use client";

import * as React from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FileUploadProps = {
  id: string;
  label: string;
  accept?: string;
  value?: File | null;
  previewUrl?: string | null;
  onChange: (file: File | null) => void;
  hint?: string;
  error?: string;
  /** Phase 11 enables crop; foundation exposes hook only */
  enableCrop?: boolean;
  className?: string;
};

export function FileUpload({
  id,
  label,
  accept = "image/*",
  value,
  previewUrl,
  onChange,
  hint,
  error,
  enableCrop = false,
  className,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const objectUrl = React.useMemo(
    () => (value ? URL.createObjectURL(value) : null),
    [value],
  );
  const src = previewUrl ?? objectUrl;

  React.useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div
        className={cn(
          "relative flex min-h-[9rem] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-input bg-secondary/40 p-6",
          error && "border-destructive",
        )}
      >
        {src ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              className="max-h-40 rounded-xl object-cover"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
            >
              <X className="h-4 w-4" aria-hidden />
              Remove
            </Button>
          </>
        ) : (
          <>
            <ImagePlus className="h-8 w-8 text-muted-foreground" aria-hidden />
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
            >
              Choose file
            </Button>
          </>
        )}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </div>
      {enableCrop ? (
        <p className="text-xs text-muted-foreground">
          Crop editor ships in registration (Phase 11).
        </p>
      ) : null}
      {hint && !error ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type SignaturePadProps = {
  id: string;
  label: string;
  onChange: (dataUrl: string | null) => void;
  hint?: string;
  error?: string;
  className?: string;
  width?: number;
  height?: number;
};

export function SignaturePad({
  id,
  label,
  onChange,
  hint,
  error,
  className,
  width = 320,
  height = 120,
}: SignaturePadProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const drawing = React.useRef(false);

  const getPoint = (
    e: React.PointerEvent<HTMLCanvasElement>,
  ): { x: number; y: number } => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    const { x, y } = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPoint(e);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "hsl(var(--foreground))";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-input bg-card",
          error && "border-destructive",
        )}
      >
        <canvas
          id={id}
          ref={canvasRef}
          width={width}
          height={height}
          className="touch-none w-full"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          aria-label={label}
        />
        <div className="border-t border-border px-3 py-2">
          <Button type="button" variant="ghost" size="sm" onClick={clear}>
            Clear signature
          </Button>
        </div>
      </div>
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

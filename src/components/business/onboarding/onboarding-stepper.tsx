"use client";

import { cn } from "@/lib/utils";

type OnboardingStepperProps = {
  currentStep: number;
  totalSteps: number;
  labels: string[];
  className?: string;
};

export function OnboardingStepper({
  currentStep,
  totalSteps,
  labels,
  className,
}: OnboardingStepperProps) {
  const progress = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          {labels[currentStep - 1]}
        </span>
        <span>
          {currentStep}/{totalSteps}
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={labels[currentStep - 1]}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-[220ms] ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <ol className="hidden gap-2 sm:flex">
        {labels.map((label, index) => (
          <li
            key={label}
            className={cn(
              "flex-1 rounded-full px-3 py-1.5 text-center text-xs",
              index + 1 === currentStep
                ? "bg-primary/10 font-medium text-primary"
                : index + 1 < currentStep
                  ? "text-muted-foreground"
                  : "text-muted-foreground/60",
            )}
          >
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
}

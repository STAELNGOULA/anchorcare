import { cn } from "@/lib/utils";

type SignupStepIndicatorProps = {
  currentStep: number;
  totalSteps: number;
  label: string;
  className?: string;
};

export function SignupStepIndicator({
  currentStep,
  totalSteps,
  label,
  className,
}: SignupStepIndicatorProps) {
  const progress = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className={cn("mb-6 space-y-2", className)}>
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{label}</span>
        <span>
          {currentStep}/{totalSteps}
        </span>
      </div>
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-[220ms] ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

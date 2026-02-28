import { cn } from "@/utils/cn";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "blue" | "green" | "orange" | "red" | "navy";
  className?: string;
}

function ProgressBar({
  value,
  max = 100,
  label,
  showValue,
  size = "md",
  color = "blue",
  className,
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    orange: "bg-amber-500",
    red: "bg-red-500",
    navy: "bg-navy-700",
  };

  return (
    <div className={cn("space-y-1", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="font-medium text-gray-700">{label}</span>}
          {showValue && (
            <span className="text-gray-500">{Math.round(percent)}%</span>
          )}
        </div>
      )}
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-gray-200",
          size === "sm" && "h-1.5",
          size === "md" && "h-2",
          size === "lg" && "h-3"
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            colorClasses[color]
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/** Barre de progression du wizard (étape X sur Y) */
interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

function WizardProgress({ currentStep, totalSteps, className }: WizardProgressProps) {
  return (
    <ProgressBar
      value={currentStep}
      max={totalSteps}
      showValue
      size="sm"
      color="blue"
      label={`Étape ${currentStep} / ${totalSteps}`}
      className={className}
    />
  );
}

export { ProgressBar, WizardProgress };
export type { ProgressBarProps, WizardProgressProps };

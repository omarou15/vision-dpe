import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  size?: "sm" | "md" | "lg";
}

function Chip({ label, selected, onClick, disabled, icon, size = "md" }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "active:scale-95",
        size === "sm" && "px-2.5 py-1 text-xs",
        size === "md" && "px-3 py-1.5 text-sm",
        size === "lg" && "px-4 py-2 text-sm",
        selected
          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
      )}
      aria-pressed={selected}
    >
      {icon}
      {label}
      {selected && (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}

/** Groupe de chips avec sélection unique */
interface ChipGroupProps {
  options: { value: string; label: string; icon?: ReactNode }[];
  value?: string;
  onChange?: (value: string) => void;
  size?: "sm" | "md" | "lg";
  label?: string;
  error?: string;
}

function ChipGroup({ options, value, onChange, size, label, error }: ChipGroupProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <p className="text-sm font-medium text-gray-700">{label}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            icon={opt.icon}
            selected={value === opt.value}
            onClick={() => onChange?.(opt.value)}
            size={size}
          />
        ))}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export { Chip, ChipGroup };
export type { ChipProps, ChipGroupProps };

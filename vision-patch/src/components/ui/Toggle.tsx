import { cn } from "@/utils/cn";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: "sm" | "md";
}

function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
  size = "md",
}: ToggleProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex shrink-0 rounded-full transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          size === "sm" && "h-5 w-9",
          size === "md" && "h-6 w-11",
          checked ? "bg-blue-500" : "bg-gray-300"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block rounded-full bg-white shadow-sm transition-transform",
            size === "sm" && "h-4 w-4 translate-y-0.5",
            size === "md" && "h-5 w-5 translate-y-0.5",
            checked
              ? size === "sm"
                ? "translate-x-4"
                : "translate-x-5"
              : "translate-x-0.5"
          )}
        />
      </button>

      {(label || description) && (
        <div className="flex-1">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
        </div>
      )}
    </label>
  );
}

export { Toggle };
export type { ToggleProps };

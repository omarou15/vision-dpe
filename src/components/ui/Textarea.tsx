import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {props.required && (
              <span className="ml-0.5 text-red-500">*</span>
            )}
          </label>
        )}

        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border bg-white px-3 py-2 text-base text-gray-900 transition-colors",
            "placeholder:text-gray-400",
            "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
            "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
              : "border-gray-300",
            className
          )}
          aria-invalid={!!error}
          {...props}
        />

        {error && <p className="text-xs text-red-600">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
export type { TextareaProps };

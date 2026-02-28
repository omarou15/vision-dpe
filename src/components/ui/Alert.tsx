import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const alertVariants = cva(
  "flex gap-3 rounded-lg border p-3 text-sm",
  {
    variants: {
      variant: {
        info: "border-blue-200 bg-blue-50 text-blue-800",
        success: "border-green-200 bg-green-50 text-green-800",
        warning: "border-amber-200 bg-amber-50 text-amber-800",
        error: "border-red-200 bg-red-50 text-red-800",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

const iconMap = {
  info: (
    <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  error: (
    <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

interface AlertProps extends VariantProps<typeof alertVariants> {
  children: ReactNode;
  title?: string;
  className?: string;
  onClose?: () => void;
}

function Alert({ children, variant = "info", title, className, onClose }: AlertProps) {
  return (
    <div className={cn(alertVariants({ variant }), className)} role="alert">
      {variant && iconMap[variant]}
      <div className="flex-1">
        {title && <p className="mb-0.5 font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export { Alert };
export type { AlertProps };

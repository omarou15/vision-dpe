import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700",
        secondary:
          "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100",
        outline:
          "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100",
        danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
        ghost: "text-gray-600 hover:bg-gray-100 active:bg-gray-200",
        link: "text-blue-500 underline-offset-4 hover:underline",
        success:
          "bg-green-500 text-white hover:bg-green-600 active:bg-green-700",
        navy: "bg-navy-700 text-white hover:bg-navy-600 active:bg-navy-800",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
export type { ButtonProps };

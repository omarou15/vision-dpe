import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-700",
        primary: "bg-blue-100 text-blue-700",
        success: "bg-green-100 text-green-700",
        warning: "bg-amber-100 text-amber-700",
        danger: "bg-red-100 text-red-700",
        navy: "bg-navy-100 text-navy-700",
        // Statuts projet
        draft: "bg-gray-100 text-gray-600",
        inProgress: "bg-blue-100 text-blue-700",
        validated: "bg-green-100 text-green-700",
        exported: "bg-purple-100 text-purple-700",
        archived: "bg-gray-200 text-gray-500",
        // Types projet
        dpe: "bg-blue-100 text-blue-700",
        audit: "bg-amber-100 text-amber-700",
      },
      size: {
        sm: "px-1.5 py-0.5 text-2xs",
        md: "px-2 py-0.5 text-xs",
        lg: "px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  className?: string;
  /** Point coloré avant le texte */
  dot?: boolean;
}

function Badge({ children, variant, size, className, dot }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)}>
      {dot && (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
export type { BadgeProps };

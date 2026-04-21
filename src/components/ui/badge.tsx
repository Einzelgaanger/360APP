import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border-2 border-foreground px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] font-mono transition-colors focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background",
        green: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "bg-card text-foreground",
        warning: "bg-warning text-warning-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

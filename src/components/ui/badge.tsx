import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] font-mono transition-colors focus:outline-none focus:ring-1 focus:ring-primary",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background border-foreground",
        green: "bg-primary text-primary-foreground border-primary",
        secondary: "bg-paper-deep/50 text-foreground border-border",
        destructive: "bg-destructive text-destructive-foreground border-destructive",
        outline: "bg-card text-muted-foreground border-border",
        warning: "bg-warning text-warning-foreground border-warning",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

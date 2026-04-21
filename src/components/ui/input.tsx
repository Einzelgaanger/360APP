import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-sm border-2 border-foreground bg-background px-4 py-2.5 text-sm font-medium ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-foreground/40 placeholder:font-normal focus-visible:outline-none focus-visible:shadow-[4px_4px_0_0_hsl(var(--foreground))] focus-visible:-translate-x-[1px] focus-visible:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-100",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };

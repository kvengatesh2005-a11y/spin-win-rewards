import * as React from "react";

import { cn } from "@/lib/utils";

type Props = React.ComponentProps<"input"> & { variant?: "default" | "game" };

const Input = React.forwardRef<HTMLInputElement, Props>(
  ({ className, type, variant = "default", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          variant === "game" && "h-12 rounded-xl border-0 bg-primary px-5 text-base font-semibold text-primary-foreground placeholder:text-primary-foreground/70",
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

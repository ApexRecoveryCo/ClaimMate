import { type SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "w-full appearance-none rounded-lg border border-border bg-surface px-4 text-base text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200",
        className,
      )}
      {...props}
    />
  );
});

Select.displayName = "Select";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-smooth focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-white/10 text-white hover:bg-white/15",
        secondary: "border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
        destructive: "border-white/10 bg-white/5 text-red-200 hover:bg-white/10",
        outline: "text-white/80 border-white/15",
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

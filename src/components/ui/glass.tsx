import * as React from "react";
import { cn } from "@/lib/utils";

const GlassCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("glass-panel", className)} {...props} />
  ),
);
GlassCard.displayName = "GlassCard";

const GlassPanel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("glass-panel", className)} {...props} />
  ),
);
GlassPanel.displayName = "GlassPanel";

const GlassButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button ref={ref} className={cn("btn-glass", className)} {...props} />
  ),
);
GlassButton.displayName = "GlassButton";

const GlassInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn("glass-input px-4 py-2.5 text-sm text-white placeholder:text-white/35", className)} {...props} />
  ),
);
GlassInput.displayName = "GlassInput";

const FloatingNav = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("glass-panel rounded-full px-4 py-2 flex items-center justify-center gap-3", className)} {...props} />
));
FloatingNav.displayName = "FloatingNav";

const MinimalTabs = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex gap-2 rounded-full border border-white/10 bg-white/5 p-1", className)} {...props} />
));
MinimalTabs.displayName = "MinimalTabs";

export { GlassCard, GlassPanel, GlassButton, GlassInput, FloatingNav, MinimalTabs };

import { useTheme } from "@/hooks/useTheme";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white/8 group-[.toaster]:text-white group-[.toaster]:border-white/10 group-[.toaster]:shadow-[0_12px_40px_rgba(0,0,0,0.35)]",
          description: "group-[.toast]:text-white/60",
          actionButton: "group-[.toast]:bg-white/10 group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-white/5 group-[.toast]:text-white/70",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };

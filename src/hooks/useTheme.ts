import { useEffect, useState } from "react";

export function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [snowEffect, setSnowEffect] = useState(false);
  const [snowVariant, setSnowVariant] = useState<"dots" | "flakes">("dots");

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    const savedSnow = localStorage.getItem("snowEffect") === "true";
    const savedSnowVariant =
      (localStorage.getItem("snowEffectVariant") as "dots" | "flakes" | null) || "dots";
    
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.remove("dark", "light");
      document.documentElement.classList.add(savedTheme);
    } else {
      // Default to dark
      document.documentElement.classList.add("dark");
    }
    
    setSnowEffect(savedSnow);
    setSnowVariant(savedSnowVariant);

    // Listen for theme changes
    const handleThemeChange = (event: CustomEvent) => {
      const newTheme = event.detail as "dark" | "light";
      setTheme(newTheme);
      document.documentElement.classList.remove("dark", "light");
      document.documentElement.classList.add(newTheme);
    };
    
    const handleSnowChange = (event: CustomEvent) => {
      const detail = event.detail as { enabled: boolean; variant: "dots" | "flakes" };
      setSnowEffect(detail.enabled);
      setSnowVariant(detail.variant);
    };

    window.addEventListener("themeChange", handleThemeChange as EventListener);
    window.addEventListener("snowEffectChange", handleSnowChange as EventListener);

    return () => {
      window.removeEventListener("themeChange", handleThemeChange as EventListener);
      window.removeEventListener("snowEffectChange", handleSnowChange as EventListener);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(newTheme);
    window.dispatchEvent(new CustomEvent("themeChange", { detail: newTheme }));
  };

  return { theme, toggleTheme, snowEffect, snowVariant };
}

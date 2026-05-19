import { useState, useEffect } from "react";

export type TimeFormat = "12h" | "24h";

export function useTimeFormat() {
  const [timeFormat, setTimeFormatState] = useState<TimeFormat>(() => {
    const saved = localStorage.getItem("timeFormat") as TimeFormat | null;
    return saved || "12h";
  });

  useEffect(() => {
    const handleChange = (event: CustomEvent<TimeFormat>) => {
      setTimeFormatState(event.detail);
    };
    window.addEventListener("timeFormatChange", handleChange as EventListener);
    return () => {
      window.removeEventListener("timeFormatChange", handleChange as EventListener);
    };
  }, []);

  const setTimeFormat = (format: TimeFormat) => {
    localStorage.setItem("timeFormat", format);
    setTimeFormatState(format);
    window.dispatchEvent(new CustomEvent("timeFormatChange", { detail: format }));
  };

  return { timeFormat, setTimeFormat };
}

export function formatTime(date: Date, format: TimeFormat): string {
  if (format === "24h") {
    return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
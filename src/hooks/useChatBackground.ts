import { useCallback, useEffect, useMemo, useState } from "react";
import silentDoodle from "@/assets/Chat-Background/silent-doodle.png";
import gameDoodle from "@/assets/Chat-Background/game-doodle.png";

export type ChatBackground = "default" | "silent_doodle" | "game_doodle";

const STORAGE_KEY = "chat_background";

const normalizeBackground = (value: string | null): ChatBackground => {
  if (value === "silent_doodle" || value === "game_doodle" || value === "default") {
    return value;
  }
  return "default";
};

export const useChatBackground = () => {
  const [background, setBackgroundState] = useState<ChatBackground>(() => {
    if (typeof window === "undefined") return "default";
    return normalizeBackground(localStorage.getItem(STORAGE_KEY));
  });

  const setBackground = useCallback((value: ChatBackground) => {
    setBackgroundState(value);
    localStorage.setItem(STORAGE_KEY, value);
    window.dispatchEvent(new CustomEvent("chatBackgroundChange", { detail: value }));
  }, []);

  useEffect(() => {
    const handleExternalChange = () => {
      const stored = normalizeBackground(localStorage.getItem(STORAGE_KEY));
      setBackgroundState(stored);
    };

    window.addEventListener("storage", handleExternalChange);
    window.addEventListener("chatBackgroundChange", handleExternalChange as EventListener);

    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, "default");
    }

    return () => {
      window.removeEventListener("storage", handleExternalChange);
      window.removeEventListener("chatBackgroundChange", handleExternalChange as EventListener);
    };
  }, []);

  const backgroundStyle = useMemo(() => {
    if (background === "default") {
      return {
        backgroundImage: "none",
        backgroundColor: "#0E0E11",
      } as const;
    }

    const imageUrl = background === "silent_doodle" ? silentDoodle : gameDoodle;

    return {
      backgroundImage: `url(${imageUrl})`,
      backgroundColor: "#0E0E11",
      backgroundRepeat: "repeat",
      backgroundSize: "600px",
      backgroundPosition: "center",
    } as const;
  }, [background]);

  return { background, setBackground, backgroundStyle };
};

import { useCallback, useEffect, useMemo, useState } from "react";
import silentDoodle from "@/assets/Chat-Background/silent-doodle.png";
import gameDoodle from "@/assets/Chat-Background/game-doodle.png";
import cosmicDoodle from "@/assets/Chat-Background/Cosmic Doodle.png";
import codeDoodle from "@/assets/Chat-Background/Code Doodle.png";

export type ChatBackground = "default" | "silent_doodle" | "game_doodle" | "cosmic_doodle" | "code_doodle" | "custom";

const STORAGE_KEY = "chat_background";
const CUSTOM_URL_KEY = "chat_background_custom_url";
const CUSTOM_SCALE_KEY = "chat_background_custom_scale";
const CUSTOM_POS_X_KEY = "chat_background_custom_pos_x";
const CUSTOM_POS_Y_KEY = "chat_background_custom_pos_y";

const normalizeBackground = (value: string | null): ChatBackground => {
  if (
    value === "silent_doodle" ||
    value === "game_doodle" ||
    value === "cosmic_doodle" ||
    value === "code_doodle" ||
    value === "custom" ||
    value === "default"
  ) {
    return value;
  }
  return "default";
};

export const useChatBackground = () => {
  const [background, setBackgroundState] = useState<ChatBackground>(() => {
    if (typeof window === "undefined") return "default";
    return normalizeBackground(localStorage.getItem(STORAGE_KEY));
  });
  const [customUrl, setCustomUrl] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(CUSTOM_URL_KEY);
  });
  const [customScale, setCustomScale] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    const raw = Number(localStorage.getItem(CUSTOM_SCALE_KEY));
    return Number.isFinite(raw) && raw > 0 ? raw : 1;
  });
  const [customPos, setCustomPos] = useState<{ x: number; y: number }>(() => {
    if (typeof window === "undefined") return { x: 0, y: 0 };
    const rawX = Number(localStorage.getItem(CUSTOM_POS_X_KEY));
    const rawY = Number(localStorage.getItem(CUSTOM_POS_Y_KEY));
    return {
      x: Number.isFinite(rawX) ? rawX : 0,
      y: Number.isFinite(rawY) ? rawY : 0,
    };
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
      setCustomUrl(localStorage.getItem(CUSTOM_URL_KEY));
      const rawScale = Number(localStorage.getItem(CUSTOM_SCALE_KEY));
      setCustomScale(Number.isFinite(rawScale) && rawScale > 0 ? rawScale : 1);
      const rawX = Number(localStorage.getItem(CUSTOM_POS_X_KEY));
      const rawY = Number(localStorage.getItem(CUSTOM_POS_Y_KEY));
      setCustomPos({
        x: Number.isFinite(rawX) ? rawX : 0,
        y: Number.isFinite(rawY) ? rawY : 0,
      });
    };

    window.addEventListener("storage", handleExternalChange);
    window.addEventListener("chatBackgroundChange", handleExternalChange as EventListener);

    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, "default");
    }
    if (!localStorage.getItem(CUSTOM_SCALE_KEY)) {
      localStorage.setItem(CUSTOM_SCALE_KEY, "1");
    }
    if (!localStorage.getItem(CUSTOM_POS_X_KEY)) {
      localStorage.setItem(CUSTOM_POS_X_KEY, "0");
    }
    if (!localStorage.getItem(CUSTOM_POS_Y_KEY)) {
      localStorage.setItem(CUSTOM_POS_Y_KEY, "0");
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

    const imageUrl = background === "silent_doodle"
      ? silentDoodle
      : background === "game_doodle"
        ? gameDoodle
        : background === "cosmic_doodle"
          ? cosmicDoodle
          : background === "code_doodle"
            ? codeDoodle
            : customUrl;

    if (!imageUrl) {
      return {
        backgroundImage: "none",
        backgroundColor: "#0E0E11",
      } as const;
    }

    const customSize = customScale === 1
      ? "cover"
      : `${Math.round(customScale * 100)}%`;

    return {
      backgroundImage: `url(${imageUrl})`,
      backgroundColor: "#0E0E11",
      backgroundRepeat: background === "custom" ? "no-repeat" : "repeat",
      backgroundSize: background === "custom" ? customSize : "600px",
      backgroundPosition: background === "custom"
        ? `calc(50% + ${customPos.x}px) calc(50% + ${customPos.y}px)`
        : "center",
    } as const;
  }, [background, customUrl, customScale, customPos]);

  return { background, setBackground, backgroundStyle, customUrl, customScale, customPos };
};

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Save, Check, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useChatBackground } from "@/hooks/useChatBackground";
import { uploadsAPI } from "@/services/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import silentDoodle from "@/assets/Chat-Background/silent-doodle.png";
import gameDoodle from "@/assets/Chat-Background/game-doodle.png";
import cosmicDoodle from "@/assets/Chat-Background/Cosmic Doodle.png";
import codeDoodle from "@/assets/Chat-Background/Code Doodle.png";

const ChatPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { customScale, customPos } = useChatBackground();
  const [loading, setLoading] = useState(false);
  const [showCustomBgModal, setShowCustomBgModal] = useState(false);
  const [customBgPreview, setCustomBgPreview] = useState<string | null>(null);
  const [customBgFile, setCustomBgFile] = useState<File | null>(null);
  const [customBgUploading, setCustomBgUploading] = useState(false);
  const [customBgScale, setCustomBgScale] = useState(1);
  const [customBgOffset, setCustomBgOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [settings, setSettings] = useState({
    doubleClickAction: "reply" as "reply" | "heart",
    chatBackground: "default" as "default" | "silent_doodle" | "game_doodle" | "cosmic_doodle" | "code_doodle" | "custom",
    chatBackgroundCustomUrl: null as string | null,
  });

  useEffect(() => {
    const savedDoubleClickAction =
      (localStorage.getItem("doubleClickAction") as "reply" | "heart" | null) || "reply";
    const savedChatBackground =
      (localStorage.getItem("chat_background") as
        | "default"
        | "silent_doodle"
        | "game_doodle"
        | "cosmic_doodle"
        | "code_doodle"
        | "custom"
        | null) || "default";
    const savedCustomUrl = localStorage.getItem("chat_background_custom_url");
    setSettings({
      doubleClickAction: savedDoubleClickAction,
      chatBackground: savedChatBackground,
      chatBackgroundCustomUrl: savedCustomUrl,
    });
  }, []);

  useEffect(() => {
    if (showCustomBgModal) {
      setCustomBgPreview(settings.chatBackgroundCustomUrl);
      setCustomBgFile(null);
      setCustomBgScale(customScale || 1);
      setCustomBgOffset(customPos || { x: 0, y: 0 });
    }
  }, [showCustomBgModal, settings.chatBackgroundCustomUrl, customScale, customPos]);

  const handleDoubleClickActionChange = (action: "reply" | "heart") => {
    setSettings((prev) => ({ ...prev, doubleClickAction: action }));
    localStorage.setItem("doubleClickAction", action);
    window.dispatchEvent(new Event("doubleClickActionChange"));
  };

  const handleChatBackgroundChange = (
    value: "default" | "silent_doodle" | "game_doodle" | "cosmic_doodle" | "code_doodle" | "custom"
  ) => {
    setSettings((prev) => ({ ...prev, chatBackground: value }));
    localStorage.setItem("chat_background", value);
    window.dispatchEvent(new CustomEvent("chatBackgroundChange", { detail: value }));
  };

  const handleCustomBackgroundApply = async () => {
    if (!customBgFile && !settings.chatBackgroundCustomUrl) return;
    setCustomBgUploading(true);
    try {
      let url = settings.chatBackgroundCustomUrl;
      if (customBgFile) {
        const uploaded = await uploadsAPI.uploadFile(customBgFile);
        url = uploaded.url;
        localStorage.setItem("chat_background_custom_url", uploaded.url);
      }
      if (!url) return;
      localStorage.setItem("chat_background_custom_scale", String(customBgScale));
      localStorage.setItem("chat_background_custom_pos_x", String(customBgOffset.x));
      localStorage.setItem("chat_background_custom_pos_y", String(customBgOffset.y));
      localStorage.setItem("chat_background", "custom");
      setSettings((prev) => ({
        ...prev,
        chatBackground: "custom",
        chatBackgroundCustomUrl: url,
      }));
      window.dispatchEvent(new CustomEvent("chatBackgroundChange", { detail: "custom" }));
      toast.success(t("settings.chatBackgroundCustomApplied"));
      setShowCustomBgModal(false);
    } catch (error) {
      console.error("Custom background upload failed", error);
      toast.error(t("settings.chatBackgroundCustomError"));
    } finally {
      setCustomBgUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      localStorage.setItem("doubleClickAction", settings.doubleClickAction);
      window.dispatchEvent(new Event("doubleClickActionChange"));
      toast.success(t("settings.saved"));
    } catch (error) {
      console.error("Failed to save chat settings:", error);
      toast.error(t("settings.saveError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="px-6 py-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t("settings.chat")}</h1>
          <p className="text-sm text-secondary mt-1">{t("settings.sections.chat.description")}</p>
        </div>
        <button
          onClick={() => navigate("/settings")}
          className="px-4 py-2 rounded-full text-xs font-medium bg-white/5 text-secondary hover:text-white transition"
        >
          {t("settings.backToSettings")}
        </button>
      </div>

      <div className="p-6 space-y-6">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-foreground">
            <MessageCircle className="h-5 w-5" />
            <h2 className="text-lg font-semibold">{t("settings.chat")}</h2>
          </div>

          <div className="card-glass p-5 space-y-6 rounded-[24px]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-white/60" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{t("settings.doubleClickAction")}</p>
                  <p className="text-xs text-secondary">{t("settings.doubleClickActionDescription")}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs text-white/80">
                  <input
                    type="radio"
                    name="doubleClickAction"
                    value="reply"
                    checked={settings.doubleClickAction === "reply"}
                    onChange={() => handleDoubleClickActionChange("reply")}
                    className="accent-white"
                  />
                  {t("settings.doubleClickReply")}
                </label>
                <label className="flex items-center gap-2 text-xs text-white/80">
                  <input
                    type="radio"
                    name="doubleClickAction"
                    value="heart"
                    checked={settings.doubleClickAction === "heart"}
                    onChange={() => handleDoubleClickActionChange("heart")}
                    className="accent-white"
                  />
                  {t("settings.doubleClickHeart")}
                </label>
              </div>
            </div>
            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-white/60" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{t("settings.chatBackground")}</p>
                  <p className="text-xs text-secondary">{t("settings.chatBackgroundDescription")}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleChatBackgroundChange("default")}
                  className={`group relative h-[120px] w-[160px] rounded-[16px] overflow-hidden border transition-smooth justify-self-start ${
                    settings.chatBackground === "default"
                      ? "border-[2px] border-white"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <div className="h-full w-full bg-[#0E0E11]" />
                  <span className="absolute bottom-3 left-3 text-xs font-medium text-white">
                    {t("settings.chatBackgroundDefault")}
                  </span>
                  {settings.chatBackground === "default" && (
                    <span className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white text-black flex items-center justify-center">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleChatBackgroundChange("silent_doodle")}
                  className={`group relative h-[120px] w-[160px] rounded-[16px] overflow-hidden border transition-smooth justify-self-center ${
                    settings.chatBackground === "silent_doodle"
                      ? "border-[2px] border-white"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <div
                    className="h-full w-full"
                    style={{
                      backgroundImage: `url(${silentDoodle})`,
                      backgroundRepeat: "repeat",
                      backgroundSize: "600px",
                      backgroundPosition: "center",
                      backgroundColor: "#0E0E11",
                    }}
                  />
                  <span className="absolute bottom-3 left-3 text-xs font-medium text-white">
                    {t("settings.chatBackgroundSilent")}
                  </span>
                  {settings.chatBackground === "silent_doodle" && (
                    <span className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white text-black flex items-center justify-center">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleChatBackgroundChange("game_doodle")}
                  className={`group relative h-[120px] w-[160px] rounded-[16px] overflow-hidden border transition-smooth justify-self-end ${
                    settings.chatBackground === "game_doodle"
                      ? "border-[2px] border-white"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <div
                    className="h-full w-full"
                    style={{
                      backgroundImage: `url(${gameDoodle})`,
                      backgroundRepeat: "repeat",
                      backgroundSize: "600px",
                      backgroundPosition: "center",
                      backgroundColor: "#0E0E11",
                    }}
                  />
                  <span className="absolute bottom-3 left-3 text-xs font-medium text-white">
                    {t("settings.chatBackgroundGame")}
                  </span>
                  {settings.chatBackground === "game_doodle" && (
                    <span className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white text-black flex items-center justify-center">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleChatBackgroundChange("cosmic_doodle")}
                  className={`group relative h-[120px] w-[160px] rounded-[16px] overflow-hidden border transition-smooth justify-self-start ${
                    settings.chatBackground === "cosmic_doodle"
                      ? "border-[2px] border-white"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <div
                    className="h-full w-full"
                    style={{
                      backgroundImage: `url(${cosmicDoodle})`,
                      backgroundRepeat: "repeat",
                      backgroundSize: "600px",
                      backgroundPosition: "center",
                      backgroundColor: "#0E0E11",
                    }}
                  />
                  <span className="absolute bottom-3 left-3 text-xs font-medium text-white">
                    {t("settings.chatBackgroundCosmic")}
                  </span>
                  {settings.chatBackground === "cosmic_doodle" && (
                    <span className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white text-black flex items-center justify-center">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleChatBackgroundChange("code_doodle")}
                  className={`group relative h-[120px] w-[160px] rounded-[16px] overflow-hidden border transition-smooth justify-self-center ${
                    settings.chatBackground === "code_doodle"
                      ? "border-[2px] border-white"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <div
                    className="h-full w-full"
                    style={{
                      backgroundImage: `url(${codeDoodle})`,
                      backgroundRepeat: "repeat",
                      backgroundSize: "600px",
                      backgroundPosition: "center",
                      backgroundColor: "#0E0E11",
                    }}
                  />
                  <span className="absolute bottom-3 left-3 text-xs font-medium text-white">
                    {t("settings.chatBackgroundCode")}
                  </span>
                  {settings.chatBackground === "code_doodle" && (
                    <span className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white text-black flex items-center justify-center">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomBgModal(true)}
                  className={`group relative h-[120px] w-[160px] rounded-[16px] overflow-hidden border transition-smooth justify-self-end ${
                    settings.chatBackground === "custom"
                      ? "border-[2px] border-white"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  {settings.chatBackgroundCustomUrl ? (
                    <div
                      className="h-full w-full"
                      style={{
                        backgroundImage: `url(${settings.chatBackgroundCustomUrl})`,
                        backgroundRepeat: "repeat",
                        backgroundSize: "600px",
                        backgroundPosition: "center",
                        backgroundColor: "#0E0E11",
                      }}
                    />
                  ) : (
                    <div className="h-full w-full bg-white/5 flex flex-col items-center justify-center gap-2">
                      <Upload className="h-5 w-5 text-white/60" />
                      <span className="text-[11px] text-white/70">{t("settings.chatBackgroundCustom")}</span>
                    </div>
                  )}
                  <span className="absolute bottom-3 left-3 text-xs font-medium text-white">
                    {t("settings.chatBackgroundCustom")}
                  </span>
                  {settings.chatBackground === "custom" && (
                    <span className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white text-black flex items-center justify-center">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        <motion.button
          onClick={handleSave}
          disabled={loading}
          className="btn-glass w-full"
          whileHover={loading ? {} : { scale: 1.02 }}
          whileTap={loading ? {} : { scale: 0.98 }}
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>{t("settings.saving")}</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>{t("settings.saveChanges")}</span>
            </>
          )}
        </motion.button>
      </div>

      <Dialog open={showCustomBgModal} onOpenChange={setShowCustomBgModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{t("settings.chatBackgroundCustom")}</DialogTitle>
            <DialogDescription className="text-white/60">
              {t("settings.chatBackgroundCustomDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
              <div
                className="h-[180px] w-full rounded-[16px] border border-white/10"
                style={
                  customBgPreview
                    ? {
                        backgroundImage: `url(${customBgPreview})`,
                        backgroundRepeat: "no-repeat",
                        backgroundSize:
                          customBgScale === 1
                            ? "cover"
                            : `${Math.round(customBgScale * 100)}%`,
                        backgroundPosition: `calc(50% + ${customBgOffset.x}px) calc(50% + ${customBgOffset.y}px)`,
                        backgroundColor: "#0E0E11",
                      }
                    : {
                        backgroundColor: "#0E0E11",
                      }
                }
                onMouseDown={(event) => {
                  if (!customBgPreview) return;
                  setDragging(true);
                  setDragStart({
                    x: event.clientX - customBgOffset.x,
                    y: event.clientY - customBgOffset.y,
                  });
                }}
                onMouseMove={(event) => {
                  if (!dragging || !dragStart) return;
                  setCustomBgOffset({
                    x: event.clientX - dragStart.x,
                    y: event.clientY - dragStart.y,
                  });
                }}
                onMouseUp={() => {
                  setDragging(false);
                  setDragStart(null);
                }}
                onMouseLeave={() => {
                  setDragging(false);
                  setDragStart(null);
                }}
                onTouchStart={(event) => {
                  const touch = event.touches[0];
                  if (!touch || !customBgPreview) return;
                  setDragging(true);
                  setDragStart({
                    x: touch.clientX - customBgOffset.x,
                    y: touch.clientY - customBgOffset.y,
                  });
                }}
                onTouchMove={(event) => {
                  const touch = event.touches[0];
                  if (!touch || !dragging || !dragStart) return;
                  setCustomBgOffset({
                    x: touch.clientX - dragStart.x,
                    y: touch.clientY - dragStart.y,
                  });
                }}
                onTouchEnd={() => {
                  setDragging(false);
                  setDragStart(null);
                }}
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/70">{t("settings.chatBackgroundZoom")}</span>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.05}
                value={customBgScale}
                onChange={(event) => setCustomBgScale(Number(event.target.value))}
                className="flex-1 accent-white"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-sm text-white/80 hover:bg-white/5 transition-smooth cursor-pointer">
                <Upload className="h-4 w-4" />
                <span>{t("settings.chatBackgroundUpload")}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setCustomBgFile(file);
                    setCustomBgOffset({ x: 0, y: 0 });
                    setCustomBgScale(1);
                    const reader = new FileReader();
                    reader.onload = () => setCustomBgPreview(reader.result as string);
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomBgModal(false)}
                  className="px-4 py-2 rounded-full text-sm text-white/70 border border-white/10 hover:bg-white/5 transition-smooth"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleCustomBackgroundApply}
                  disabled={customBgUploading || !customBgPreview}
                  className="px-4 py-2 rounded-full text-sm font-semibold text-black bg-white/90 hover:bg-white transition-smooth disabled:opacity-60"
                >
                  {customBgUploading ? t("common.loading") : t("settings.chatBackgroundApply")}
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatPage;

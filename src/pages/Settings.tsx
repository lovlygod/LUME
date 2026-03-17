import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Globe, Lock, Users, MessageCircle, Save, Snowflake, AlertTriangle, Trash2, LogOut, MonitorSmartphone, Check, Upload } from "lucide-react";
import silentDoodle from "@/assets/Chat-Background/silent-doodle.png";
import gameDoodle from "@/assets/Chat-Background/game-doodle.png";
import cosmicDoodle from "@/assets/Chat-Background/Cosmic Doodle.png";
import codeDoodle from "@/assets/Chat-Background/Code Doodle.png";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { profileAPI, uploadsAPI } from "@/services/api";
import { toast } from 'sonner';
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useChatBackground } from "@/hooks/useChatBackground";

const Settings = () => {
  const { user: authUser, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { customScale, customPos } = useChatBackground();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCustomBgModal, setShowCustomBgModal] = useState(false);
  const [customBgPreview, setCustomBgPreview] = useState<string | null>(null);
  const [customBgFile, setCustomBgFile] = useState<File | null>(null);
  const [customBgUploading, setCustomBgUploading] = useState(false);
  const [customBgScale, setCustomBgScale] = useState(1);
  const [customBgOffset, setCustomBgOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [settings, setSettings] = useState({
    theme: "dark",
    snowEffect: false,
    snowVariant: "dots" as "dots" | "flakes" | "hearts",
    postPrivacy: "public",
    messagePrivacy: "everyone",
    doubleClickAction: "reply" as "reply" | "heart",
    chatBackground: "default" as "default" | "silent_doodle" | "game_doodle" | "cosmic_doodle" | "code_doodle" | "custom",
    chatBackgroundCustomUrl: null as string | null,
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedTheme = localStorage.getItem("theme") || "dark";
    const savedSettings = localStorage.getItem("userSettings");
    const savedLanguage = localStorage.getItem("language") || "ru";
    const savedSnow = localStorage.getItem("snowEffect") === "true";
    const savedSnowVariant =
      (localStorage.getItem("snowEffectVariant") as "dots" | "flakes" | "hearts" | null) || "dots";
    
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to parse settings:", e);
      }
    }
    
    const savedDoubleClickAction =
      (localStorage.getItem("doubleClickAction") as "reply" | "heart" | null) || "reply";

    const savedChatBackground =
      (localStorage.getItem("chat_background") as "default" | "silent_doodle" | "game_doodle" | "cosmic_doodle" | "code_doodle" | "custom" | null) ||
      "default";
    const savedCustomUrl = localStorage.getItem("chat_background_custom_url");

    setSettings(prev => ({
      ...prev,
      theme: savedTheme,
      snowEffect: savedSnow,
      snowVariant: savedSnowVariant,
      doubleClickAction: savedDoubleClickAction,
      chatBackground: savedChatBackground,
      chatBackgroundCustomUrl: savedCustomUrl,
    }));
  }, []);

  useEffect(() => {
    if (showCustomBgModal) {
      setCustomBgPreview(settings.chatBackgroundCustomUrl);
      setCustomBgFile(null);
      setCustomBgScale(customScale || 1);
      setCustomBgOffset(customPos || { x: 0, y: 0 });
    }
  }, [showCustomBgModal, settings.chatBackgroundCustomUrl, customScale, customPos]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save theme
      localStorage.setItem("theme", settings.theme);
      
      // Save snow effect
      localStorage.setItem("snowEffect", String(settings.snowEffect));
      localStorage.setItem("snowEffectVariant", settings.snowVariant);
      
      // Save other settings
      localStorage.setItem("userSettings", JSON.stringify({
        postPrivacy: settings.postPrivacy,
        messagePrivacy: settings.messagePrivacy
      }));

      localStorage.setItem("doubleClickAction", settings.doubleClickAction);
      window.dispatchEvent(new Event("doubleClickActionChange"));

      toast.success(t("settingsSaved"));
      
      // Dispatch theme change event
      window.dispatchEvent(new CustomEvent("themeChange", { detail: settings.theme }));
      window.dispatchEvent(
        new CustomEvent("snowEffectChange", {
          detail: { enabled: settings.snowEffect, variant: settings.snowVariant }
        })
      );
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error(t("settingsSaveError"));
    } finally {
      setLoading(false);
    }
  };

  const handleDoubleClickActionChange = (action: "reply" | "heart") => {
    setSettings((prev) => ({ ...prev, doubleClickAction: action }));
    localStorage.setItem("doubleClickAction", action);
    window.dispatchEvent(new Event("doubleClickActionChange"));
  };

  const handleChatBackgroundChange = (value: "default" | "silent_doodle" | "game_doodle" | "cosmic_doodle" | "code_doodle" | "custom") => {
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

  const handleLanguageChange = (lang: "ru" | "en") => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
    toast.success(t("settings.languageChanged"));
  };

  const handleDeleteAccount = async () => {
    if (deletePassword.length < 6) {
      toast.error(t("settings.deleteAccountPasswordTooShort"));
      return;
    }

    if (deleteConfirm !== "DELETE") {
      toast.error(t("settings.deleteAccountConfirmMismatch"));
      return;
    }

    setIsDeleting(true);
    try {
      await profileAPI.deleteAccount(deletePassword);
      
      // Clear all local storage
      localStorage.clear();
      
      // Logout
      logout();
      
      // Show success message
      toast.success(t("settings.deleteAccountSuccess"));
      
      // Redirect to home page
      setTimeout(() => {
        navigate("/");
        window.location.reload();
      }, 2000);
    } catch (error: unknown) {
      console.error("Failed to delete account:", error);
      const err = error as { message?: string } | null;
      toast.error(err?.message || t("settings.deleteAccountError"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-6 py-8">
        <h1 className="text-2xl font-semibold text-white">{t("settings.title")}</h1>
        <p className="text-sm text-secondary mt-1">
          {t("settings.subtitle")}
        </p>
      </div>

      {/* Settings Sections */}
      <div className="p-6 space-y-6">
        {/* Language */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-foreground">
            <Globe className="h-5 w-5" />
            <h2 className="text-lg font-semibold">{t("settings.language")}</h2>
          </div>
          
          <div className="card-glass p-5 space-y-4 rounded-[24px]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-white/60" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{t("settings.interfaceLanguage")}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleLanguageChange("ru")}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-smooth ${
                    language === "ru"
                      ? "bg-white/10 text-white"
                      : "bg-white/5 text-secondary hover:text-white"
                  }`}
                >
                  RU
                </button>
                <button
                  onClick={() => handleLanguageChange("en")}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-smooth ${
                    language === "en"
                      ? "bg-white/10 text-white"
                      : "bg-white/5 text-secondary hover:text-white"
                  }`}
                >
                  EN
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-foreground">
            <Sun className="h-5 w-5" />
            <h2 className="text-lg font-semibold">{t("appearance")}</h2>
          </div>
          
          <div className="card-glass p-5 space-y-4 rounded-[24px]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                  <Snowflake className="h-5 w-5 text-white/60" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{t("settings.snowEffect")}</p>
                  <p className="text-xs text-secondary">
                    {t("settings.snowEffectDescription")}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setSettings(prev => ({ ...prev, snowEffect: !prev.snowEffect }))}
                className={`relative h-7 w-12 rounded-full transition-smooth ${
                  settings.snowEffect ? 'bg-white/20' : 'bg-white/10'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition-smooth ${
                    settings.snowEffect ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                  <Snowflake className="h-5 w-5 text-white/60" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{t("settings.snowVariant")}</p>
                  <p className="text-xs text-secondary">{t("settings.snowVariantDescription")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSettings(prev => ({ ...prev, snowVariant: "dots" }))}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-smooth ${
                    settings.snowVariant === "dots"
                      ? "bg-white/10 text-white"
                      : "bg-white/5 text-secondary hover:text-white"
                  }`}
                >
                  {t("settings.snowVariantDots")}
                </button>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, snowVariant: "flakes" }))}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-smooth ${
                    settings.snowVariant === "flakes"
                      ? "bg-white/10 text-white"
                      : "bg-white/5 text-secondary hover:text-white"
                  }`}
                >
                  {t("settings.snowVariantFlakes")}
                </button>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, snowVariant: "hearts" }))}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-smooth ${
                    settings.snowVariant === "hearts"
                      ? "bg-white/10 text-white"
                      : "bg-white/5 text-secondary hover:text-white"
                  }`}
                >
                  {t("settings.snowVariantHearts")}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-foreground">
            <Lock className="h-5 w-5" />
            <h2 className="text-lg font-semibold">{t("privacy")}</h2>
          </div>
          
          <div className="card-glass p-5 space-y-4 rounded-[24px]">
            {/* Post Privacy */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-white/60" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{t("postPrivacy")}</p>
                  <p className="text-xs text-secondary">
                    {t("postPrivacyDescription")}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSettings(prev => ({ ...prev, postPrivacy: "public" }))}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-smooth ${
                    settings.postPrivacy === "public"
                      ? "bg-white/10 text-white"
                      : "bg-white/5 text-secondary hover:text-white"
                  }`}
                >
                  {t("public")}
                </button>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, postPrivacy: "followers" }))}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-smooth ${
                    settings.postPrivacy === "followers"
                      ? "bg-white/10 text-white"
                      : "bg-white/5 text-secondary hover:text-white"
                  }`}
                >
                  {t("followersOnly")}
                </button>
              </div>
            </div>

            {/* Message Privacy */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-white/60" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{t("messagePrivacy")}</p>
                  <p className="text-xs text-secondary">
                    {t("messagePrivacyDescription")}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSettings(prev => ({ ...prev, messagePrivacy: "everyone" }))}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-smooth ${
                    settings.messagePrivacy === "everyone"
                      ? "bg-white/10 text-white"
                      : "bg-white/5 text-secondary hover:text-white"
                  }`}
                >
                  {t("everyone")}
                </button>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, messagePrivacy: "followers" }))}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-smooth ${
                    settings.messagePrivacy === "followers"
                      ? "bg-white/10 text-white"
                      : "bg-white/5 text-secondary hover:text-white"
                  }`}
                >
                  {t("followersOnly")}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Chat */}
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
                  <span className="absolute bottom-3 left-3 text-xs font-medium text-white">{t("settings.chatBackgroundDefault")}</span>
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
                  <span className="absolute bottom-3 left-3 text-xs font-medium text-white">{t("settings.chatBackgroundSilent")}</span>
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
                  <span className="absolute bottom-3 left-3 text-xs font-medium text-white">{t("settings.chatBackgroundGame")}</span>
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
                  <span className="absolute bottom-3 left-3 text-xs font-medium text-white">{t("settings.chatBackgroundCosmic")}</span>
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
                  <span className="absolute bottom-3 left-3 text-xs font-medium text-white">{t("settings.chatBackgroundCode")}</span>
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

        {/* Sessions */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-foreground">
            <MonitorSmartphone className="h-5 w-5" />
            <h2 className="text-lg font-semibold">{t("sessions.title")}</h2>
          </div>

          <div className="card-glass p-5 space-y-3 rounded-[24px]">
            <p className="text-xs text-secondary">{t("sessions.subtitle")}</p>
            <button
              onClick={() => navigate("/settings/sessions")}
              className="w-full rounded-full py-3 text-sm font-semibold text-white border border-white/10 hover:bg-white/5 transition-smooth flex items-center justify-center gap-2"
            >
              <MonitorSmartphone className="h-4 w-4" />
              <span>{t("sessions.manage")}</span>
            </button>
          </div>
        </section>

        {/* Save Button */}
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
              <span>{t("saving")}</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>{t("saveChanges")}</span>
            </>
          )}
        </motion.button>

        {/* Danger Zone */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-white">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-lg font-semibold">{t("settings.dangerZone")}</h2>
          </div>

          <div className="card-glass p-5 space-y-4 rounded-[24px]">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">{t("settings.deleteAccountTitle")}</p>
                <p className="text-xs text-secondary mt-1">
                  {t("settings.deleteAccountDescription")}
                </p>
              </div>
            </div>

            <motion.button
              onClick={() => setShowDeleteModal(true)}
              className="w-full rounded-full py-3 text-sm font-semibold text-red-200 border border-red-200/20 hover:bg-white/5 transition-smooth flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Trash2 className="h-4 w-4" />
              <span>{t("settings.deleteAccount")}</span>
            </motion.button>
          </div>
        </section>
      </div>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel p-6 max-w-md w-full"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-200" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{t("settings.deleteAccount")}</h3>
                  <p className="text-xs text-secondary">{t("settings.deleteAccountModalSubtitle")}</p>
                </div>
              </div>

              {/* Warning List */}
              <div className="border border-white/10 rounded-2xl p-4 mb-4 space-y-2">
                <p className="text-sm font-semibold text-red-200 mb-2">{t("settings.deleteAccountWarnings")}</p>
                <ul className="text-xs text-secondary space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-red-200">•</span>
                    <span>{t("settings.deleteAccountWarning1")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-200">•</span>
                    <span>{t("settings.deleteAccountWarning2")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-200">•</span>
                    <span>{t("settings.deleteAccountWarning3")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-200">•</span>
                    <span>{t("settings.deleteAccountWarning4")}</span>
                  </li>
                </ul>
              </div>

              {/* Password Input */}
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    {t("settings.deleteAccountPasswordLabel")}
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder={t("settings.deleteAccountPasswordPlaceholder")}
                    className="glass-input w-full px-4 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    {t("settings.deleteAccountConfirmLabel")}
                  </label>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder={t("settings.deleteAccountConfirmPlaceholder")}
                    className="glass-input w-full px-4 py-2 text-sm text-white"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 rounded-full py-3 text-sm font-medium bg-white/5 text-white hover:bg-white/10 transition-smooth disabled:opacity-50"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || !deletePassword || !deleteConfirm}
                  className="flex-1 rounded-full py-3 text-sm font-semibold text-red-200 border border-red-200/20 hover:bg-white/5 transition-smooth disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>{t("settings.deleting")}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>{t("settings.deleteAccount")}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  setDragStart({ x: event.clientX - customBgOffset.x, y: event.clientY - customBgOffset.y });
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
                  setDragStart({ x: touch.clientX - customBgOffset.x, y: touch.clientY - customBgOffset.y });
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

export default Settings;

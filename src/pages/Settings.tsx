import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Globe, Lock, Users, MessageCircle, Save, Snowflake, AlertTriangle, Trash2, LogOut, MonitorSmartphone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { profileAPI } from "@/services/api";
import { toast } from 'sonner';
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const { user: authUser, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [settings, setSettings] = useState({
    theme: "dark",
    snowEffect: false,
    snowVariant: "dots" as "dots" | "flakes" | "hearts",
    postPrivacy: "public",
    messagePrivacy: "everyone"
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
    
    setSettings(prev => ({ ...prev, theme: savedTheme, snowEffect: savedSnow, snowVariant: savedSnowVariant }));
  }, []);

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
            <div className="flex items-center justify-between">
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
            <div className="flex items-center justify-between">
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
    </div>
  );
};

export default Settings;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, MessageCircle, Globe, Save } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

type PrivacySettings = {
  postPrivacy: "public" | "followers";
  messagePrivacy: "everyone" | "followers";
};

const PrivacyPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<PrivacySettings>({
    postPrivacy: "public",
    messagePrivacy: "everyone",
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem("userSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings) as Partial<PrivacySettings>;
        setSettings((prev) => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error("Failed to parse privacy settings:", error);
      }
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      localStorage.setItem(
        "userSettings",
        JSON.stringify({
          postPrivacy: settings.postPrivacy,
          messagePrivacy: settings.messagePrivacy,
        })
      );
      toast.success(t("settings.saved"));
    } catch (error) {
      console.error("Failed to save privacy settings:", error);
      toast.error(t("settings.saveError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="px-6 py-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t("settings.privacy")}</h1>
          <p className="text-sm text-secondary mt-1">{t("settings.sections.privacy.description")}</p>
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
            <Lock className="h-5 w-5" />
            <h2 className="text-lg font-semibold">{t("settings.privacy")}</h2>
          </div>

          <div className="card-glass p-5 space-y-4 rounded-[24px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-white/60" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{t("settings.postPrivacy")}</p>
                  <p className="text-xs text-secondary">{t("settings.postPrivacyDescription")}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSettings((prev) => ({ ...prev, postPrivacy: "public" }))}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-smooth ${
                    settings.postPrivacy === "public"
                      ? "bg-white/10 text-white"
                      : "bg-white/5 text-secondary hover:text-white"
                  }`}
                >
                  {t("settings.public")}
                </button>
                <button
                  onClick={() => setSettings((prev) => ({ ...prev, postPrivacy: "followers" }))}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-smooth ${
                    settings.postPrivacy === "followers"
                      ? "bg-white/10 text-white"
                      : "bg-white/5 text-secondary hover:text-white"
                  }`}
                >
                  {t("settings.followersOnly")}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-white/60" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{t("settings.messagePrivacy")}</p>
                  <p className="text-xs text-secondary">{t("settings.messagePrivacyDescription")}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSettings((prev) => ({ ...prev, messagePrivacy: "everyone" }))}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-smooth ${
                    settings.messagePrivacy === "everyone"
                      ? "bg-white/10 text-white"
                      : "bg-white/5 text-secondary hover:text-white"
                  }`}
                >
                  {t("settings.everyone")}
                </button>
                <button
                  onClick={() => setSettings((prev) => ({ ...prev, messagePrivacy: "followers" }))}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-smooth ${
                    settings.messagePrivacy === "followers"
                      ? "bg-white/10 text-white"
                      : "bg-white/5 text-secondary hover:text-white"
                  }`}
                >
                  {t("settings.followersOnly")}
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
    </div>
  );
};

export default PrivacyPage;

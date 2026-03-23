import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Snowflake } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const AppearancePage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    snowEffect: false,
    snowVariant: "dots" as "dots" | "flakes" | "hearts",
  });

  useEffect(() => {
    const savedSnow = localStorage.getItem("snowEffect") === "true";
    const savedSnowVariant =
      (localStorage.getItem("snowEffectVariant") as "dots" | "flakes" | "hearts" | null) || "dots";
    setSettings({
      snowEffect: savedSnow,
      snowVariant: savedSnowVariant,
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      localStorage.setItem("snowEffect", String(settings.snowEffect));
      localStorage.setItem("snowEffectVariant", settings.snowVariant);
      window.dispatchEvent(
        new CustomEvent("snowEffectChange", {
          detail: { enabled: settings.snowEffect, variant: settings.snowVariant },
        })
      );
      toast.success(t("settings.saved"));
    } catch (error) {
      console.error("Failed to save appearance settings:", error);
      toast.error(t("settings.saveError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="px-6 py-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t("settings.appearance")}</h1>
          <p className="text-sm text-secondary mt-1">{t("settings.sections.appearance.description")}</p>
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
            <Snowflake className="h-5 w-5" />
            <h2 className="text-lg font-semibold">{t("settings.snowEffect")}</h2>
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
                  settings.snowEffect ? "bg-white/20" : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition-smooth ${
                    settings.snowEffect ? "translate-x-5" : "translate-x-0"
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

export default AppearancePage;

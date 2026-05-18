import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Globe } from "lucide-react";
import Lottie from "lottie-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import CustomSelect from "@/components/ui/CustomSelect";
import russiaLottie from "@/assets/lottie/Russia.json";
import usaLottie from "@/assets/lottie/USA.json";
import chinaLottie from "@/assets/lottie/China.json";
import spainLottie from "@/assets/lottie/Spain.json";
import portugueseBrazilLottie from "@/assets/lottie/Portuguese (Brazil).json";

const LanguagePage = () => {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") || "ru";
    if (savedLanguage !== language) {
      setLanguage(savedLanguage as typeof language);
    }
  }, [language, setLanguage]);

  const handleLanguageChange = (lang: "ru" | "en" | "zh" | "es" | "pt-BR") => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
    toast.success(t("settings.languageChanged"));
  };

  const languageOptions = [
    { value: "ru", label: "Россия", lottie: russiaLottie },
    { value: "en", label: "USA", lottie: usaLottie },
    { value: "zh", label: "中国", lottie: chinaLottie },
    { value: "es", label: "España", lottie: spainLottie },
    { value: "pt-BR", label: "Português (Brasil)", lottie: portugueseBrazilLottie },
  ] as const;

  return (
    <div className="min-h-screen">
      <div className="px-6 py-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t("settings.language")}</h1>
          <p className="text-sm text-secondary mt-1">{t("settings.sections.language.description")}</p>
        </div>
        <button
          onClick={() => navigate("/settings")}
          className="btn-glass-outline px-4 py-2 text-xs"
        >
          {t("settings.backToSettings")}
        </button>
      </div>

      <div className="p-6 space-y-6">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-foreground">
            <Globe className="h-5 w-5" />
            <h2 className="text-lg font-semibold">{t("settings.interfaceLanguage")}</h2>
          </div>

          <div className="card-glass p-5 space-y-4 rounded-3xl">
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
                <CustomSelect
                  value={language}
                  onChange={(value) => handleLanguageChange(value as "ru" | "en" | "zh" | "es" | "pt-BR")}
                  options={languageOptions.map((option) => ({
                    value: option.value,
                    label: (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6">
                          <Lottie animationData={option.lottie} loop className="h-6 w-6" />
                        </div>
                        <span>{option.label}</span>
                      </div>
                    ),
                  }))}
                  placeholder={t("settings.interfaceLanguage")}
                  buttonClassName="h-10 w-[200px] rounded-full border-white/10 bg-white/5 text-white"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LanguagePage;

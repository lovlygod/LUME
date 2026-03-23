import { Link } from "react-router-dom";
import { Sun, Lock, MessageCircle, Globe, MonitorSmartphone, AlertTriangle, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Settings = () => {
  const { t } = useLanguage();

  const cards = [
    {
      to: "/settings/appearance",
      icon: Sun,
      title: t("settings.appearance"),
      description: t("settings.sections.appearance.description"),
    },
    {
      to: "/settings/privacy",
      icon: Lock,
      title: t("settings.privacy"),
      description: t("settings.sections.privacy.description"),
    },
    {
      to: "/settings/chat",
      icon: MessageCircle,
      title: t("settings.chat"),
      description: t("settings.sections.chat.description"),
    },
    {
      to: "/settings/language",
      icon: Globe,
      title: t("settings.language"),
      description: t("settings.sections.language.description"),
    },
    {
      to: "/settings/sessions",
      icon: MonitorSmartphone,
      title: t("sessions.title"),
      description: t("sessions.subtitle"),
    },
    {
      to: "/settings/danger",
      icon: AlertTriangle,
      title: t("settings.dangerZone"),
      description: t("settings.sections.danger.description"),
    },
  ];

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
      <div className="p-6 grid gap-4 grid-cols-1">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.to}
              to={card.to}
              className="card-glass p-5 rounded-[24px] border border-white/10 hover:border-white/25 transition-smooth"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-white/70" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{card.title}</p>
                    <ChevronRight className="h-4 w-4 text-white/40" />
                  </div>
                  <p className="text-xs text-secondary mt-1">{card.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Settings;

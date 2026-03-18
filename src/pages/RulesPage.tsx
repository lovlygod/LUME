import { Shield, AlertTriangle, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import HelpShell from "@/components/help/HelpShell";

const RulesPage = () => {
  const { t } = useLanguage();

  const sections = [
    { key: "safety", icon: Shield },
    { key: "content", icon: AlertTriangle },
    { key: "privacy", icon: Lock },
  ];

  return (
    <HelpShell
      title={t("help.rules.title")}
      subtitle={t("help.rules.subtitle")}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <div className="sticky top-6 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
              {t("help.nav.title")}
            </div>
            <div className="mt-4 space-y-2">
              {sections.map((section) => (
                <a
                  key={section.key}
                  href={`#${section.key}`}
                  className="block rounded-full px-4 py-2 text-sm text-white/60 transition-smooth hover:text-white hover:bg-white/5"
                >
                  {t(`help.rules.nav.${section.key}`)}
                </a>
              ))}
            </div>
          </div>
        </aside>

        <main className="lg:col-span-6 space-y-6">
          {sections.map((section) => (
            <motion.section
              key={section.key}
              id={section.key}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              <div className="flex items-center gap-3 text-sm text-white/60">
                <section.icon className="h-4 w-4" />
                {t(`help.rules.nav.${section.key}`)}
              </div>
              <h2 className="mt-3 text-xl font-semibold text-white">{t(`help.rules.${section.key}.title`)}</h2>
              <p className="mt-2 text-sm text-white/60">{t(`help.rules.${section.key}.lead`)}</p>

              <div className="mt-4 space-y-3">
                <div className="rounded-[22px] border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-emerald-200">
                    {t("help.rules.allowed")}
                  </div>
                  <p className="mt-2 text-sm text-emerald-100/80">{t(`help.rules.${section.key}.allowed`)}</p>
                </div>
                <div className="rounded-[22px] border border-rose-500/20 bg-rose-500/10 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-rose-200">
                    {t("help.rules.forbidden")}
                  </div>
                  <p className="mt-2 text-sm text-rose-100/80">{t(`help.rules.${section.key}.forbidden`)}</p>
                </div>
                <div className="rounded-[22px] border border-amber-500/20 bg-amber-500/10 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-amber-200">
                    {t("help.rules.notes")}
                  </div>
                  <p className="mt-2 text-sm text-amber-100/80">{t(`help.rules.${section.key}.notes`)}</p>
                </div>
              </div>
            </motion.section>
          ))}
        </main>

        <aside className="lg:col-span-3 space-y-4">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="text-sm font-semibold text-white">{t("help.rules.actions.title")}</div>
            <p className="mt-2 text-sm text-white/60">{t("help.rules.actions.subtitle")}</p>
            <div className="mt-4 space-y-2">
              <a className="block rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:text-white" href="/support">
                {t("help.rules.actions.report")}
              </a>
              <a className="block rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:text-white" href="/contacts">
                {t("help.rules.actions.contact")}
              </a>
            </div>
          </div>
        </aside>
      </div>
    </HelpShell>
  );
};

export default RulesPage;

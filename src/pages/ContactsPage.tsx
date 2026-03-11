import { Mail, MessageCircle, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import HelpShell from "@/components/help/HelpShell";

const ContactsPage = () => {
  const { t } = useLanguage();

  const cards = [
    {
      key: "general",
      icon: MessageCircle,
      actionLabel: t("help.contacts.cards.general.action"),
      actionHref: "https://t.me/",
    },
    {
      key: "partnerships",
      icon: Mail,
      actionLabel: t("help.contacts.cards.partnerships.action"),
      actionHref: "mailto:partners@lume.app",
    },
    {
      key: "press",
      icon: FileText,
      actionLabel: t("help.contacts.cards.press.action"),
      actionHref: "mailto:press@lume.app",
      extraLabel: t("help.contacts.cards.press.kit"),
      extraHref: "/press-kit",
    }
  ];

  return (
    <HelpShell title={t("help.contacts.title")} subtitle={t("help.contacts.subtitle")}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <div className="sticky top-6 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
              {t("help.contacts.nav")}
            </div>
            <p className="mt-3 text-sm text-white/60">{t("help.contacts.navDescription")}</p>
          </div>
        </aside>

        <main className="lg:col-span-6 space-y-6">
          <div className="grid gap-4">
            {cards.map((card) => (
              <motion.div
                key={card.key}
                whileHover={{ y: -2 }}
                className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">{t(`help.contacts.cards.${card.key}.title`)}</div>
                    <p className="mt-2 text-sm text-white/60">{t(`help.contacts.cards.${card.key}.description`)}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
                    <card.icon className="h-5 w-5 text-white/70" />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <a
                    href={card.actionHref}
                    className="inline-flex items-center rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-black"
                  >
                    {card.actionLabel}
                  </a>
                  {card.extraLabel && card.extraHref && (
                    <a
                      href={card.extraHref}
                      className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70"
                    >
                      {card.extraLabel}
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </main>

        <aside className="lg:col-span-3 space-y-4">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="text-sm font-semibold text-white">{t("help.contacts.side.title")}</div>
            <p className="mt-2 text-sm text-white/60">{t("help.contacts.side.description")}</p>
            <a
              href="/support"
              className="mt-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70"
            >
              {t("help.contacts.side.support")}
            </a>
          </div>
        </aside>
      </div>
    </HelpShell>
  );
};

export default ContactsPage;

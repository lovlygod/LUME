import { useState } from "react";
import { AlertTriangle, Bug, ShieldCheck, Upload, Send, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import HelpShell from "@/components/help/HelpShell";

const SupportPage = () => {
  const { t } = useLanguage();
  const [topic, setTopic] = useState("bug");
  const [description, setDescription] = useState("");
  const [topicOpen, setTopicOpen] = useState(false);

  const topics = [
    { key: "bug", icon: Bug },
    { key: "account", icon: ShieldCheck },
    { key: "safety", icon: AlertTriangle },
  ];

  return (
    <HelpShell title={t("help.support.title")} subtitle={t("help.support.subtitle")}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <div className="sticky top-6 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
              {t("help.support.quick.title")}
            </div>
            <div className="mt-4 space-y-2">
              {topics.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTopic(item.key)}
                  className={`flex w-full items-center gap-2 rounded-full px-4 py-2 text-sm transition-smooth ${
                    topic === item.key
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {t(`help.support.quick.${item.key}`)}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="lg:col-span-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
          >
            <div className="text-sm text-white/60">{t("help.support.form.title")}</div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-[0.18em] text-white/50">
                  {t("help.support.form.topic")}
                </label>
                <div className="relative mt-2">
                  <button
                    type="button"
                    onClick={() => setTopicOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 transition-smooth hover:border-white/20"
                  >
                    <span>{t(`help.support.quick.${topic}`)}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${topicOpen ? "rotate-180" : ""}`} />
                  </button>
                  {topicOpen && (
                    <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[22px] border border-white/10 bg-[#0f0f12]/95 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
                      {topics.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            setTopic(item.key);
                            setTopicOpen(false);
                          }}
                          className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm transition-smooth hover:bg-white/5 ${
                            topic === item.key ? "bg-white/10 text-white" : "text-white/70"
                          }`}
                        >
                          <item.icon className="h-4 w-4" />
                          {t(`help.support.quick.${item.key}`)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.18em] text-white/50">
                  {t("help.support.form.description")}
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder={t("help.support.form.placeholder")}
                  className="mt-2 min-h-[120px] w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {t("help.support.form.attach")}
                </button>
                <a
                  href="https://t.me/"
                  className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-black"
                >
                  <Send className="h-3.5 w-3.5" />
                  {t("help.support.form.send")}
                </a>
              </div>
            </div>
          </motion.div>
        </main>

        <aside className="lg:col-span-3 space-y-4">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="text-sm font-semibold text-white">{t("help.support.side.title")}</div>
            <p className="mt-2 text-sm text-white/60">{t("help.support.side.description")}</p>
            <div className="mt-4 space-y-2">
              <a className="block rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:text-white" href="/status">
                {t("help.support.side.status")}
              </a>
              <a className="block rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:text-white" href="/faq">
                {t("help.support.side.faq")}
              </a>
            </div>
          </div>
        </aside>
      </div>
    </HelpShell>
  );
};

export default SupportPage;

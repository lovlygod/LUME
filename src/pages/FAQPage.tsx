import { useEffect, useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import HelpShell from "@/components/help/HelpShell";

const FAQPage = () => {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("account");

  const categories = useMemo(() => (
    [
      { key: "account", label: t("help.faq.categories.account") },
      { key: "feed", label: t("help.faq.categories.feed") },
      { key: "messages", label: t("help.faq.categories.messages") },
      { key: "privacy", label: t("help.faq.categories.privacy") },
    ]
  ), [t]);

  const questions = useMemo(() => (
    categories.flatMap((category) =>
      Array.from({ length: 5 }, (_, index) => {
        const id = index + 1;
        return {
          id: `${category.key}-${id}`,
          category: category.key,
          question: t(`help.faq.${category.key}.q${id}.title`),
          answer: t(`help.faq.${category.key}.q${id}.answer`),
          bullets: [
            t(`help.faq.${category.key}.q${id}.bullet1`),
            t(`help.faq.${category.key}.q${id}.bullet2`),
            t(`help.faq.${category.key}.q${id}.bullet3`)
          ].filter(Boolean),
          popular: t(`help.faq.${category.key}.q${id}.popular`) === "true",
        };
      })
    )
  ), [categories, t]);

  const filteredQuestions = questions.filter((item) => {
    const matchesCategory = item.category === activeCategory;
    const matchesQuery = query.trim()
      ? `${item.question} ${item.answer}`.toLowerCase().includes(query.toLowerCase())
      : true;
    return matchesCategory && matchesQuery;
  });

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "/") {
        event.preventDefault();
        const input = document.getElementById("faq-search") as HTMLInputElement | null;
        input?.focus();
      }
      if (event.key === "Escape") {
        setQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <HelpShell
      title={t("help.faq.title")}
      subtitle={t("help.faq.subtitle")}
      meta={t("help.faq.updated")}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <div className="sticky top-6 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
              {t("help.nav.title")}
            </div>
            <div className="mt-4 space-y-2">
              {categories.map((category) => (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => setActiveCategory(category.key)}
                  className={`w-full rounded-full px-4 py-2 text-left text-sm transition-smooth ${
                    activeCategory === category.key
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="lg:col-span-6 space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/50">
              <Sparkles className="h-3.5 w-3.5" />
              {t("help.faq.searchLabel")}
            </div>
            <div className="mt-4 relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                id="faq-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("help.faq.searchPlaceholder")}
                className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
          >
            <Accordion type="single" collapsible>
              {filteredQuestions.map((item) => (
                <AccordionItem key={item.id} value={item.id} className="border-white/10">
                  <AccordionTrigger className="text-left text-base text-white/90">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{item.question}</span>
                      {item.popular && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-white/60">
                          {t("help.faq.popular")}
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-white/70">
                    <p>{item.answer}</p>
                    {item.bullets.length > 0 && (
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-white/60">
                        {item.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    )}
                    <a href="/support" className="mt-4 inline-flex text-xs text-white/70 hover:text-white">
                      {t("help.faq.needHelp")}
                    </a>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            {filteredQuestions.length === 0 && (
              <div className="py-8 text-center text-sm text-white/50">{t("help.faq.empty")}</div>
            )}
          </motion.div>
        </main>

        <aside className="lg:col-span-3 space-y-4">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="text-sm font-semibold text-white">{t("help.quick.title")}</div>
            <p className="mt-2 text-sm text-white/60">{t("help.quick.description")}</p>
            <div className="mt-4 space-y-2">
              <a className="block rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:text-white" href="/support">
                {t("help.quick.support")}
              </a>
              <a className="block rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:text-white" href="/status">
                {t("help.quick.status")}
              </a>
              <a className="block rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:text-white" href="/contacts">
                {t("help.quick.contacts")}
              </a>
            </div>
          </div>
        </aside>
      </div>
    </HelpShell>
  );
};

export default FAQPage;

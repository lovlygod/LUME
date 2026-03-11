import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

type LegalSection = {
  titleKey: string;
  bodyKey?: string;
};

interface LegalPageLayoutProps {
  titleKey: string;
  descriptionKey: string;
  sections: LegalSection[];
}

const LegalPageLayout = ({ titleKey, descriptionKey, sections }: LegalPageLayoutProps) => {
  const { t } = useLanguage();

  useEffect(() => {
    const mainElement = document.querySelector("main.overflow-y-auto");
    if (mainElement) {
      mainElement.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[900px] px-5 py-10">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold text-white">{t(titleKey)}</h1>
          <p className="text-base leading-relaxed text-white/70">{t(descriptionKey)}</p>
        </header>

        <div className="mt-10 space-y-6">
          {sections.map((section) => (
            <section key={section.titleKey} className="space-y-2">
              <h2 className="text-lg font-semibold text-white">{t(section.titleKey)}</h2>
              {section.bodyKey && (
                <p className="text-sm leading-relaxed text-white/70">{t(section.bodyKey)}</p>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LegalPageLayout;

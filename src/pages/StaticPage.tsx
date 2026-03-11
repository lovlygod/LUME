import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface StaticSection {
  title: string;
  content: string;
}

interface StaticPageProps {
  titleKey: string;
  descriptionKey: string;
  sectionPrefix: string;
}

const StaticPage = ({ titleKey, descriptionKey, sectionPrefix }: StaticPageProps) => {
  const { t } = useLanguage();

  const sections: StaticSection[] = [
    {
      title: t(`${sectionPrefix}.section1.title`),
      content: t(`${sectionPrefix}.section1.content`),
    },
    {
      title: t(`${sectionPrefix}.section2.title`),
      content: t(`${sectionPrefix}.section2.content`),
    },
    {
      title: t(`${sectionPrefix}.section3.title`),
      content: t(`${sectionPrefix}.section3.content`),
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-white py-12">
      <div className="mx-auto w-full max-w-[960px] px-6">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur-[20px]">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold">{t(titleKey)}</h1>
            <p className="text-sm text-white/60">{t(descriptionKey)}</p>
          </div>
          <div className="mt-8 grid gap-4">
            {sections.map((section) => (
              <div
                key={section.title}
                className="rounded-[24px] border border-white/10 bg-white/6 p-5"
              >
                <h2 className="text-lg font-semibold text-white">{section.title}</h2>
                <p className="mt-2 text-sm text-white/60">{section.content}</p>
              </div>
            ))}
          </div>
          <Link
            to="/"
            className="mt-8 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 transition hover:text-white"
          >
            {t("landing.backHome")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StaticPage;

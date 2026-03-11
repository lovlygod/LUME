import LegalPageLayout from "@/pages/LegalPageLayout";

const CookiePolicy = () => (
  <LegalPageLayout
    titleKey="legal.cookies.title"
    descriptionKey="legal.cookies.description"
    sections={[
      { titleKey: "legal.cookies.types", bodyKey: "legal.cookies.typesBody" },
      { titleKey: "legal.cookies.analytics", bodyKey: "legal.cookies.analyticsBody" },
      { titleKey: "legal.cookies.preferences", bodyKey: "legal.cookies.preferencesBody" },
    ]}
  />
);

export default CookiePolicy;

import LegalPageLayout from "@/pages/LegalPageLayout";

const PrivacyPolicy = () => (
  <LegalPageLayout
    titleKey="legal.privacy.title"
    descriptionKey="legal.privacy.description"
    sections={[
      { titleKey: "legal.privacy.dataCollection", bodyKey: "legal.privacy.dataCollectionBody" },
      { titleKey: "legal.privacy.cookies", bodyKey: "legal.privacy.cookiesBody" },
      { titleKey: "legal.privacy.security", bodyKey: "legal.privacy.securityBody" },
    ]}
  />
);

export default PrivacyPolicy;

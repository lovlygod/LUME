import LegalPageLayout from "@/pages/LegalPageLayout";

const TermsOfService = () => (
  <LegalPageLayout
    titleKey="legal.terms.title"
    descriptionKey="legal.terms.description"
    sections={[
      { titleKey: "legal.terms.userResponsibilities", bodyKey: "legal.terms.userResponsibilitiesBody" },
      { titleKey: "legal.terms.prohibitedActivities", bodyKey: "legal.terms.prohibitedActivitiesBody" },
      { titleKey: "legal.terms.termination", bodyKey: "legal.terms.terminationBody" },
    ]}
  />
);

export default TermsOfService;

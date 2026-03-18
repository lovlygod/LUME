import { useNavigate, Link } from "react-router-dom";
import CookieSettingsButton from "@/components/ui/CookieSettingsButton";
import { Loader } from "@/components/ui/Loader";
import { ArrowRight, MessageCircle, Search, ShieldCheck, User, Radio } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const features = [
    {
      key: "feed",
      title: t("landing.features.feed.title"),
      description: t("landing.features.feed.description"),
      icon: Radio,
      route: "/feed",
      status: "active",
    },
    {
      key: "messages",
      title: t("landing.features.messages.title"),
      description: t("landing.features.messages.description"),
      icon: MessageCircle,
      route: "/messages",
      status: "active",
    },
    {
      key: "explore",
      title: t("landing.features.explore.title"),
      description: t("landing.features.explore.description"),
      icon: Search,
      route: "/explore",
      status: "active",
    },
    {
      key: "profile",
      title: t("landing.features.profile.title"),
      description: t("landing.features.profile.description"),
      icon: User,
      route: "/profile",
      status: "active",
    },
    {
      key: "verification",
      title: t("landing.features.verification.title"),
      description: t("landing.features.verification.description"),
      icon: ShieldCheck,
      route: "/verified",
      status: "active",
    },
  ];

  const links = [
    { label: t("landing.links.faq"), href: "/faq" },
    { label: t("landing.links.rules"), href: "/rules" },
    { label: t("landing.links.support"), href: "/support" },
    { label: t("landing.links.status"), href: "/status" },
    { label: t("landing.links.contacts"), href: "/contacts" },
  ];

  return (
    <div className="py-12 lg:py-16">
      <section className="rounded-[32px] border border-white/8 bg-white/5 backdrop-blur-[24px] px-6 py-12 md:px-12">
        <div className="max-w-[720px] space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
            <span>{t("landing.hero.pill")}</span>
          </div>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            <span className="inline-flex items-center gap-1">
              <Loader size={42} />
              <span>LUME</span>
            </span>
            <span className="text-white/80"> — место, где звучат ваши сигналы</span>
          </h1>
          <p className="text-base text-white/70 md:text-lg">
            {t("landing.hero.subtitle")}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/feed")}
              className="inline-flex items-center gap-2 rounded-full bg-white/90 px-6 py-3 text-sm font-semibold text-black transition hover:bg-white"
            >
              {t("landing.cta.openFeed")}
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {t("landing.cta.login")}
            </Link>
            <div className="flex items-center gap-4 text-xs text-white/60">
              <a className="hover:text-white" href="https://github.com/lovlygod/LUME" target="_blank" rel="noreferrer">
                {t("landing.cta.github")}
              </a>
              <a className="hover:text-white" href="https://github.com/lovlygod/LUME/tree/master/docs" target="_blank" rel="noreferrer">
                {t("landing.cta.docs")}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature) => {
          const isDisabled = feature.status !== "active";

          return (
            <button
              key={feature.key}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled) {
                  navigate(feature.route);
                }
              }}
              className={`text-left rounded-[28px] border border-white/8 px-6 py-6 backdrop-blur-[18px] transition-smooth ${
                isDisabled
                  ? "bg-white/3 text-white/30 cursor-not-allowed"
                  : "bg-white/4 hover:bg-white/6"
              }`}
            >
              <feature.icon className={`h-6 w-6 ${isDisabled ? "text-white/30" : "text-white/80"}`} />
              <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-white/60">{feature.description}</p>
              {isDisabled && (
                <span className="mt-4 inline-flex rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/50">
                  {t("landing.features.comingSoon")}
                </span>
              )}
            </button>
          );
        })}
      </section>

      <section className="mt-12 rounded-[28px] border border-white/8 bg-white/4 px-6 py-8 backdrop-blur-[18px]">
        <h2 className="text-lg font-semibold text-white">{t("landing.links.title")}</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {links.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 text-xs text-white/50">
        <span>{t("landing.footer.copyright")}</span>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/privacy-policy" className="hover:text-white" aria-label="Privacy Policy">
            Privacy Policy
          </Link>
          <Link to="/terms-of-service" className="hover:text-white" aria-label="Terms of Service">
            Terms of Service
          </Link>
          <Link to="/cookie-policy" className="hover:text-white" aria-label="Cookie Policy">
            Cookie Policy
          </Link>
          <CookieSettingsButton className="text-xs text-white/70 hover:text-white" />
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

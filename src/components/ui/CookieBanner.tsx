import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getCookieConsent, setCookieConsent } from "@/lib/cookieConsent";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getCookieConsent()) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    setCookieConsent("accepted");
    setVisible(false);
  };

  const handleDecline = () => {
    setCookieConsent("declined");
    setVisible(false);
  };

  return (
    <div
      className={`fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 transition-all duration-300 ease-out ${
        visible ? "pointer-events-auto opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-4"
      }`}
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
    >
      <div
        className="w-full max-w-[520px] rounded-2xl border border-white/5 bg-[rgba(20,20,20,0.7)] px-5 py-4 text-white shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-[12px]"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-white/80">
            We use cookies to improve your experience, provide authentication, and analyze usage of the platform.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDecline}
                aria-label="Decline cookies"
              >
                Decline
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAccept}
                aria-label="Accept cookies"
              >
                Accept
              </Button>
            </div>
            <Link
              to="/cookie-policy"
              className="text-xs font-semibold text-white/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 rounded-full"
              aria-label="Learn more about cookies"
            >
              Learn more
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;

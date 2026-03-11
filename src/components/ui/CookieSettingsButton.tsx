import { resetCookieConsent } from "@/lib/cookieConsent";
import { Button } from "@/components/ui/button";

interface CookieSettingsButtonProps {
  className?: string;
}

const CookieSettingsButton = ({ className }: CookieSettingsButtonProps) => {
  const handleClick = () => {
    resetCookieConsent();
    window.location.reload();
  };

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleClick}
      className={className}
      aria-label="Open cookie settings"
    >
      Cookie Settings
    </Button>
  );
};

export default CookieSettingsButton;

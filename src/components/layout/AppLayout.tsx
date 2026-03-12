import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { wsService } from "@/services/websocket";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import SnowEffect from "@/components/ui/SnowEffect";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, isAuthenticated, token } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { snowEffect, snowVariant } = useTheme();
  const hideRightSidebar = pathname.startsWith("/messages");
  const isPolicyPage =
    pathname === "/privacy-policy" ||
    pathname === "/terms-of-service" ||
    pathname === "/cookie-policy";

  // РџРѕРґРєР»СЋС‡РµРЅРёРµ Рє WebSocket РїСЂРё Р°СѓС‚РµРЅС‚РёС„РёРєР°С†РёРё
  useEffect(() => {
    if (isAuthenticated() && user && token) {
      // РџРѕРґРєР»СЋС‡Р°РµРјСЃСЏ Рє WebSocket
      wsService.connect(user.id);

      return () => {
        wsService.disconnect();
      };
    }
  }, [isAuthenticated, user, token]);

  useEffect(() => {
    const unsubscribe = wsService.on<{ logoutAll?: boolean }>("session_terminated", () => {
      wsService.terminateSession();
      navigate("/login");
    });
    return () => {
      unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {snowEffect ? <SnowEffect variant={snowVariant} /> : null}
      {/* РћСЃРЅРѕРІРЅРѕР№ РєРѕРЅС‚РµР№РЅРµСЂ */}
        <div
          className={
            hideRightSidebar || isPolicyPage
              ? "relative mx-auto w-full max-w-none px-6"
              : "relative mx-auto w-full max-w-[1560px] px-9 [&>div]:!grid [&>div]:grid-cols-[280px_minmax(720px,1fr)_340px] [&>div]:gap-[80px] [&>div]:items-stretch [&>div]:w-full [&>div>aside:first-child]:!w-[280px] [&>div>aside:last-child]:!w-[340px] [&>div>main]:w-full [&>div>main]:!max-w-none max-[1400px]:[&>div]:gap-[64px] max-[1400px]:[&>div]:grid-cols-[280px_minmax(680px,1fr)_320px] max-[1400px]:[&>div>aside:last-child]:!w-[320px] max-[1280px]:[&>div]:grid-cols-[280px_minmax(640px,1fr)] max-[1280px]:[&>div>aside:last-child]:!hidden max-[1023px]:[&>div]:grid-cols-1 max-[1023px]:[&>div>aside:first-child]:!hidden max-[1023px]:[&>div>aside:last-child]:!hidden max-[1023px]:[&>div>main]:!w-full max-[1023px]:[&>div>main]:!max-w-none"
          }
        >
        {children}
      </div>
    </div>
  );
};

export default AppLayout;

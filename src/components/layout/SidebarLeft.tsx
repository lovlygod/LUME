import { NavLink as RouterNavLink, useLocation, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Compass,
  MessageCircle,
  User,
  LogOut,
  Settings,
  ChevronUp,
  Users,
  Bell,
} from "lucide-react";
import { useAuth, isVerifiedUser, isDeveloper, isDeveloperCrown, VerifiedBadge, DeveloperBadge, DeveloperCrownBadge } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { normalizeImageUrl } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import LogoutModal from "@/components/ui/LogoutModal";
import NotificationsPanel from "@/components/NotificationsPanel";
import { Loader } from "@/components/ui/Loader";
import { wsService } from "@/services/websocket";
import { apiRequest } from "@/services/api";

const SidebarLeft = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { t } = useLanguage();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (location.pathname === "/feed") {
      // Если уже на главной, скроллим main элемент и обновляем ленту
      const mainElement = document.querySelector('main.overflow-y-auto');
      if (mainElement) {
        mainElement.scrollTo({ top: 0, behavior: "smooth" });
      }
      window.dispatchEvent(new CustomEvent("refreshHome"));
    } else {
      // Если не на главной, скроллим вверх и переходим
      const mainElement = document.querySelector('main.overflow-y-auto');
      if (mainElement) {
        mainElement.scrollTo({ top: 0, behavior: "smooth" });
      }
      navigate("/feed");
    }
  };

  const authNavItems = [
    { to: "/feed", icon: Home, label: t("home") },
    { to: "/messages", icon: MessageCircle, label: t("messages") },
    { to: "/explore", icon: Compass, label: t("explore") },
    { to: "/servers", icon: Users, label: t("servers.title") },
  ];

  const unauthNavItems = [
    { to: "/feed", icon: Home, label: t("home") },
    { to: "/explore", icon: Compass, label: t("explore") },
    { to: "/login", icon: User, label: t("login") },
    { to: "/register", icon: User, label: t("register") },
  ];

  const handleLogout = () => {
    setShowPopover(false);
    setShowLogoutModal(true);
  };

  const handleSettings = () => {
    setShowPopover(false);
    window.location.href = "/settings";
  };

  const handleProfile = () => {
    setShowPopover(false);
    navigate("/profile");
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowPopover(false);
      }
    };

    if (showPopover) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPopover]);

  // Fetch unread notifications count
  useEffect(() => {
    if (!isAuthenticated() || !user) return;

    const fetchUnreadCount = async () => {
      try {
        const data = await apiRequest<{ notifications: Array<{ id: string }> }>(
          '/notifications?unreadOnly=true&limit=100',
          {
            method: 'GET',
          }
        );
        setUnreadNotifications(data.notifications.length);
      } catch (error: unknown) {
        const statusCode = (error as { error?: { statusCode?: number } })?.error?.statusCode;
        if (statusCode === 401) {
          setUnreadNotifications(0);
          return;
        }
        console.error('Error fetching unread notifications:', error);
      }
    };

    fetchUnreadCount();

    // Listen for new notifications via WebSocket
    const handleNotification = () => {
      setUnreadNotifications(prev => prev + 1);
    };

    // Listen for notifications updated event
    const handleNotificationsUpdated = (event: CustomEvent) => {
      setUnreadNotifications(event.detail?.count || 0);
    };

    const unsubscribe = wsService.on('notification_new', handleNotification);
    window.addEventListener('notifications:updated', handleNotificationsUpdated as EventListener);
    
    // Re-fetch when panel is closed to sync count
    const handlePanelClose = () => {
      setTimeout(() => fetchUnreadCount(), 500);
    };
    window.addEventListener('notifications:closed', handlePanelClose as EventListener);
    
    return () => {
      unsubscribe();
      window.removeEventListener('notifications:updated', handleNotificationsUpdated as EventListener);
      window.removeEventListener('notifications:closed', handlePanelClose as EventListener);
    };
  }, [isAuthenticated, user]);

  const getNavigationItems = () => {
    const navItems = isAuthenticated() ? [...authNavItems] : unauthNavItems;
    return navItems;
  };

  return (
    <>
      <aside className="hidden h-screen w-[260px] shrink-0 flex-col gap-2 py-6 pr-6 lg:flex">
        {/* Logo */}
        <div className="mb-6 px-2">
          <Link to="/feed" className="inline-block">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Loader size={40} />
              </div>
              <div>
                <h1 className="font-semibold text-lg tracking-[0.3em] text-white">
                  LUME
                </h1>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1">
          {getNavigationItems().map((item) => {
            const isActive = location.pathname === item.to;
            const isHome = item.to === "/feed";

            if (isHome) {
              return (
                <a key={item.to} href={item.to} onClick={handleHomeClick}>
                  <motion.div
                    className={`relative flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-smooth ${
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-secondary hover:text-white"
                    }`}
                    whileHover={{ x: 2, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-white/60'}`} />
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-white/5"
                        layoutId="nav-active"
                        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                        style={{ zIndex: -1 }}
                      />
                    )}
                  </motion.div>
                </a>
              );
            }

            return (
              <RouterNavLink key={item.to} to={item.to}>
                <motion.div
                  className={`relative flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-smooth ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-secondary hover:text-white"
                  }`}
                  whileHover={{ x: 2, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-white/60'}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-white/5"
                      layoutId="nav-active"
                      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                      style={{ zIndex: -1 }}
                    />
                  )}
                </motion.div>
              </RouterNavLink>
            );
          })}
        </nav>

        {/* Notifications Button */}
        {isAuthenticated() && (
          <div className="relative w-full">
            <motion.button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-secondary hover:text-white transition-smooth w-full"
              whileHover={{ x: 2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <Bell className="h-5 w-5 text-white/60" />
              <span>{t('notifications.title') || 'Уведомления'}</span>
              {unreadNotifications > 0 && (
                <span className="absolute right-4 top-2 h-5 min-w-[1.25rem] px-1.5 flex items-center justify-center text-xs font-bold bg-red-500 text-white rounded-full">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </motion.button>

            <NotificationsPanel
              open={showNotifications}
              onOpenChange={setShowNotifications}
            />
          </div>
        )}

        {/* User info & Post Button */}
        <div className="space-y-3">
          {isAuthenticated() && user && (
            <div className="relative" ref={popoverRef}>
              <button
                onClick={() => setShowPopover(!showPopover)}
                className="w-full glass-panel px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {user.avatar ? (
                      <img
                        src={normalizeImageUrl(user.avatar) || ''}
                        alt={user.name}
                        className="h-9 w-9 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '';
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : null}
                    {!user.avatar && (
                      <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white">
                        {user.name.charAt(0)}
                      </div>
                    )}
                    {isVerifiedUser(user) && (
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <VerifiedBadge className="h-3.5 w-3.5" />
                      </div>
                    )}
                    {isDeveloperCrown(user.username)
                      ? (
                        <div className="absolute -bottom-0.5 -right-0.5">
                          <DeveloperCrownBadge className="h-3.5 w-3.5" />
                        </div>
                      )
                      : isDeveloper(user.username) && (
                        <div className="absolute -bottom-0.5 -right-0.5">
                          <DeveloperBadge className="h-3.5 w-3.5" />
                        </div>
                      )
                    }
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-secondary font-mono truncate">
                      @{user.username}
                    </p>
                  </div>
                  <ChevronUp className={`h-4 w-4 text-white/50 transition-transform ${showPopover ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Popover Menu */}
              <AnimatePresence>
                {showPopover && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute bottom-full left-0 right-0 mb-2 glass-panel rounded-2xl overflow-hidden z-50"
                  >
                    <div className="p-2">
                      <button
                        onClick={handleProfile}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium text-white hover:bg-white/5 transition-smooth"
                      >
                        <User className="h-4 w-4" />
                        <span>{t("profile")}</span>
                      </button>
                      <button
                        onClick={handleSettings}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium text-white hover:bg-white/5 transition-smooth"
                      >
                        <Settings className="h-4 w-4" />
                        <span>{t("settings")}</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium text-red-200 hover:bg-white/5 transition-smooth"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{t("logout")}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Logout Modal */}
        <LogoutModal open={showLogoutModal} onOpenChange={setShowLogoutModal} />
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe pt-2">
        <div className="flex items-center justify-between gap-2 rounded-[26px] border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          {getNavigationItems().map((item) => {
            const isActive = location.pathname === item.to;
            const isHome = item.to === "/feed";
            const buttonClasses = `relative flex h-11 w-11 items-center justify-center rounded-full transition-smooth ${
              isActive ? "bg-white/12 text-white" : "text-white/60 hover:text-white"
            }`;

            if (isHome) {
              return (
                <a key={item.to} href={item.to} onClick={handleHomeClick} className={buttonClasses}>
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </a>
              );
            }

            return (
              <RouterNavLink key={item.to} to={item.to} className={buttonClasses}>
                <item.icon className="h-5 w-5" />
                <span className="sr-only">{item.label}</span>
              </RouterNavLink>
            );
          })}
          {isAuthenticated() && (
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex h-11 w-11 items-center justify-center rounded-full text-white/60 transition-smooth hover:text-white"
            >
              <Bell className="h-5 w-5" />
              <span className="sr-only">{t('notifications.title') || 'Уведомления'}</span>
              {unreadNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </button>
          )}
        </div>

        <NotificationsPanel
          open={showNotifications}
          onOpenChange={setShowNotifications}
        />
      </div>
    </>
  );
};

export default SidebarLeft;

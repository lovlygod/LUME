import { NavLink as RouterNavLink, useLocation, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Compass,
  MessageCircle,
  Briefcase,
  FolderKanban,
  Wallet,
  User,
  LogOut,
  Settings,
  ChevronUp,
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
import { apiRequest, messagesAPI } from "@/services/api";
import ProtectedLogo from "@/components/ui/ProtectedLogo";

const SidebarLeft = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { t } = useLanguage();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (location.pathname === "/home" || location.pathname === "/feed") {
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
      navigate("/home");
    }
  };

  const authNavItems = [
    { to: "/home", icon: Home, label: t("navigation.home") },
    { to: "/wallet", icon: Wallet, label: t("navigation.wallet") || "Wallet" },
    { to: "/workspaces", icon: Briefcase, label: t("navigation.workspaces") },
    { to: "/projects", icon: FolderKanban, label: t("navigation.projects") },
    { to: "/messages", icon: MessageCircle, label: t("navigation.messages") },
    { to: "/explore", icon: Compass, label: t("navigation.explore") },
    { to: "/profile", icon: User, label: t("navigation.profile") },
  ];

  const unauthNavItems = [
    { to: "/home", icon: Home, label: t("navigation.home") },
    { to: "/explore", icon: Compass, label: t("navigation.explore") },
    { to: "/login", icon: User, label: t("navigation.login") },
    { to: "/register", icon: User, label: t("navigation.register") },
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

  // Fetch unread messages count + lightweight realtime updates
  useEffect(() => {
    if (!isAuthenticated() || !user?.id) {
      setUnreadMessages(0);
      return;
    }

    let mounted = true;

    const refreshUnreadMessages = async () => {
      try {
        const data = await messagesAPI.getChats();
        if (!mounted) return;

        const chats = data.chats || [];
        const totalUnread = chats.reduce((sum, chat) => sum + (chat.unread || 0), 0);
        setUnreadMessages(totalUnread);
      } catch (error: unknown) {
        const statusCode = (error as { error?: { statusCode?: number } })?.error?.statusCode;
        if (statusCode === 401) {
          setUnreadMessages(0);
          return;
        }
        console.error('Error fetching unread messages:', error);
      }
    };

    refreshUnreadMessages();

    const unsubNewMessage = wsService.on('new_message', (payload: { senderId?: string | number }) => {
      if (String(payload?.senderId ?? '') === String(user.id)) return;
      void refreshUnreadMessages();
    });

    const unsubReadUpdate = wsService.on('chat:read_update', () => {
      void refreshUnreadMessages();
    });

    const handleFocusRefresh = () => {
      void refreshUnreadMessages();
    };
    window.addEventListener('focus', handleFocusRefresh);

    return () => {
      mounted = false;
      unsubNewMessage();
      unsubReadUpdate();
      window.removeEventListener('focus', handleFocusRefresh);
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
          <Link to="/home" className="inline-block">
            <div className="flex items-center gap-2">
              <ProtectedLogo className="h-10 w-10 rounded-xl" />
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
            const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
            const isHome = item.to === "/home";
            const isMessages = item.to === "/messages";
            const hasUnreadMessages = unreadMessages > 0;

            if (isHome) {
              return (
                <a key={item.to} href={item.to} onClick={handleHomeClick}>
                  <motion.div
                    className={`relative flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-smooth ${
                      isActive
                        ? "bg-white/10 text-white"
                        : isMessages && hasUnreadMessages
                          ? "text-violet-300 hover:text-violet-200"
                          : "text-secondary hover:text-white"
                    }`}
                    whileHover={{ x: 2, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : isMessages && hasUnreadMessages ? 'text-violet-300' : 'text-white/60'}`} />
                    <span>{item.label}</span>
                    {isMessages && hasUnreadMessages && (
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 h-5 flex items-center justify-center text-xs font-bold bg-violet-500 text-white rounded-full ${unreadMessages > 9 ? 'min-w-[1.25rem] px-1' : 'w-5 px-0'}`}>
                        {unreadMessages > 99 ? '99+' : unreadMessages}
                      </span>
                    )}
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
                      : isMessages && hasUnreadMessages
                        ? "text-violet-300 hover:text-violet-200"
                        : "text-secondary hover:text-white"
                  }`}
                  whileHover={{ x: 2, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : isMessages && hasUnreadMessages ? 'text-violet-300' : 'text-white/60'}`} />
                  <span>{item.label}</span>
                  {isMessages && hasUnreadMessages && (
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 h-5 flex items-center justify-center text-xs font-bold bg-violet-500 text-white rounded-full ${unreadMessages > 9 ? 'min-w-[1.25rem] px-1' : 'w-5 px-0'}`}>
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </span>
                  )}
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
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 h-5 flex items-center justify-center text-xs font-bold bg-red-500 text-white rounded-full ${unreadNotifications > 9 ? 'min-w-[1.25rem] px-1' : 'w-5 px-0'}`}>
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
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-[calc(0.5rem+var(--mobile-safe-bottom))] pt-2">
        <div className="mx-auto flex max-w-[430px] items-center justify-between gap-1.5 rounded-2xl border border-white/10 bg-black/70 px-2.5 py-2 shadow-[0_10px_34px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
          {getNavigationItems().map((item) => {
            const isActive = location.pathname === item.to;
            const isHome = item.to === "/home";
            const isMessages = item.to === "/messages";
            const buttonClasses = `relative flex h-10 w-10 items-center justify-center rounded-xl transition-smooth ${
              isActive
                ? "bg-white/12 text-white"
                : isMessages && unreadMessages > 0
                  ? "text-violet-300 hover:text-violet-200"
                  : "text-white/60 hover:text-white"
            }`;

            if (isHome) {
              return (
                <a key={item.to} href={item.to} onClick={handleHomeClick} className={buttonClasses}>
                  <item.icon className="h-[18px] w-[18px]" />
                  <span className="sr-only">{item.label}</span>
                </a>
              );
            }

            return (
              <RouterNavLink key={item.to} to={item.to} className={buttonClasses}>
                <item.icon className="h-[18px] w-[18px]" />
                {isMessages && unreadMessages > 0 && (
                  <span className={`absolute -top-0.5 -right-0.5 h-4 flex items-center justify-center text-[10px] font-bold bg-violet-500 text-white rounded-full leading-none ${unreadMessages > 9 ? 'min-w-4 px-0.5' : 'w-4 px-0'}`}>
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
                <span className="sr-only">{item.label}</span>
              </RouterNavLink>
            );
          })}
          {isAuthenticated() && (
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-white/60 transition-smooth hover:text-white"
            >
              <Bell className="h-[18px] w-[18px]" />
              <span className="sr-only">{t('notifications.title') || 'Уведомления'}</span>
              {unreadNotifications > 0 && (
                <span className={`absolute -top-0.5 -right-0.5 h-4 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full leading-none ${unreadNotifications > 9 ? 'min-w-4 px-0.5' : 'w-4 px-0'}`}>
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

import { NavLink } from "react-router-dom";
import { History, Search, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const WalletSectionNav = () => {
  const { t } = useLanguage();

  const items = [
    { to: "/wallet", label: t("economy.tabs.wallet") || "Wallet", icon: Wallet, end: true },
    { to: "/wallet/market", label: t("economy.tabs.market") || "Username Market", icon: Search },
    { to: "/wallet/history", label: t("economy.tabs.history") || "History", icon: History },
  ];

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-1.5">
      <div className="grid w-full grid-cols-3 gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={Boolean(item.end)}
            className="group relative inline-flex min-w-0 items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-xs text-white/75 transition-colors hover:text-white sm:gap-2 sm:px-3 sm:text-sm"
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="wallet-nav-active-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-xl bg-white/20 shadow-[0_0_0_1px_rgba(255,255,255,0.22)]"
                  />
                )}
                <Icon className={`relative z-10 h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-white/70 group-hover:text-white"}`} />
                <span className={`relative z-10 min-w-0 text-center leading-tight break-words ${isActive ? "text-white" : "text-white/80 group-hover:text-white"}`}>{item.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
      </div>
    </div>
  );
};

export default WalletSectionNav;


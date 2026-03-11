import { useState } from 'react';
import { Shield, Bug, Send, Scale } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation, Link } from 'react-router-dom';
import AdminPanelModal from '@/components/AdminPanelModal';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const SidebarRight = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const isAdmin = user?.username === 'zxclovly';

  return (
    <aside className="hidden h-screen w-[340px] shrink-0 flex-col gap-4 overflow-x-visible overflow-y-auto py-6 pl-6 pr-6 xl:flex">
      {/* Admin Button - only for zxclovly */}
      {isAdmin && (
        <div className="flex justify-end mb-2">
          <motion.button
            onClick={() => setShowAdminPanel(true)}
            className="btn-glass"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Shield className="h-4 w-4" />
            <span>{t("admin.title")}</span>
          </motion.button>
        </div>
      )}


      {/* Admin Panel Modal */}
      <AdminPanelModal isOpen={showAdminPanel} onClose={() => setShowAdminPanel(false)} />

      {/* Bug Report Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="card-glass p-4"
      >
        <div className="flex items-center gap-1.5 mb-2">
          <Bug className="h-3.5 w-3.5 text-white/60" />
          <h3 className="font-semibold text-xs tracking-wide text-white">
            Нашли баг?
          </h3>
        </div>
        <p className="text-[11px] text-secondary mb-2.5">
          Если вы обнаружили ошибку или у вас есть предложение по улучшению, напишите нам в Telegram
        </p>
        <a
          href="https://t.me/sachevgod"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full rounded-full py-2 text-xs font-semibold bg-white/5 text-white hover:bg-white/10 transition-smooth"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Написать в Telegram</span>
        </a>
      </motion.div>

      <div className="flex-1" />

      {/* Legal Links */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="px-1"
      >
        <div className="flex items-center gap-1.5 mb-3">
          <Scale className="h-3.5 w-3.5 text-white/60" />
          <h3 className="font-semibold text-xs tracking-wide text-white">Legal</h3>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <Link to="/privacy-policy" className="text-secondary hover:text-white transition-smooth">
            {t("legal.links.privacy")}
          </Link>
          <Link to="/terms-of-service" className="text-secondary hover:text-white transition-smooth">
            {t("legal.links.terms")}
          </Link>
          <Link to="/cookie-policy" className="text-secondary hover:text-white transition-smooth">
            {t("legal.links.cookies")}
          </Link>
        </div>
      </motion.div>
    </aside>
  );
};

export default SidebarRight;

import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface HelpShellProps {
  title: string;
  subtitle: string;
  meta?: string;
  children: ReactNode;
}

const HelpShell = ({ title, subtitle, meta, children }: HelpShellProps) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-white">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-10 md:py-14">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-8 backdrop-blur-xl"
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/35 to-transparent" />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                {t("help.label")}
              </div>
              <h1 className="mt-2 text-4xl font-semibold md:text-[44px]">{title}</h1>
              <p className="mt-2 text-sm text-white/65 md:text-base">{subtitle}</p>
              <Link
                to="/"
                className="mt-5 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 transition hover:text-white"
              >
                {t("landing.backHome")}
              </Link>
            </div>
            {meta && (
              <div className="rounded-full border border-white/12 bg-white/6 px-3 py-1.5 text-xs text-white/70">
                {meta}
              </div>
            )}
          </div>
        </motion.div>

        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
};

export default HelpShell;

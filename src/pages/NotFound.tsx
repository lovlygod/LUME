import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <h1 className="font-orbitron mb-2 text-6xl font-bold tracking-wider text-foreground">
          {t("notFound.title")}
        </h1>
        <p className="mb-8 text-lg text-foreground">{t("notFound.subtitle")}</p>
        <Link
          to="/feed"
          className="inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
        >
          {t("notFound.returnHome")}
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { profileAPI } from "@/services/api";
import { toast } from "sonner";

const DangerPage = () => {
  const { t } = useLanguage();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (deletePassword.length < 6) {
      toast.error(t("settings.deleteAccountPasswordTooShort"));
      return;
    }

    if (deleteConfirm !== "DELETE") {
      toast.error(t("settings.deleteAccountConfirmMismatch"));
      return;
    }

    setIsDeleting(true);
    try {
      await profileAPI.deleteAccount(deletePassword);

      localStorage.clear();
      logout();

      toast.success(t("settings.deleteAccountSuccess"));

      setTimeout(() => {
        navigate("/");
        window.location.reload();
      }, 2000);
    } catch (error: unknown) {
      console.error("Failed to delete account:", error);
      const err = error as { message?: string } | null;
      toast.error(err?.message || t("settings.deleteAccountError"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="px-6 py-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t("settings.dangerZone")}</h1>
          <p className="text-sm text-secondary mt-1">{t("settings.sections.danger.description")}</p>
        </div>
        <button
          onClick={() => navigate("/settings")}
          className="px-4 py-2 rounded-full text-xs font-medium bg-white/5 text-secondary hover:text-white transition"
        >
          {t("settings.backToSettings")}
        </button>
      </div>

      <div className="p-6 space-y-6">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-white">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-lg font-semibold">{t("settings.dangerZone")}</h2>
          </div>

          <div className="card-glass p-5 space-y-4 rounded-[24px]">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">{t("settings.deleteAccountTitle")}</p>
                <p className="text-xs text-secondary mt-1">
                  {t("settings.deleteAccountDescription")}
                </p>
              </div>
            </div>

            <motion.button
              onClick={() => setShowDeleteModal(true)}
              className="w-full rounded-full py-3 text-sm font-semibold text-red-200 border border-red-200/20 hover:bg-white/5 transition-smooth flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Trash2 className="h-4 w-4" />
              <span>{t("settings.deleteAccount")}</span>
            </motion.button>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(event) => event.stopPropagation()}
              className="glass-panel p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-200" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{t("settings.deleteAccount")}</h3>
                  <p className="text-xs text-secondary">{t("settings.deleteAccountModalSubtitle")}</p>
                </div>
              </div>

              <div className="border border-white/10 rounded-2xl p-4 mb-4 space-y-2">
                <p className="text-sm font-semibold text-red-200 mb-2">{t("settings.deleteAccountWarnings")}</p>
                <ul className="text-xs text-secondary space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-red-200">•</span>
                    <span>{t("settings.deleteAccountWarning1")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-200">•</span>
                    <span>{t("settings.deleteAccountWarning2")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-200">•</span>
                    <span>{t("settings.deleteAccountWarning3")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-200">•</span>
                    <span>{t("settings.deleteAccountWarning4")}</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    {t("settings.deleteAccountPasswordLabel")}
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(event) => setDeletePassword(event.target.value)}
                    placeholder={t("settings.deleteAccountPasswordPlaceholder")}
                    className="glass-input w-full px-4 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    {t("settings.deleteAccountConfirmLabel")}
                  </label>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(event) => setDeleteConfirm(event.target.value)}
                    placeholder={t("settings.deleteAccountConfirmPlaceholder")}
                    className="glass-input w-full px-4 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 rounded-full py-3 text-sm font-medium bg-white/5 text-white hover:bg-white/10 transition-smooth disabled:opacity-50"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || !deletePassword || !deleteConfirm}
                  className="flex-1 rounded-full py-3 text-sm font-semibold text-red-200 border border-red-200/20 hover:bg-white/5 transition-smooth disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>{t("settings.deleting")}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>{t("settings.deleteAccount")}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DangerPage;

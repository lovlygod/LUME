import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { isVerifiedUser, VerifiedBadge } from "@/contexts/AuthContext";
import { normalizeImageUrl } from "@/lib/utils";
import type { User } from "@/types/api";

interface FollowModalProps {
  open: boolean;
  tab: "followers" | "following";
  onTabChange: (tab: "followers" | "following") => void;
  followers: User[];
  following: User[];
  onClose: () => void;
}

const FollowModal = ({ open, tab, onTabChange, followers, following, onClose }: FollowModalProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const list = tab === "followers" ? followers : following;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div className="w-full max-w-md glass-panel rounded-3xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="font-semibold text-white">
                {tab === "followers" ? t("profile.followers") : t("profile.following")}
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/10 transition-smooth"
              >
                <X className="h-4 w-4 text-white/70" />
              </button>
              </div>

              <div className="flex border-b border-white/10">
              <button
                onClick={() => onTabChange("followers")}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-smooth ${
                  tab === "followers" ? "text-white bg-white/8" : "text-secondary hover:text-white"
                }`}
              >
                {t("profile.followers")}
              </button>
              <button
                onClick={() => onTabChange("following")}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-smooth ${
                  tab === "following" ? "text-white bg-white/8" : "text-secondary hover:text-white"
                }`}
              >
                {t("profile.following")}
              </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
              {list.length > 0 ? (
                list.map((user) => (
                  <button
                    key={user.id}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-smooth border-b border-white/10 last:border-0 text-left"
                    onClick={() => {
                      onClose();
                      navigate(`/profile/${user.id}`);
                    }}
                  >
                    <div className="flex-shrink-0">
                      {user.avatar ? (
                        <img
                          src={normalizeImageUrl(user.avatar) || ""}
                          alt={user.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold text-white">
                          {user.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                        {isVerifiedUser(user) && (
                          <VerifiedBadge className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <p className="text-xs text-secondary font-mono">@{user.username}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-secondary">
                  {tab === "followers" ? t("profile.noFollowers") : t("profile.noFollowing")}
                </div>
              )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FollowModal;

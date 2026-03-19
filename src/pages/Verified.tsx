import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { profileAPI, verificationAPI, onboardingAPI, searchAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { BadgeCheck, Search, ShieldCheck, Sparkles, ClipboardList, XCircle } from 'lucide-react';
import verificationComparison from '@/assets/verification/verification-comparison.png';
import { useNavigate } from 'react-router-dom';
import type { User } from '@/types/api';
import { normalizeImageUrl } from '@/lib/utils';
import Lottie from 'lottie-react';
import pendingHourglass from '@/assets/lottie/Hourglass.json';

const Verified = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  type VerifiedUser = { id: string; username: string; verified: boolean };
  type VerificationStatus = {
    status?: 'pending' | 'approved' | 'rejected' | string;
    createdAt?: string;
    reviewNotes?: string;
  };
  const [user, setUser] = useState<VerifiedUser | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verifiedUsers, setVerifiedUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    platform: '',
    reason: '',
    videoUrl: ''
  });
  const [platformOpen, setPlatformOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement | null>(null);
  const verifiedShowcase = useMemo(() => {
    const items = [...verifiedUsers];
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items.slice(0, 4);
  }, [verifiedUsers]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userResponse = await profileAPI.getCurrentUser();
        setUser(userResponse.user);

        const statusResponse = await verificationAPI.getVerificationStatus(userResponse.user.id);
        const rawStatus = statusResponse.verificationStatus as (VerificationStatus & {
          created_at?: string;
          review_notes?: string;
        }) | null;
        if (rawStatus) {
          setVerificationStatus({
            ...rawStatus,
            createdAt: rawStatus.createdAt || rawStatus.created_at,
            reviewNotes: rawStatus.reviewNotes || rawStatus.review_notes,
          });
        } else {
          setVerificationStatus(null);
        }

        try {
          const suggestions = await onboardingAPI.getSuggestions();
          const onlyVerified = (suggestions.users || []).filter((item) => item.verified);
          if (onlyVerified.length >= 3) {
            setVerifiedUsers(onlyVerified);
            return;
          }

          try {
            const publicUsers = await searchAPI.searchUsers('');
            const verifiedFromPublic = (publicUsers.users || []).filter((item) => item.verified);
            if (verifiedFromPublic.length) {
              setVerifiedUsers(verifiedFromPublic);
              return;
            }
          } catch (searchError) {
            console.error('Failed to load public users:', searchError);
          }

          const allUsers = await verificationAPI.getAllUsers();
          const verifiedFromAll = (allUsers.users || []).filter((item) => item.verified);
          setVerifiedUsers(verifiedFromAll);
        } catch (error) {
          console.error('Failed to load verified users:', error);
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
        toast({
          title: t("common.error"),
          description: t("toast.loadVerificationError"),
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [toast]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await verificationAPI.submitVerificationRequest({
        ...formData,
        tiktokVideoUrl: formData.videoUrl
      });
      toast({
        title: t("common.success"),
        description: t("verified.submitToast")
      });

      const statusResponse = await verificationAPI.getVerificationStatus(user.id);
      const rawStatus = statusResponse.verificationStatus as (VerificationStatus & {
        created_at?: string;
        review_notes?: string;
      }) | null;
      if (rawStatus) {
        setVerificationStatus({
          ...rawStatus,
          createdAt: rawStatus.createdAt || rawStatus.created_at,
          reviewNotes: rawStatus.reviewNotes || rawStatus.review_notes,
        });
      } else {
        setVerificationStatus(null);
      }

      setFormData({ platform: '', reason: '', videoUrl: '' });
      statusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error: unknown) {
      const apiMessage = (error as { error?: { message?: string } })?.error?.message;
      const isMinDaysError = apiMessage?.includes('5') && apiMessage?.includes('дн');
      toast({
        title: t("common.error"),
        description: isMinDaysError ? t("verified.minDaysError", { days: 5 }) : (error instanceof Error ? error.message : t("verified.submitError")),
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const statusType = user?.verified
    ? 'verified'
    : verificationStatus?.status === 'approved'
      ? 'verified'
      : verificationStatus?.status;
  const isPending = statusType === 'pending';
  const statusStyle = statusType === 'verified'
    ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100'
    : statusType === 'rejected'
      ? 'border-rose-400/20 bg-rose-500/10 text-rose-100'
      : 'border-amber-300/20 bg-amber-500/10 text-amber-100';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-3"
        >
          <h1 className="text-3xl md:text-5xl font-semibold text-white">{t("verified.pageTitle")}</h1>
          <p className="text-white/70">{t("verified.pageSubtitle")}</p>
        </motion.div>

        <div className="grid gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="md:col-span-2 rounded-[24px] border border-white/10 bg-white/6 p-6 space-y-4 shadow-[0_18px_40px_rgba(0,0,0,0.25)]"
          >
            <div className="flex items-center gap-2 text-white">
              <BadgeCheck className="h-5 w-5 text-cyan-300" />
              <h2 className="text-lg font-semibold">{t("verified.comparisonTitle")}</h2>
            </div>
            <div
              className="relative select-none"
              onContextMenu={(e) => e.preventDefault()}
            >
              <img
                src={verificationComparison}
                alt={t("verified.comparisonAlt")}
                className="w-full rounded-2xl pointer-events-none"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
          </motion.div>

        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-[24px] border border-white/10 bg-white/6 p-6 shadow-[0_16px_36px_rgba(0,0,0,0.22)]"
          >
            <div className="flex items-center gap-2 text-white mb-3">
              <Sparkles className="h-5 w-5 text-indigo-300" />
              <h2 className="text-xl font-semibold">{t("verified.benefitsTitle")}</h2>
            </div>
            <div className="grid gap-4">
              <ul className="space-y-2 text-white/80">
                <li className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-cyan-300" />{t("verified.benefitBadge")}</li>
                <li className="flex items-center gap-2"><Search className="h-4 w-4 text-indigo-300" />{t("verified.benefitSearch")}</li>
                <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-indigo-300" />{t("verified.benefitTrust")}</li>
                <li className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-300" />{t("verified.benefitFeatures")}</li>
              </ul>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="rounded-[24px] border border-white/10 bg-white/6 p-6 shadow-[0_16px_36px_rgba(0,0,0,0.22)]"
          >
            <div className="flex items-center gap-2 text-white mb-3">
              <ClipboardList className="h-5 w-5 text-indigo-300" />
              <h2 className="text-xl font-semibold">{t("verified.stepsTitle")}</h2>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-white/80">
              <li>{t("verified.stepOne")}</li>
              <li>{t("verified.stepTwo")}</li>
              <li>{t("verified.stepThree")}</li>
              <li>{t("verified.stepFour")}</li>
            </ol>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18 }}
          className="rounded-[24px] border border-white/10 bg-white/6 p-6 shadow-[0_18px_40px_rgba(0,0,0,0.25)]"
        >
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 text-white">
              <BadgeCheck className="h-5 w-5 text-cyan-300" />
              <h2 className="text-lg font-semibold">{t("verified.verifiedUsersTitle")}</h2>
            </div>
            <span className="text-xs text-white/50">{t("verified.verifiedUsersHint")}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {verifiedShowcase.length === 0 ? (
              <div className="text-sm text-white/60">{t("verified.verifiedUsersEmpty")}</div>
            ) : (
              verifiedShowcase.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(`/profile/${item.id}`)}
                  className="w-full text-left flex items-center gap-3 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 transition-smooth px-3 py-2"
                >
                  <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center text-xs text-white/70">
                    {item.avatar ? (
                      <img
                        src={normalizeImageUrl(item.avatar)}
                        alt={item.name || item.username || 'verified user'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (item.name || item.username || '?').slice(0, 1)
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-white font-medium flex items-center gap-2">
                      {item.name || item.username}
                      <BadgeCheck className="h-4 w-4 text-cyan-300" />
                    </div>
                    <div className="text-xs text-white/60">@{item.username}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </motion.div>

        {statusType && (
          <motion.div
            ref={statusRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className={`rounded-[18px] border px-4 py-3 text-white shadow-[0_10px_22px_rgba(0,0,0,0.22)] ${statusStyle}`}
          >
            <div className="flex items-center gap-1">
              {statusType === 'pending' && (
                <Lottie
                  animationData={pendingHourglass}
                  loop
                  className="h-12 w-12 opacity-90"
                  style={{ filter: 'hue-rotate(140deg) saturate(0.2) brightness(1.1)' }}
                />
              )}
              {statusType === 'rejected' && <XCircle className="h-5 w-5 text-rose-300" />}
              {statusType === 'verified' && <BadgeCheck className="h-5 w-5 text-cyan-300" />}
              <span className="font-medium">
                {statusType === 'pending' && t("verified.statusPending")}
                {statusType === 'rejected' && t("verified.statusRejected")}
                {statusType === 'verified' && t("verified.statusVerified")}
              </span>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <form onSubmit={handleSubmit} id="verification-form" className="rounded-[24px] border border-white/10 bg-white/6 p-6 space-y-4 shadow-[0_16px_36px_rgba(0,0,0,0.22)]">
            <div>
              <label htmlFor="platform" className="block text-sm font-medium text-white mb-2">
                {t("verified.platformLabelShort")}
              </label>
              <div className="relative">
                <button
                  id="platform"
                  type="button"
                  onClick={() => setPlatformOpen((prev) => !prev)}
                  className="w-full px-4 py-3 rounded-[18px] border border-white/10 bg-black/60 text-left text-white focus:outline-none focus:ring-1 focus:ring-sky-300/40"
                >
                  <span className={formData.platform ? "text-white" : "text-white/50"}>
                    {formData.platform === 'tiktok'
                      ? t("verified.platformTikTok")
                      : formData.platform === 'instagram'
                        ? t("verified.platformInstagram")
                        : formData.platform === 'youtube'
                          ? t("verified.platformYoutube")
                          : t("verified.platformSelect")}
                  </span>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/60">▾</span>
                </button>
                {platformOpen && (
                  <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[18px] border border-white/10 bg-black/90 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
                    {[
                      { id: 'tiktok', label: t("verified.platformTikTok") },
                      { id: 'instagram', label: t("verified.platformInstagram") },
                      { id: 'youtube', label: t("verified.platformYoutube") },
                    ].map((platform) => (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, platform: platform.id });
                          setPlatformOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm text-white transition-smooth hover:bg-white/5 ${
                          formData.platform === platform.id ? "bg-white/10" : ""
                        }`}
                      >
                        {platform.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="videoUrl" className="block text-sm font-medium text-white mb-2">
                {t("verified.videoUrlLabel")}
              </label>
              <input
                type="url"
                id="videoUrl"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder={t("verified.videoUrlPlaceholder")}
                className="w-full px-4 py-3 rounded-[18px] border border-white/10 bg-black/40 text-white placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-sky-300/40"
                required
              />
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-white mb-2">
                {t("verified.reasonLabelShort")}
              </label>
              <textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder={t("verified.reasonPlaceholderShort")}
                className="w-full px-4 py-3 rounded-[18px] border border-white/10 bg-black/40 text-white placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-sky-300/40 min-h-[110px] resize-none"
                required
                maxLength={500}
              />
              <p className="text-xs text-secondary mt-1.5">{formData.reason.length}/500</p>
            </div>

            <motion.button
              type="submit"
              disabled={submitting || isPending || !formData.platform || !formData.reason || !formData.videoUrl}
              className="w-full py-3 rounded-full bg-gradient-to-r from-sky-500/80 via-blue-500/80 to-indigo-500/80 text-white font-medium shadow-[0_12px_30px_rgba(59,130,246,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={!submitting && !isPending && formData.platform && formData.reason && formData.videoUrl ? { scale: 1.02 } : {}}
              whileTap={!submitting && !isPending && formData.platform && formData.reason && formData.videoUrl ? { scale: 0.98 } : {}}
            >
              {submitting ? t("verified.submitting") : t("verified.submitButton")}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Verified;

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { profileAPI, verificationAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import verificationBanner from '@/public/baner-verified.png';

const Verified = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
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
  const [formData, setFormData] = useState({
    platform: '',
    reason: '',
    videoUrl: ''
  });
  const [platformOpen, setPlatformOpen] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userResponse = await profileAPI.getCurrentUser();
        setUser(userResponse.user);

        const statusResponse = await verificationAPI.getVerificationStatus(userResponse.user.id);
        setVerificationStatus(statusResponse.verificationStatus);
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
        description: t("verified.submitSuccess")
      });

      const statusResponse = await verificationAPI.getVerificationStatus(user.id);
      setVerificationStatus(statusResponse.verificationStatus);

      setFormData({ platform: '', reason: '', videoUrl: '' });
    } catch (error: unknown) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("verified.submitError"),
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const platforms = [
    {
      id: 'tiktok',
      name: t("verified.platformTikTok"),
      description: t("verified.platformTikTokDesc"),
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      ),
      color: 'from-pink-500 to-cyan-500'
    },
    {
      id: 'instagram',
      name: t("verified.platformInstagram"),
      description: t("verified.platformInstagramDesc"),
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
        </svg>
      ),
      color: 'from-purple-500 to-orange-500'
    },
    {
      id: 'youtube',
      name: t("verified.platformYoutube"),
      description: t("verified.platformYoutubeDesc"),
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
      color: 'from-red-600 to-red-500'
    }
  ];

  const getPlaceholder = () => {
    switch (formData.platform) {
      case 'tiktok':
        return t("verified.tiktokPlaceholder");
      case 'instagram':
        return t("verified.instagramPlaceholder");
      case 'youtube':
        return t("verified.youtubePlaceholder");
      default:
        return t("verified.videoUrlLabel");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Баннер */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative select-none pointer-events-auto"
          onContextMenu={(e) => e.preventDefault()}
        >
          <img
            src={verificationBanner}
            alt={t("verified.bannerAlt")}
            className="w-full h-auto rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.35)] pointer-events-none"
            style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
          />
          <div className="absolute inset-0 rounded-2xl bg-white/5 blur-xl -z-10 pointer-events-none" />
        </motion.div>

        {/* Статус верификации */}
        {user?.verified ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/8 border border-white/10 rounded-[24px] p-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">{t("verified.verificationStatus")}</h3>
                <p className="text-white/80 text-sm">
                  {user.username === '@CEO'
                    ? t("verified.verifiedAsCEO")
                    : t("verified.verifiedAsUser")}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {verificationStatus?.status === 'pending' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/6 border border-white/10 rounded-[24px] p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">{t("verified.requestPending")}</p>
                    <p className="text-white/60 text-sm mt-1">
                      {t("verified.submittedOn")}: {new Date(verificationStatus.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {verificationStatus?.status === 'rejected' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/6 border border-white/10 rounded-[24px] p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-red-200 font-medium">{t("verified.requestRejected")}</p>
                    <p className="text-red-200/80 text-sm mt-1">
                      {t("verified.rejectionReason")}: {verificationStatus.reviewNotes || t("verified.noReason")}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {(!verificationStatus || verificationStatus.status !== 'pending') && (
              <>
                {/* Как получить верификацию */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-[24px]"
                >
                  <h2 className="text-xl font-semibold text-white mb-4">{t("verified.howToGet")}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { step: '1', title: t("verified.step1"), desc: t("verified.step1Desc") },
                      { step: '2', title: t("verified.step2"), desc: t("verified.step2Desc") },
                      { step: '3', title: t("verified.step3"), desc: t("verified.step3Desc") },
                      { step: '4', title: t("verified.step4"), desc: t("verified.step4Desc") },
                    ].map((item, index) => (
                      <motion.div
                        key={item.step}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 * index }}
                        className="flex gap-3 p-4 rounded-[22px] bg-white/6 border border-white/10"
                      >
                        <div className="w-8 h-8 rounded-full bg-white/12 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {item.step}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                          <p className="text-secondary text-xs mt-1">{item.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Поддерживаемые платформы */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-[24px]"
                >
                  <h2 className="text-xl font-semibold text-white mb-4">{t("verified.platforms")}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {platforms.map((platform) => (
                      <motion.div
                        key={platform.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-4 rounded-[22px] bg-white/6 border border-white/10 cursor-pointer transition-smooth ${
                          formData.platform === platform.id ? 'bg-white/12' : ''
                        }`}
                        onClick={() => setFormData({ ...formData, platform: platform.id })}
                      >
                        <div className="text-white/80 mb-2">{platform.icon}</div>
                        <h3 className="font-semibold text-white text-sm">{platform.name}</h3>
                        <p className="text-secondary text-xs mt-1">{platform.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Требования */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-[24px]"
                >
                  <h2 className="text-xl font-semibold text-white mb-4">{t("verified.requirements")}</h2>
                  <ul className="space-y-3">
                    {[
                      t("verified.requirement1"),
                      t("verified.requirement2"),
                      t("verified.requirement3"),
                      t("verified.requirement4"),
                      t("verified.requirement5"),
                    ].map((req, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 * index }}
                        className="flex items-start gap-3"
                      >
                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-sm text-secondary">{req}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>

                {/* Форма заявки */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <form onSubmit={handleSubmit} id="verification-form" className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-[24px] space-y-5">
                    <div>
                      <label htmlFor="platform" className="block text-sm font-medium text-white mb-2">
                        {t("verified.platformLabel")}
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setPlatformOpen((prev) => !prev)}
                          className="w-full px-4 py-3 rounded-[22px] border border-white/10 bg-black/90 text-left text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                        >
                          <span className={formData.platform ? "text-white" : "text-white/50"}>
                            {formData.platform
                              ? platforms.find((p) => p.id === formData.platform)?.name
                              : t("verified.platformSelect")}
                          </span>
                          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/60">▾</span>
                        </button>
                        {platformOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            className="absolute z-20 mt-2 w-full overflow-hidden rounded-[22px] border border-white/10 bg-black/95 backdrop-blur-[24px]"
                          >
                            {platforms.map((platform) => (
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
                                {platform.name}
                              </button>
                            ))}
                          </motion.div>
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
                        placeholder={getPlaceholder()}
                        className="w-full px-4 py-3 rounded-[22px] border border-white/10 bg-black/40 text-white placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-white/20"
                        required
                      />
                      <p className="text-xs text-secondary mt-1.5">{t("verified.videoUrlHint")}</p>
                    </div>

                    <div>
                      <label htmlFor="reason" className="block text-sm font-medium text-white mb-2">
                        {t("verified.reasonLabel")}
                      </label>
                      <textarea
                        id="reason"
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        placeholder={t("verified.reasonPlaceholder")}
                        className="w-full px-4 py-3 rounded-[22px] border border-white/10 bg-black/40 text-white placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-white/20 min-h-[110px] resize-none"
                        required
                        maxLength={500}
                      />
                      <p className="text-xs text-secondary mt-1.5">{formData.reason.length}/500 {t("feed.characterLimit")}</p>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={submitting || !formData.platform || !formData.reason || !formData.videoUrl}
                      className="w-full py-3.5 rounded-full bg-white/10 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={!submitting && formData.platform && formData.reason && formData.videoUrl ? { scale: 1.02 } : {}}
                      whileTap={!submitting && formData.platform && formData.reason && formData.videoUrl ? { scale: 0.98 } : {}}
                    >
                      {submitting ? t("verified.submitting") : t("verified.submit")}
                    </motion.button>
                  </form>
                </motion.div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Verified;

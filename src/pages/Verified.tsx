import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { profileAPI, verificationAPI } from '@/services/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { BadgeCheck, Github, Globe, CheckCircle, Clock, XCircle, Shield, Crown, Star, Code, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type VerificationStatus = {
  status?: 'pending' | 'approved' | 'rejected' | null;
  reviewNotes?: string;
};

const badgeInfo = [
  { id: 'founder', label: 'Founder', description: 'Started a project or company', icon: Crown },
  { id: 'developer', label: 'Developer', description: 'Has published code on GitHub', icon: Code },
  { id: 'designer', label: 'Designer', description: 'Has design portfolio', icon: Star },
  { id: 'open_source', label: 'Open Source', description: 'Contributed to open source', icon: Users },
  { id: 'maintainer', label: 'Maintainer', description: 'Maintains a project', icon: Shield },
  { id: 'verified_builder', label: 'Verified Builder', description: 'Manually verified by LUME team', icon: BadgeCheck },
];

const Verified = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; username: string; name: string; verified: boolean } | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    githubUrl: '',
    websiteUrl: '',
    projectName: '',
    projectDescription: '',
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userResponse = await profileAPI.getCurrentUser();
        setUser(userResponse.user);

        if (!userResponse.user.verified) {
          try {
            const statusRes = await verificationAPI.getVerificationStatus(userResponse.user.id);
            setVerificationStatus(statusRes.verificationStatus);
          } catch (e) {
            console.error('Failed to get verification status:', e);
          }
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      await verificationAPI.submitVerificationRequest({
        reason: JSON.stringify(formData),
        tiktokVideoUrl: formData.githubUrl,
      });
      toast.success(t('verified.requestSubmitted'));
      const statusRes = await verificationAPI.getVerificationStatus(user.id);
      setVerificationStatus(statusRes.verificationStatus);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err?.message || t('verified.requestError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8 py-6 text-white">
      <div className="text-center">
        <h1 className="text-3xl font-semibold">{t('verified.pageTitle')}</h1>
        <p className="mt-2 text-white/60">{t('verified.pageSubtitle')}</p>
      </div>

      {user.verified ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-green-500/30 bg-green-500/10 p-8 text-center"
        >
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
            <BadgeCheck className="h-10 w-10 text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-green-400">You are a Verified Builder</h2>
          <p className="mt-2 text-white/60">Your profile shows the verified badge, helping you stand out in the community.</p>
        </motion.div>
      ) : verificationStatus?.status === 'pending' ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-8 text-center"
        >
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/20">
            <Clock className="h-10 w-10 text-yellow-400" />
          </div>
          <h2 className="text-xl font-semibold text-yellow-400">{t('verified.statusPending')}</h2>
          <p className="mt-2 text-white/60">Your verification request is being reviewed by our team.</p>
          {verificationStatus?.reviewNotes && (
            <p className="mt-4 text-sm text-white/80">Note: {verificationStatus.reviewNotes}</p>
          )}
        </motion.div>
      ) : verificationStatus?.status === 'rejected' ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center"
        >
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20">
            <XCircle className="h-10 w-10 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-red-400">{t('verified.statusRejected')}</h2>
          <p className="mt-2 text-white/60">Your verification request was not approved.</p>
          {verificationStatus?.reviewNotes && (
            <p className="mt-4 text-sm text-white/80">Reason: {verificationStatus.reviewNotes}</p>
          )}
        </motion.div>
      ) : (
        <>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-xl font-semibold">{t('verified.benefitsTitle')}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <BadgeCheck className="mb-2 h-6 w-6 text-blue-400" />
                <p className="font-medium">{t('verified.benefitBadge')}</p>
                <p className="text-sm text-white/60">Blue badge on your profile</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <Crown className="mb-2 h-6 w-6 text-yellow-400" />
                <p className="font-medium">Priority visibility</p>
                <p className="text-sm text-white/60">Appear higher in Explore</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <Shield className="mb-2 h-6 w-6 text-green-400" />
                <p className="font-medium">Trust signals</p>
                <p className="text-sm text-white/60">More trust from teammates</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <Star className="mb-2 h-6 w-6 text-purple-400" />
                <p className="font-medium">{t('verified.benefitFeatures')}</p>
                <p className="text-sm text-white/60">Early access to new features</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-xl font-semibold">{t('verified.stepsTitle')}</h2>
            <div className="space-y-4">
              {badgeInfo.map((badge, index) => {
                const Icon = badge.icon;
                return (
                  <div key={badge.id} className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Step {index + 1}: {badge.label}</p>
                      <p className="text-sm text-white/60">{badge.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-xl font-semibold">Apply for Verification</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-white/70">GitHub Profile URL</label>
                <div className="flex items-center gap-2 glass-input px-3">
                  <Github className="h-4 w-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="https://github.com/username"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    className="w-full bg-transparent text-white placeholder-white/40 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm text-white/70">Website (optional)</label>
                <div className="flex items-center gap-2 glass-input px-3">
                  <Globe className="h-4 w-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="https://your-project.com"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    className="w-full bg-transparent text-white placeholder-white/40 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm text-white/70">Your Project (optional)</label>
                <input
                  type="text"
                  placeholder="Project name"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  className="glass-input w-full px-5 py-3 text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-white/70">About your work</label>
                <textarea
                  placeholder="Tell us about your projects and experience..."
                  value={formData.projectDescription}
                  onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                  className="glass-input w-full px-5 py-3 text-white"
                  rows={3}
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !formData.githubUrl}
                className="btn-glass w-full py-3"
              >
                {submitting ? 'Submitting...' : 'Submit for Verification'}
              </button>
            </form>
          </div>
        </>
      )}

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-lg font-semibold">{t('verified.verifiedUsersTitle')}</h2>
        <p className="text-sm text-white/60">{t('verified.verifiedUsersHint')}</p>
        <div className="mt-4 flex flex-wrap gap-4">
          {badgeInfo.map((badge) => {
            const Icon = badge.icon;
            return (
              <div key={badge.id} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <Icon className="h-4 w-4 text-blue-400" />
                <span className="text-sm">{badge.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Verified;
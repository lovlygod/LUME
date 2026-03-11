import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { verificationAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const AdminPanel = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  type AdminRequest = {
    id: number;
    name?: string;
    username?: string;
    email?: string;
    reason?: string;
    status?: 'pending' | 'approved' | 'rejected' | string;
    tiktok_video_url?: string;
    created_at?: string;
    reviewed_at?: string;
    reviewer_name?: string;
    review_notes?: string;
  };
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [reviewNotes, setReviewNotes] = useState<{[key: number]: string}>({});

  useEffect(() => {
    loadVerificationRequests();
  }, []);

  const loadVerificationRequests = async () => {
    try {
      const response = await verificationAPI.getVerificationRequests();
      setRequests(response.requests);
    } catch (error: unknown) {
      console.error('Failed to load verification requests:', error);
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("toast.loadVerificationError"),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId: number, status: 'approved' | 'rejected') => {
    setReviewing(requestId);
    try {
      await verificationAPI.reviewVerificationRequest(requestId, {
        status,
        reviewNotes: reviewNotes[requestId] || ''
      });
      
      toast({
        title: t("common.success"),
        description: status === 'approved' ? t("admin.approveSuccess") : t("admin.rejectSuccess")
      });

      // Refresh the list
      loadVerificationRequests();
    } catch (error: unknown) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("admin.reviewError"),
        variant: 'destructive'
      });
    } finally {
      setReviewing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-panel p-6"
        >
          <h1 className="text-2xl font-bold text-foreground mb-6">{t("admin.title")}</h1>
          
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-secondary">{t("admin.noRequests")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border border-white/10 rounded-2xl p-4 bg-white/6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-white">{t("admin.userInfo")}</h3>
                      <p className="text-sm text-secondary">{t("admin.name")}: {request.name ?? '-'}</p>
                      <p className="text-sm text-secondary">{t("admin.username")}: {request.username ?? '-'}</p>
                      <p className="text-sm text-secondary">{t("admin.email")}: {request.email ?? '-'}</p>
                      <p className="text-sm text-secondary">{t("admin.requestId")}: #{request.id}</p>
                      <p className="text-sm text-secondary">{t("admin.submitted")}: {request.created_at ? new Date(request.created_at).toLocaleString() : '-'}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-white">{t("admin.requestDetails")}</h3>
                      <p className="text-sm text-secondary">{t("admin.status")}:
                        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                          request.status === 'pending' ? 'bg-white/10 text-white' :
                          request.status === 'approved' ? 'bg-white/15 text-white' :
                          'bg-white/5 text-red-200'
                        }`}>
                          {request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : 'Unknown'}
                        </span>
                      </p>
                      {request.reviewed_at && (
                        <p className="text-sm text-secondary">{t("admin.reviewed")}: {new Date(request.reviewed_at).toLocaleString()}</p>
                      )}
                      {request.reviewer_name && (
                        <p className="text-sm text-secondary">{t("admin.reviewer")}: {request.reviewer_name}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="font-semibold text-white mb-2">{t("admin.tiktokVideo")}</h3>
                    {request.tiktok_video_url ? (
                      <a
                        href={request.tiktok_video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-white/80 hover:underline break-all"
                      >
                        {request.tiktok_video_url}
                      </a>
                    ) : (
                      <p className="text-sm text-secondary">-</p>
                    )}
                  </div>

                  <div className="mt-4">
                    <h3 className="font-semibold text-white mb-2">{t("admin.reason")}</h3>
                    <p className="text-sm text-secondary">{request.reason ?? '-'}</p>
                  </div>

                  {request.review_notes && (
                    <div className="mt-4">
                      <h3 className="font-semibold text-white mb-2">{t("admin.reviewNotes")}</h3>
                      <p className="text-sm text-secondary">{request.review_notes}</p>
                    </div>
                  )}
                  
                  {request.status === 'pending' && (
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      <div className="flex-1">
                        <label htmlFor={`notes-${request.id}`} className="block text-sm font-medium text-white mb-1">
                          {t("admin.reviewNotes")} ({t("common.optional").toLowerCase()})
                        </label>
                        <textarea
                          id={`notes-${request.id}`}
                          value={reviewNotes[request.id] || ''}
                          onChange={(e) => setReviewNotes({
                            ...reviewNotes,
                            [request.id]: e.target.value
                          })}
                          placeholder={t("admin.reviewNotesPlaceholder")}
                          className="w-full px-3 py-2 rounded-2xl border border-white/10 bg-white/6 text-white focus:outline-none focus:ring-1 focus:ring-white/30 min-h-[60px]"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          className="text-red-200 hover:bg-white/5"
                          onClick={() => handleReview(request.id, 'rejected')}
                          disabled={reviewing === request.id}
                        >
                          {reviewing === request.id ? t("admin.rejecting") : t("admin.reject")}
                        </Button>

                        <Button
                          className="bg-white/10 hover:bg-white/15"
                          onClick={() => handleReview(request.id, 'approved')}
                          disabled={reviewing === request.id}
                        >
                          {reviewing === request.id ? t("admin.approving") : t("admin.approve")}
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPanel;
